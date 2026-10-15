#!/usr/bin/env node
import {
  computeRiskMetrics,
  computeRebalanceTrades,
  runMonteCarloProjection,
} from '../src/quant/portfolioEngine.mjs';

const cmd = process.argv[2] || 'metrics';

if (cmd === 'metrics') {
  const curve = [10000, 11200, 10400, 12100, 13800, 12900, 15400];
  console.log(JSON.stringify(computeRiskMetrics(curve, { riskFreeRate: 0.04 }), null, 2));
} else if (cmd === 'rebalance') {
  const plan = computeRebalanceTrades({
    holdings: {
      NVDA: { shares: 40, averageCost: 90 },
      SPY: { shares: 10, averageCost: 450 },
      BND: { shares: 5, averageCost: 75 },
    },
    prices: { NVDA: 135, SPY: 520, QQQ: 440, BND: 74, GLD: 215 },
    cashBalance: 1200,
    riskProfile: 'moderate',
  });
  console.log(JSON.stringify(plan, null, 2));
} else if (cmd === 'montecarlo') {
  const proj = runMonteCarloProjection({
    initialWealth: 15000,
    annualContribution: 3600,
    expectedReturn: 0.085,
    volatility: 0.15,
    years: 15,
    paths: 1000,
    seed: 2026,
  });
  console.log(JSON.stringify(proj, null, 2));
} else {
  console.error(`Unknown subcommand: ${cmd}. Use metrics | rebalance | montecarlo`);
  process.exit(1);
}
