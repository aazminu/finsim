import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  computeRiskMetrics,
  computeRebalanceTrades,
  runMonteCarloProjection,
  registerPortfolioRoutes,
} from '../src/quant/portfolioEngine.mjs';

test('computeRiskMetrics calculates CAGR, Sharpe, Sortino, Max Drawdown, VaR, and CVaR', () => {
  const curve = [10000, 11500, 9800, 11200, 13000, 14500];
  const m = computeRiskMetrics(curve, { riskFreeRate: 0.03, periodsPerYear: 1 });

  assert.equal(m.periods, 5);
  assert.equal(m.totalReturnPct, 45.0);
  assert.ok(m.cagrPct > 7.0 && m.cagrPct < 8.5);
  // Peak 11500 -> trough 9800 is 14.78% drawdown
  assert.equal(m.maxDrawdownPct, 14.78);
  assert.ok(m.sharpeRatio > 0.3);
  assert.ok(m.sortinoRatio > 0.3);
  assert.ok(m.var95Pct >= 14.0);
  assert.ok(m.cvar95Pct >= m.var95Pct);
});

test('computeRiskMetrics handles empty, non-array, or invalid periodsPerYear safely', () => {
  const empty = computeRiskMetrics([]);
  assert.equal(empty.periods, 0);
  assert.equal(empty.totalReturnPct, 0);
  assert.equal(empty.maxDrawdownPct, 0);

  const nonArray = computeRiskMetrics('not-an-array');
  assert.equal(nonArray.periods, 0);

  const zeroPpy = computeRiskMetrics([1000, 1100, 1210], { periodsPerYear: 0 });
  assert.equal(zeroPpy.periods, 2);
  assert.equal(Number.isFinite(zeroPpy.sharpeRatio), true);
  assert.equal(Number.isFinite(zeroPpy.sortinoRatio), true);
});

test('computeRebalanceTrades executes SELLs before BUYs, conserves cash reserve, and honors position currentPrice', () => {
  // Overweight tech_growth (NVDA = $8,000), underweight equity_index and fixed_income
  const res = computeRebalanceTrades({
    holdings: {
      NVDA: { shares: 80, averageCost: 50 },
    },
    prices: {
      NVDA: 100,
      SPY: 500,
      BND: 80,
      GLD: 200,
    },
    cashBalance: 2000,
    riskProfile: 'conservative',
    minTradeUsd: 50,
  });

  assert.equal(res.totalWealth, 10000);
  assert.ok(res.l1Drift > 0.5);
  assert.ok(res.trades.length >= 3);
  // First trade must be SELL NVDA
  assert.equal(res.trades[0].side, 'SELL');
  assert.equal(res.trades[0].ticker, 'NVDA');
  // Projected cash balance must stay non-negative and respect conservative 15% cash reserve ($1,500)
  assert.ok(res.projectedCashBalance >= 1499.0);

  // Verify position currentPrice is used when prices map is omitted
  const fromPosPrice = computeRebalanceTrades({
    holdings: {
      NVDA: { shares: 10, currentPrice: 500 },
    },
    prices: {},
    cashBalance: 0,
    riskProfile: 'moderate',
  });
  assert.equal(fromPosPrice.totalWealth, 5000);
  assert.equal(fromPosPrice.trades[0].side, 'SELL');
  assert.equal(fromPosPrice.trades[0].price, 500);
  assert.equal(fromPosPrice.trades[0].shares, 8);
});

test('runMonteCarloProjection is deterministic for a fixed seed, produces ordered percentiles, and coerces string/zero inputs', () => {
  const p1 = runMonteCarloProjection({
    initialWealth: 10000,
    annualContribution: 1200,
    expectedReturn: 0.08,
    volatility: 0.15,
    years: 10,
    paths: 400,
    seed: 1337,
  });
  const p2 = runMonteCarloProjection({
    initialWealth: '10000',
    annualContribution: '1200',
    expectedReturn: 0.08,
    volatility: 0.15,
    years: 10,
    paths: 400,
    seed: 1337,
  });

  assert.deepEqual(p1, p2);
  assert.equal(p2.totalInvested, 22000);
  assert.ok(p1.p10 <= p1.p25);
  assert.ok(p1.p25 <= p1.p50);
  assert.ok(p1.p50 <= p1.p75);
  assert.ok(p1.p75 <= p1.p90);
  assert.ok(p1.probAbovePrincipal > 0.75);

  const zeroPaths = runMonteCarloProjection({ initialWealth: 5000, paths: 0, years: 0 });
  assert.equal(zeroPaths.p50, 5000);
});

test('registerPortfolioRoutes serves /api/portfolio/metrics, /rebalance, and /montecarlo over live HTTP', async () => {
  const routes = new Map();
  const appShim = {
    post(routePath, handler) {
      routes.set(routePath, handler);
    },
  };
  registerPortfolioRoutes(appShim);

  const server = http.createServer((req, res) => {
    const handler = routes.get(req.url);
    if (req.method !== 'POST' || !handler) {
      res.writeHead(404);
      res.end();
      return;
    }
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      handler(
        { body },
        {
          json(payload) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(payload));
          },
        }
      );
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const metricsRes = await fetch(`${baseUrl}/api/portfolio/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wealthSeries: [10000, 11000, 12500] }),
    });
    const metricsJson = await metricsRes.json();
    assert.equal(metricsJson.periods, 2);
    assert.equal(metricsJson.totalReturnPct, 25);

    const rebRes = await fetch(`${baseUrl}/api/portfolio/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holdings: { NVDA: { shares: 10, currentPrice: 500 } },
        cashBalance: 1000,
        riskProfile: 'moderate',
      }),
    });
    const rebJson = await rebRes.json();
    assert.equal(rebJson.totalWealth, 6000);
    assert.equal(rebJson.trades[0].side, 'SELL');

    const mcRes = await fetch(`${baseUrl}/api/portfolio/montecarlo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialWealth: '10000', annualContribution: 1000, years: 5, paths: 100, seed: 7 }),
    });
    const mcJson = await mcRes.json();
    assert.equal(mcJson.totalInvested, 15000);
    assert.ok(mcJson.p90 >= mcJson.p10);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

