import type { BacktestResult, QuantitativeMetrics } from '../types';

export function generateOverviewInsight(
  metricsMap: Record<string, QuantitativeMetrics>,
  topPerformerId: string,
  lowestRiskId: string,
  topPerformerName: string,
  lowestRiskName: string
): string {
  const topMetrics = metricsMap[topPerformerId];
  const lowRiskMetrics = metricsMap[lowestRiskId];

  if (!topMetrics || !lowRiskMetrics) {
    return 'Multi-asset performance metrics reflect distinct structural risk premiums across commodities, equities, and digital assets.';
  }

  const volRatio = lowRiskMetrics.annualizedVol > 0 ? (topMetrics.annualizedVol / lowRiskMetrics.annualizedVol).toFixed(1) : '1.0';

  return `${topPerformerName} led cumulative returns over this window (+${topMetrics.totalReturn.toFixed(1)}%), but carried ${volRatio}x higher annualized volatility (${topMetrics.annualizedVol.toFixed(1)}% vs ${lowRiskMetrics.annualizedVol.toFixed(1)}%) and a deeper maximum drawdown (${topMetrics.maxDrawdown.toFixed(1)}%). Conversely, ${lowestRiskName} preserved capital with superior downside resilience, illustrating the classical risk-return tradeoff across uncorrelated asset classes.`;
}

export function generateStrategyVerdict(result: BacktestResult): string {
  const { metrics, trades } = result;
  const { strategy, benchmark, alpha, totalFees, profitFactor, winRate } = metrics;

  if (trades.length === 0) {
    return 'The strategy generated no execution triggers during this period due to inactive indicator criteria. Capital remained 100% in cash with zero transaction slippage.';
  }

  const outperforming = alpha > 0;

  if (outperforming) {
    return `The strategy outperformed buy-and-hold by ${alpha > 0 ? '+' : ''}${alpha.toFixed(1)}% net alpha, achieving a Sharpe Ratio of ${strategy.sharpeRatio.toFixed(2)} (vs benchmark ${benchmark.sharpeRatio.toFixed(2)}). Total transaction costs amounted to $${totalFees.toFixed(2)} across ${trades.length} trades with a ${winRate.toFixed(1)}% win rate and ${profitFactor.toFixed(2)} profit factor. The maximum drawdown was contained to ${strategy.maxDrawdown.toFixed(1)}% vs ${benchmark.maxDrawdown.toFixed(1)}% for buy-and-hold.`;
  } else {
    return `The strategy underperformed the passive buy-and-hold benchmark by ${Math.abs(alpha).toFixed(1)}% after deducting $${totalFees.toFixed(2)} in cumulative transaction frictions and slippage. While trade signals limited downside drawdown to ${strategy.maxDrawdown.toFixed(1)}% (vs benchmark ${benchmark.maxDrawdown.toFixed(1)}%), frequent whip-saws resulted in cash drag during major expansion legs.`;
  }
}

export function generateCorrelationInsight(
  assetA: string,
  assetB: string,
  currentCorr: number,
  avgCorr: number,
  minCorr: number,
  maxCorr: number
): string {
  let commentary = '';

  if (avgCorr < 0.2) {
    commentary = 'Historically demonstrates low to decorrelated price co-movement, providing meaningful portfolio variance dampening.';
  } else if (avgCorr < 0.5) {
    commentary = 'Exhibits moderate cross-asset correlation, allowing for partial diversification benefits with occasional shared beta shocks.';
  } else {
    commentary = 'Displays pronounced positive co-movement, indicating shared liquidity and macroeconomic risk factor exposure.';
  }

  return `${assetA} and ${assetB} currently hold a rolling 60-day correlation of ${currentCorr > 0 ? '+' : ''}${currentCorr.toFixed(2)} (historical mean: ${avgCorr > 0 ? '+' : ''}${avgCorr.toFixed(2)}, observed range: ${minCorr.toFixed(2)} to ${maxCorr.toFixed(2)}). ${commentary} Note that historical correlation regimes shift dynamically during liquidity crunches, debunking static diversification assumptions.`;
}
