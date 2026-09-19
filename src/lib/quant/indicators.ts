import { OHLCVBar, RollingCorrelationPoint } from '../types';

// Simple Moving Average
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (period <= 0 || data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }

  return result;
}

// Exponential Moving Average
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (period <= 0 || data.length < period) return result;

  const k = 2 / (period + 1);

  // Initial SMA as first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEma = sum / period;
  result[period - 1] = prevEma;

  for (let i = period; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    result[i] = currentEma;
    prevEma = currentEma;
  }

  return result;
}

// Daily percentage returns: (P_t - P_{t-1}) / P_{t-1}
export function calculateDailyReturns(closes: number[]): number[] {
  const returns: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    returns.push(prev > 0 ? (closes[i] - prev) / prev : 0);
  }
  return returns;
}

// Rolling Annualized Volatility (default 20 bars, annualized via sqrt(252))
export function calculateRollingAnnualizedVol(closes: number[], window: number = 20): (number | null)[] {
  const returns = calculateDailyReturns(closes);
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < window) return result;

  const annFactor = Math.sqrt(252) * 100; // in percentage

  for (let i = window - 1; i < returns.length; i++) {
    const slice = returns.slice(i - window + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / window;
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (window - 1);
    const dailyStd = Math.sqrt(Math.max(0, variance));
    result[i] = Number((dailyStd * annFactor).toFixed(2));
  }

  return result;
}

// Underwater Drawdown Series
export function calculateDrawdownSeries(prices: number[]): { drawdownPct: number[]; peak: number[] } {
  const drawdownPct: number[] = [];
  const peak: number[] = [];
  let currentPeak = -Infinity;

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    if (p > currentPeak) {
      currentPeak = p;
    }
    peak.push(currentPeak);
    const dd = currentPeak > 0 ? ((p - currentPeak) / currentPeak) * 100 : 0;
    drawdownPct.push(Number(dd.toFixed(2)));
  }

  return { drawdownPct, peak };
}

// Pearson Correlation between two numerical series
export function calculatePearson(seriesA: number[], seriesB: number[]): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += seriesA[i];
    sumB += seriesB[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let num = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = seriesA[i] - meanA;
    const diffB = seriesB[i] - meanB;
    num += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denom = Math.sqrt(denomA * denomB);
  if (denom === 0) return 0;
  const r = num / denom;
  return Math.max(-1, Math.min(1, Number(r.toFixed(4))));
}

// Rolling Pearson Correlation over a sliding window
export function calculateRollingCorrelation(
  barsA: OHLCVBar[],
  barsB: OHLCVBar[],
  window: number = 60
): RollingCorrelationPoint[] {
  // Synchronize on matching dates
  const mapB = new Map<string, number>();
  barsB.forEach(b => mapB.set(b.date, b.close));

  const alignedDates: string[] = [];
  const alignedClosesA: number[] = [];
  const alignedClosesB: number[] = [];

  barsA.forEach(a => {
    if (mapB.has(a.date)) {
      alignedDates.push(a.date);
      alignedClosesA.push(a.close);
      alignedClosesB.push(mapB.get(a.date)!);
    }
  });

  const returnsA = calculateDailyReturns(alignedClosesA);
  const returnsB = calculateDailyReturns(alignedClosesB);

  const points: RollingCorrelationPoint[] = [];

  for (let i = window - 1; i < alignedDates.length; i++) {
    const sliceA = returnsA.slice(i - window + 1, i + 1);
    const sliceB = returnsB.slice(i - window + 1, i + 1);
    const corr = calculatePearson(sliceA, sliceB);
    points.push({
      date: alignedDates[i],
      correlation: corr,
    });
  }

  return points;
}

// Bollinger Bands & Z-Scores
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2.0
): {
  upper: (number | null)[];
  lower: (number | null)[];
  sma: (number | null)[];
  zScore: (number | null)[];
} {
  const sma = calculateSMA(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);
  const zScore: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const mean = sma[i];
    if (mean === null) continue;

    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper[i] = Number((mean + stdDevMultiplier * std).toFixed(2));
    lower[i] = Number((mean - stdDevMultiplier * std).toFixed(2));
    zScore[i] = std > 0 ? Number(((closes[i] - mean) / std).toFixed(3)) : 0;
  }

  return { upper, lower, sma, zScore };
}

// Rate of Change (ROC / Momentum)
export function calculateROC(closes: number[], lookback: number = 20): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = lookback; i < closes.length; i++) {
    const prev = closes[i - lookback];
    if (prev > 0) {
      result[i] = Number((((closes[i] - prev) / prev) * 100).toFixed(2));
    }
  }
  return result;
}
