import { OHLCVBar, QuantitativeMetrics } from '../types';
import { calculateDailyReturns, calculateDrawdownSeries } from './indicators';

export function calculateMetricsFromBars(
  bars: OHLCVBar[],
  riskFreeRate: number = 0.04 // 4.0% annualized
): QuantitativeMetrics {
  if (!bars || bars.length < 2) {
    return {
      totalReturn: 0,
      cagr: 0,
      dailyVol: 0,
      annualizedVol: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDays: 0,
      winRate: 0,
      bestDay: { date: '-', returnPct: 0 },
      worstDay: { date: '-', returnPct: 0 },
      positiveDays: 0,
      negativeDays: 0,
      totalDays: bars ? bars.length : 0,
    };
  }

  const closes = bars.map(b => b.close);
  const returns = calculateDailyReturns(closes);
  const nonZeroReturns = returns.slice(1); // exclude day 0

  const firstPrice = closes[0];
  const lastPrice = closes[closes.length - 1];
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Compute calendar days for CAGR
  const startDate = new Date(bars[0].date);
  const endDate = new Date(bars[bars.length - 1].date);
  const diffTime = Math.max(1, endDate.getTime() - startDate.getTime());
  const years = diffTime / (1000 * 3600 * 24 * 365.25);
  const cagr = years > 0.08 && firstPrice > 0 ? (Math.pow(lastPrice / firstPrice, 1 / years) - 1) * 100 : totalReturn;

  // Daily volatility and annualized volatility
  const meanDaily = nonZeroReturns.reduce((a, b) => a + b, 0) / nonZeroReturns.length;
  const variance = nonZeroReturns.reduce((acc, r) => acc + Math.pow(r - meanDaily, 2), 0) / (nonZeroReturns.length - 1);
  const dailyVol = Math.sqrt(Math.max(0, variance));
  const annualizedVol = dailyVol * Math.sqrt(252) * 100; // in %

  // Annualized return for Sharpe
  const annualizedReturn = (cagr / 100);

  // Sharpe Ratio
  const annVolFraction = annualizedVol / 100;
  const sharpeRatio = annVolFraction > 0 ? (annualizedReturn - riskFreeRate) / annVolFraction : 0;

  // Sortino: Downside deviation (only negative daily returns)
  const downsideSquared = nonZeroReturns.reduce((acc, r) => {
    return r < 0 ? acc + Math.pow(r, 2) : acc;
  }, 0);
  const downsideDev = Math.sqrt(downsideSquared / nonZeroReturns.length);
  const annDownsideDev = downsideDev * Math.sqrt(252);
  const sortinoRatio = annDownsideDev > 0 ? (annualizedReturn - riskFreeRate) / annDownsideDev : 0;

  // Drawdown
  const { drawdownPct } = calculateDrawdownSeries(closes);
  let maxDrawdown = 0;
  let maxDrawdownDays = 0;
  let currentDdStreak = 0;

  for (let i = 0; i < drawdownPct.length; i++) {
    if (drawdownPct[i] < maxDrawdown) {
      maxDrawdown = drawdownPct[i];
    }
    if (drawdownPct[i] < 0) {
      currentDdStreak++;
      if (currentDdStreak > maxDrawdownDays) {
        maxDrawdownDays = currentDdStreak;
      }
    } else {
      currentDdStreak = 0;
    }
  }

  // Calmar Ratio: CAGR / abs(Max Drawdown)
  const absMaxDd = Math.abs(maxDrawdown);
  const calmarRatio = absMaxDd > 0 ? (cagr / absMaxDd) : 0;

  // Positive vs Negative Days & Win Rate
  let positiveDays = 0;
  let negativeDays = 0;
  let bestDay = { date: bars[1]?.date || bars[0].date, returnPct: -Infinity };
  let worstDay = { date: bars[1]?.date || bars[0].date, returnPct: Infinity };

  for (let i = 1; i < bars.length; i++) {
    const r = returns[i] * 100;
    if (r > 0) positiveDays++;
    if (r < 0) negativeDays++;

    if (r > bestDay.returnPct) {
      bestDay = { date: bars[i].date, returnPct: Number(r.toFixed(2)) };
    }
    if (r < worstDay.returnPct) {
      worstDay = { date: bars[i].date, returnPct: Number(r.toFixed(2)) };
    }
  }

  const winRate = nonZeroReturns.length > 0 ? (positiveDays / nonZeroReturns.length) * 100 : 0;

  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    cagr: Number(cagr.toFixed(2)),
    dailyVol: Number((dailyVol * 100).toFixed(2)),
    annualizedVol: Number(annualizedVol.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    calmarRatio: Number(calmarRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownDays,
    winRate: Number(winRate.toFixed(2)),
    bestDay: bestDay.returnPct === -Infinity ? { date: '-', returnPct: 0 } : bestDay,
    worstDay: worstDay.returnPct === Infinity ? { date: '-', returnPct: 0 } : worstDay,
    positiveDays,
    negativeDays,
    totalDays: bars.length,
  };
}

export function calculateRollingReturns(bars: OHLCVBar[]): {
  '1M': number | null;
  '3M': number | null;
  '6M': number | null;
  '1Y': number | null;
  '3Y': number | null;
} {
  if (!bars || bars.length === 0) {
    return { '1M': null, '3M': null, '6M': null, '1Y': null, '3Y': null };
  }

  const lastBar = bars[bars.length - 1];
  const lastDate = new Date(lastBar.date);
  const currentPrice = lastBar.close;

  function getReturnForDays(daysAgo: number): number | null {
    const targetTime = lastDate.getTime() - daysAgo * 24 * 3600 * 1000;
    // Find closest bar on or before targetTime
    let closestBar: OHLCVBar | null = null;
    let minDiff = Infinity;

    for (let i = bars.length - 1; i >= 0; i--) {
      const t = new Date(bars[i].date).getTime();
      const diff = Math.abs(t - targetTime);
      if (diff < minDiff && diff < 7 * 24 * 3600 * 1000) { // within 7 days
        minDiff = diff;
        closestBar = bars[i];
      }
    }

    if (!closestBar || closestBar.close <= 0) return null;
    return Number((((currentPrice - closestBar.close) / closestBar.close) * 100).toFixed(2));
  }

  return {
    '1M': getReturnForDays(30),
    '3M': getReturnForDays(90),
    '6M': getReturnForDays(180),
    '1Y': getReturnForDays(365),
    '3Y': getReturnForDays(365 * 3),
  };
}
