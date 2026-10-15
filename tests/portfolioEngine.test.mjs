import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRiskMetrics,
  computeRebalanceTrades,
  runMonteCarloProjection,
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

test('computeRiskMetrics handles empty or single-point series safely', () => {
  const empty = computeRiskMetrics([]);
  assert.equal(empty.periods, 0);
  assert.equal(empty.totalReturnPct, 0);
  assert.equal(empty.maxDrawdownPct, 0);
});

test('computeRebalanceTrades executes SELLs before BUYs and conserves cash reserve', () => {
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
});

test('runMonteCarloProjection is deterministic for a fixed seed and produces ordered percentiles', () => {
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
    initialWealth: 10000,
    annualContribution: 1200,
    expectedReturn: 0.08,
    volatility: 0.15,
    years: 10,
    paths: 400,
    seed: 1337,
  });

  assert.deepEqual(p1, p2);
  assert.ok(p1.p10 <= p1.p25);
  assert.ok(p1.p25 <= p1.p50);
  assert.ok(p1.p50 <= p1.p75);
  assert.ok(p1.p75 <= p1.p90);
  assert.ok(p1.probAbovePrincipal > 0.75);
});
