/**
 * FinSim Quantitative Portfolio Risk Analytics, Regime Rebalancer,
 * and Seeded Monte Carlo Wealth Projection Engine.
 */

export const ASSET_CLASS_BY_TICKER = {
  SPY: 'equity_index',
  VTI: 'equity_index',
  QQQ: 'tech_growth',
  NVDA: 'tech_growth',
  AAPL: 'tech_growth',
  MSFT: 'tech_growth',
  BND: 'fixed_income',
  TLT: 'fixed_income',
  GLD: 'commodities',
  BTC: 'crypto',
};

export const TARGET_WEIGHTS_BY_PROFILE = {
  conservative: {
    equity_index: 0.30,
    tech_growth: 0.05,
    fixed_income: 0.45,
    commodities: 0.05,
    cash: 0.15,
  },
  moderate: {
    equity_index: 0.45,
    tech_growth: 0.20,
    fixed_income: 0.20,
    commodities: 0.05,
    cash: 0.10,
  },
  aggressive: {
    equity_index: 0.40,
    tech_growth: 0.40,
    fixed_income: 0.05,
    commodities: 0.10,
    cash: 0.05,
  },
};

/**
 * Compute quantitative risk and return metrics from a sequence of portfolio wealth snapshots.
 * @param {number[]} wealthSeries
 * @param {{riskFreeRate?: number, periodsPerYear?: number}} options
 */
export function computeRiskMetrics(
  wealthSeries,
  { riskFreeRate = 0.04, periodsPerYear = 1 } = {}
) {
  const valid = (wealthSeries || []).map(Number).filter((v) => Number.isFinite(v) && v > 0);
  if (valid.length < 2) {
    return {
      periods: 0,
      totalReturnPct: 0,
      cagrPct: 0,
      annualizedVolatilityPct: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdownPct: 0,
      var95Pct: 0,
      cvar95Pct: 0,
    };
  }

  const returns = [];
  for (let i = 1; i < valid.length; i++) {
    returns.push((valid[i] - valid[i - 1]) / valid[i - 1]);
  }

  const n = returns.length;
  const startVal = valid[0];
  const endVal = valid[valid.length - 1];
  const totalReturn = (endVal - startVal) / startVal;
  const years = n / periodsPerYear;
  const cagr = years > 0 ? Math.pow(endVal / startVal, 1 / years) - 1 : totalReturn;

  const meanPeriodRet = returns.reduce((a, b) => a + b, 0) / n;
  const rfPeriod = riskFreeRate / periodsPerYear;

  const variance =
    n > 1
      ? returns.reduce((acc, r) => acc + Math.pow(r - meanPeriodRet, 2), 0) / (n - 1)
      : 0;
  const periodVol = Math.sqrt(Math.max(0, variance));
  const annVol = periodVol * Math.sqrt(periodsPerYear);

  const excessPeriodRet = meanPeriodRet - rfPeriod;
  const sharpe =
    periodVol > 1e-9 ? (excessPeriodRet / periodVol) * Math.sqrt(periodsPerYear) : 0;

  // Downside deviation relative to riskFreeRate
  const downsideSq = returns.map((r) => Math.pow(Math.min(0, r - rfPeriod), 2));
  const downsideDevPeriod = Math.sqrt(downsideSq.reduce((a, b) => a + b, 0) / n);
  const sortino =
    downsideDevPeriod > 1e-9
      ? (excessPeriodRet / downsideDevPeriod) * Math.sqrt(periodsPerYear)
      : sharpe > 0
      ? 10.0
      : 0;

  // Maximum drawdown
  let peak = valid[0];
  let maxDd = 0;
  for (const w of valid) {
    if (w > peak) peak = w;
    const dd = peak > 0 ? (peak - w) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }

  // Historical VaR(95%) and CVaR(95%) (expressed as positive loss percentages)
  const sortedRets = [...returns].sort((a, b) => a - b);
  const tailIdx = Math.max(0, Math.floor(0.05 * sortedRets.length));
  const var95 = Math.max(0, -sortedRets[tailIdx]);
  const tailSlice = sortedRets.slice(0, tailIdx + 1);
  const cvar95 =
    tailSlice.length > 0
      ? Math.max(0, -(tailSlice.reduce((a, b) => a + b, 0) / tailSlice.length))
      : var95;

  return {
    periods: n,
    totalReturnPct: Number((totalReturn * 100).toFixed(2)),
    cagrPct: Number((cagr * 100).toFixed(2)),
    annualizedVolatilityPct: Number((annVol * 100).toFixed(2)),
    sharpeRatio: Number(sharpe.toFixed(3)),
    sortinoRatio: Number(sortino.toFixed(3)),
    maxDrawdownPct: Number((maxDd * 100).toFixed(2)),
    var95Pct: Number((var95 * 100).toFixed(2)),
    cvar95Pct: Number((cvar95 * 100).toFixed(2)),
  };
}

/**
 * Compute portfolio asset-class weight drift and generate cash-safe rebalance trades
 * (executing SELL orders before BUY orders so cash never goes negative).
 */
export function computeRebalanceTrades({
  holdings = {},
  prices = {},
  cashBalance = 0,
  riskProfile = 'moderate',
  minTradeUsd = 50,
} = {}) {
  const profileKey = String(riskProfile || 'moderate').toLowerCase();
  const targetBuckets =
    TARGET_WEIGHTS_BY_PROFILE[profileKey] || TARGET_WEIGHTS_BY_PROFILE.moderate;

  const defaultTickerForBucket = {
    equity_index: 'SPY',
    tech_growth: 'QQQ',
    fixed_income: 'BND',
    commodities: 'GLD',
  };

  let holdingsValue = 0;
  const bucketValue = {
    equity_index: 0,
    tech_growth: 0,
    fixed_income: 0,
    commodities: 0,
    cash: Math.max(0, Number(cashBalance) || 0),
  };

  const tickerByBucket = { ...defaultTickerForBucket };

  for (const [ticker, pos] of Object.entries(holdings || {})) {
    const shares = Number(pos?.shares ?? pos) || 0;
    const price = Number(prices[ticker] ?? pos?.currentPrice ?? pos?.averageCost) || 0;
    if (shares <= 0 || price <= 0) continue;
    const val = shares * price;
    holdingsValue += val;
    const bucket = ASSET_CLASS_BY_TICKER[ticker] || 'equity_index';
    if (bucket in bucketValue) {
      bucketValue[bucket] += val;
      tickerByBucket[bucket] = ticker;
    } else {
      bucketValue.equity_index += val;
    }
  }

  const totalWealth = holdingsValue + bucketValue.cash;
  if (totalWealth <= 0) {
    return {
      totalWealth: 0,
      l1Drift: 0,
      currentWeights: {},
      targetWeights: targetBuckets,
      trades: [],
      projectedCashBalance: 0,
    };
  }

  const currentWeights = {};
  let l1Drift = 0;
  for (const b of Object.keys(targetBuckets)) {
    currentWeights[b] = Number(((bucketValue[b] || 0) / totalWealth).toFixed(4));
    l1Drift += Math.abs(currentWeights[b] - targetBuckets[b]);
  }

  const rawSells = [];
  const rawBuys = [];

  for (const [bucket, targetW] of Object.entries(targetBuckets)) {
    if (bucket === 'cash') continue;
    const targetVal = totalWealth * targetW;
    const currVal = bucketValue[bucket] || 0;
    const diffUsd = targetVal - currVal;
    if (Math.abs(diffUsd) < minTradeUsd) continue;

    const ticker = tickerByBucket[bucket];
    const price = Number(prices[ticker]) || 100;
    if (price <= 0) continue;

    if (diffUsd < 0) {
      const sharesToSell = Number((Math.abs(diffUsd) / price).toFixed(4));
      rawSells.push({
        side: 'SELL',
        bucket,
        ticker,
        shares: sharesToSell,
        price,
        notionalUsd: Number((sharesToSell * price).toFixed(2)),
      });
    } else {
      rawBuys.push({
        side: 'BUY',
        bucket,
        ticker,
        desiredUsd: diffUsd,
        price,
      });
    }
  }

  let availableCash = bucketValue.cash;
  const executedTrades = [];

  for (const sell of rawSells) {
    availableCash += sell.notionalUsd;
    executedTrades.push(sell);
  }

  const reserveCashTarget = totalWealth * (targetBuckets.cash || 0);
  let spendableCash = Math.max(0, availableCash - reserveCashTarget);

  for (const buy of rawBuys) {
    const allocUsd = Math.min(buy.desiredUsd, spendableCash);
    if (allocUsd < minTradeUsd) continue;
    const shares = Number((allocUsd / buy.price).toFixed(4));
    const notionalUsd = Number((shares * buy.price).toFixed(2));
    spendableCash -= notionalUsd;
    availableCash -= notionalUsd;
    executedTrades.push({
      side: 'BUY',
      bucket: buy.bucket,
      ticker: buy.ticker,
      shares,
      price: buy.price,
      notionalUsd,
    });
  }

  return {
    totalWealth: Number(totalWealth.toFixed(2)),
    l1Drift: Number(l1Drift.toFixed(4)),
    currentWeights,
    targetWeights: targetBuckets,
    trades: executedTrades,
    projectedCashBalance: Number(availableCash.toFixed(2)),
  };
}

function createSeededRng(seed = 42) {
  let a = seed >>> 0;
  return function nextUniform() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic seeded Monte Carlo Geometric Brownian Motion wealth simulator.
 */
export function runMonteCarloProjection({
  initialWealth = 10000,
  annualContribution = 2400,
  expectedReturn = 0.08,
  volatility = 0.16,
  years = 10,
  paths = 500,
  seed = 42,
} = {}) {
  const rng = createSeededRng(seed);
  const terminalValues = [];
  const drift = expectedReturn - 0.5 * volatility * volatility;

  for (let p = 0; p < paths; p++) {
    let w = Math.max(0, Number(initialWealth) || 0);
    for (let y = 0; y < years; y++) {
      const u1 = Math.max(1e-12, rng());
      const u2 = rng();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const growth = Math.exp(drift + volatility * z);
      w = w * growth + annualContribution;
    }
    terminalValues.push(w);
  }

  terminalValues.sort((a, b) => a - b);
  const pct = (q) => {
    const idx = Math.min(
      terminalValues.length - 1,
      Math.max(0, Math.floor(q * (terminalValues.length - 1)))
    );
    return Number(terminalValues[idx].toFixed(2));
  };

  const totalInvested = initialWealth + annualContribution * years;
  const winCount = terminalValues.filter((v) => v > totalInvested).length;

  return {
    initialWealth,
    annualContribution,
    years,
    paths,
    totalInvested,
    p10: pct(0.10),
    p25: pct(0.25),
    p50: pct(0.50),
    p75: pct(0.75),
    p90: pct(0.90),
    probAbovePrincipal: Number((winCount / paths).toFixed(4)),
  };
}
