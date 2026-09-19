import { MarketRegimeType, OHLCVBar, RegimePoint, StrategyParams, StrategyType } from '../types';
import { runBacktest } from './backtestEngine';
import { calculateROC, calculateRollingAnnualizedVol, calculateSMA } from './indicators';

export interface RegimeDistribution {
  regime: MarketRegimeType;
  label: string;
  color: string;
  count: number;
  pct: number;
  avgDailyReturn: number;
  annualizedVol: number;
}

export interface RegimePerformanceItem {
  regime: MarketRegimeType;
  label: string;
  strategyReturn: number;
  benchmarkReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradeCount: number;
  winRate: number;
}

export interface CrossStrategyRegimeMatrix {
  regimes: MarketRegimeType[];
  strategies: {
    type: StrategyType;
    label: string;
    scores: { [regime in MarketRegimeType]: { returnPct: number; sharpe: number; bestSuitability: 'BEST' | 'GOOD' | 'NEUTRAL' | 'POOR' } };
  }[];
}

export function classifyMarketRegimes(bars: OHLCVBar[]): {
  regimePoints: RegimePoint[];
  distribution: RegimeDistribution[];
} {
  if (!bars || bars.length === 0) {
    return { regimePoints: [], distribution: [] };
  }

  const closes = bars.map(b => b.close);
  const smaPeriod = Math.min(200, Math.max(20, Math.floor(bars.length * 0.2)));
  const sma = calculateSMA(closes, smaPeriod);
  const momentum = calculateROC(closes, 20);
  const volSeries = calculateRollingAnnualizedVol(closes, 20);

  // Extract non-null vols to determine 25th and 75th percentiles
  const validVols = volSeries.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const p25 = validVols.length > 0 ? validVols[Math.floor(validVols.length * 0.25)] : 15;
  const p75 = validVols.length > 0 ? validVols[Math.floor(validVols.length * 0.75)] : 35;

  const regimePoints: RegimePoint[] = [];
  const counts: Record<MarketRegimeType, { count: number; returnsSum: number; vols: number[] }> = {
    BULL: { count: 0, returnsSum: 0, vols: [] },
    BEAR: { count: 0, returnsSum: 0, vols: [] },
    HIGH_VOL: { count: 0, returnsSum: 0, vols: [] },
    LOW_VOL: { count: 0, returnsSum: 0, vols: [] },
  };

  for (let i = 0; i < bars.length; i++) {
    const price = closes[i];
    const prevPrice = i > 0 ? closes[i - 1] : price;
    const dailyRet = prevPrice > 0 ? (price - prevPrice) / prevPrice : 0;

    const curSma = sma[i] ?? price;
    const curMom = momentum[i] ?? 0;
    const curVol = volSeries[i] ?? 20;

    let regime: MarketRegimeType = 'BULL';

    if (curVol >= p75) {
      regime = 'HIGH_VOL';
    } else if (curVol <= p25) {
      regime = 'LOW_VOL';
    } else if (price >= curSma && curMom >= 0) {
      regime = 'BULL';
    } else {
      regime = 'BEAR';
    }

    regimePoints.push({
      date: bars[i].date,
      close: price,
      regime,
      sma200: Number(curSma.toFixed(2)),
      momentum: Number(curMom.toFixed(2)),
      volPercentile: Number(curVol.toFixed(2)),
    });

    counts[regime].count++;
    counts[regime].returnsSum += dailyRet;
    counts[regime].vols.push(curVol);
  }

  const total = bars.length;
  const distribution: RegimeDistribution[] = [
    {
      regime: 'BULL',
      label: 'Bull Expansion',
      color: '#10b981', // Emerald
      count: counts.BULL.count,
      pct: Number(((counts.BULL.count / total) * 100).toFixed(1)),
      avgDailyReturn: counts.BULL.count > 0 ? Number(((counts.BULL.returnsSum / counts.BULL.count) * 100).toFixed(2)) : 0,
      annualizedVol: counts.BULL.vols.length > 0 ? Number((counts.BULL.vols.reduce((a, b) => a + b, 0) / counts.BULL.vols.length).toFixed(1)) : 0,
    },
    {
      regime: 'BEAR',
      label: 'Bear Contraction',
      color: '#f43f5e', // Coral Rose
      count: counts.BEAR.count,
      pct: Number(((counts.BEAR.count / total) * 100).toFixed(1)),
      avgDailyReturn: counts.BEAR.count > 0 ? Number(((counts.BEAR.returnsSum / counts.BEAR.count) * 100).toFixed(2)) : 0,
      annualizedVol: counts.BEAR.vols.length > 0 ? Number((counts.BEAR.vols.reduce((a, b) => a + b, 0) / counts.BEAR.vols.length).toFixed(1)) : 0,
    },
    {
      regime: 'HIGH_VOL',
      label: 'High Volatility / Turbulence',
      color: '#f59e0b', // Amber
      count: counts.HIGH_VOL.count,
      pct: Number(((counts.HIGH_VOL.count / total) * 100).toFixed(1)),
      avgDailyReturn: counts.HIGH_VOL.count > 0 ? Number(((counts.HIGH_VOL.returnsSum / counts.HIGH_VOL.count) * 100).toFixed(2)) : 0,
      annualizedVol: counts.HIGH_VOL.vols.length > 0 ? Number((counts.HIGH_VOL.vols.reduce((a, b) => a + b, 0) / counts.HIGH_VOL.vols.length).toFixed(1)) : 0,
    },
    {
      regime: 'LOW_VOL',
      label: 'Low Volatility / Consolidation',
      color: '#00f0ff', // Cyan
      count: counts.LOW_VOL.count,
      pct: Number(((counts.LOW_VOL.count / total) * 100).toFixed(1)),
      avgDailyReturn: counts.LOW_VOL.count > 0 ? Number(((counts.LOW_VOL.returnsSum / counts.LOW_VOL.count) * 100).toFixed(2)) : 0,
      annualizedVol: counts.LOW_VOL.vols.length > 0 ? Number((counts.LOW_VOL.vols.reduce((a, b) => a + b, 0) / counts.LOW_VOL.vols.length).toFixed(1)) : 0,
    },
  ];

  return { regimePoints, distribution };
}

export function computeRegimePerformance(
  bars: OHLCVBar[],
  regimePoints: RegimePoint[],
  baseParams: StrategyParams
): RegimePerformanceItem[] {
  const backtest = runBacktest(bars, baseParams);
  const regimeMap = new Map<string, MarketRegimeType>();
  regimePoints.forEach(r => regimeMap.set(r.date, r.regime));

  const stats: Record<MarketRegimeType, {
    stratRetSum: number;
    benchRetSum: number;
    stratSquaredSum: number;
    count: number;
    tradeCount: number;
    winningTrades: number;
    maxDd: number;
  }> = {
    BULL: { stratRetSum: 0, benchRetSum: 0, stratSquaredSum: 0, count: 0, tradeCount: 0, winningTrades: 0, maxDd: 0 },
    BEAR: { stratRetSum: 0, benchRetSum: 0, stratSquaredSum: 0, count: 0, tradeCount: 0, winningTrades: 0, maxDd: 0 },
    HIGH_VOL: { stratRetSum: 0, benchRetSum: 0, stratSquaredSum: 0, count: 0, tradeCount: 0, winningTrades: 0, maxDd: 0 },
    LOW_VOL: { stratRetSum: 0, benchRetSum: 0, stratSquaredSum: 0, count: 0, tradeCount: 0, winningTrades: 0, maxDd: 0 },
  };

  // Group equity curve points by regime
  for (let i = 1; i < backtest.equityCurve.length; i++) {
    const pt = backtest.equityCurve[i];
    const reg = regimeMap.get(pt.date) || 'BULL';
    const sRet = pt.dailyReturn;
    const bRet = (pt.benchmarkEquity - backtest.equityCurve[i - 1].benchmarkEquity) / backtest.equityCurve[i - 1].benchmarkEquity;

    stats[reg].count++;
    stats[reg].stratRetSum += sRet;
    stats[reg].benchRetSum += bRet;
    stats[reg].stratSquaredSum += Math.pow(sRet, 2);

    if (pt.drawdown < stats[reg].maxDd) {
      stats[reg].maxDd = pt.drawdown;
    }
  }

  // Count trades entered in each regime
  backtest.trades.forEach(t => {
    const reg = regimeMap.get(t.entryDate) || 'BULL';
    stats[reg].tradeCount++;
    if (t.netPnl > 0) stats[reg].winningTrades++;
  });

  const regimeLabels: Record<MarketRegimeType, string> = {
    BULL: 'Bull Expansion',
    BEAR: 'Bear Contraction',
    HIGH_VOL: 'High Volatility',
    LOW_VOL: 'Low Volatility',
  };

  return (['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'] as MarketRegimeType[]).map(reg => {
    const s = stats[reg];
    const meanRet = s.count > 0 ? s.stratRetSum / s.count : 0;
    const variance = s.count > 1 ? (s.stratSquaredSum - s.count * Math.pow(meanRet, 2)) / (s.count - 1) : 0;
    const std = Math.sqrt(Math.max(0, variance));
    const annVol = std * Math.sqrt(252);
    const annRet = meanRet * 252;
    const sharpe = annVol > 0 ? Number(((annRet - 0.04) / annVol).toFixed(2)) : 0;

    return {
      regime: reg,
      label: regimeLabels[reg],
      strategyReturn: Number((s.stratRetSum * 100).toFixed(1)),
      benchmarkReturn: Number((s.benchRetSum * 100).toFixed(1)),
      sharpeRatio: sharpe,
      maxDrawdown: Number(s.maxDd.toFixed(1)),
      tradeCount: s.tradeCount,
      winRate: s.tradeCount > 0 ? Number(((s.winningTrades / s.tradeCount) * 100).toFixed(1)) : 0,
    };
  });
}

export function computeCrossStrategyRegimeMatrix(bars: OHLCVBar[]): CrossStrategyRegimeMatrix {
  const regimes: MarketRegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];
  const baseStrategies: { type: StrategyType; label: string; params: Partial<StrategyParams> }[] = [
    { type: 'SMA_CROSSOVER', label: 'SMA Crossover (10/30)', params: { fastPeriod: 10, slowPeriod: 30 } },
    { type: 'EMA_TREND', label: 'EMA Trend Following (12/26)', params: { fastPeriod: 12, slowPeriod: 26 } },
    { type: 'MOMENTUM', label: 'Momentum ROC (20d, 2%)', params: { momentumLookback: 20, momentumThreshold: 2.0 } },
    { type: 'MEAN_REVERSION', label: 'Mean Reversion (BB z < -1.8)', params: { meanReversionPeriod: 20, zScoreEntry: -1.8, zScoreExit: 0.0 } },
  ];

  const { regimePoints } = classifyMarketRegimes(bars);

  const strategies = baseStrategies.map(strat => {
    const fullParams: StrategyParams = {
      strategyType: strat.type,
      assetId: 'GOLD',
      initialCapital: 10000,
      positionSizing: 1.0,
      feeBps: 10,
      slippageBps: 5,
      longOnly: true,
      fastPeriod: 10,
      slowPeriod: 30,
      momentumLookback: 20,
      momentumThreshold: 2.0,
      meanReversionPeriod: 20,
      zScoreEntry: -1.8,
      zScoreExit: 0.0,
      ...strat.params,
    };

    const perf = computeRegimePerformance(bars, regimePoints, fullParams);
    const scores: any = {};

    perf.forEach(p => {
      let suitability: 'BEST' | 'GOOD' | 'NEUTRAL' | 'POOR' = 'NEUTRAL';
      if (p.sharpeRatio > 1.0) suitability = 'BEST';
      else if (p.sharpeRatio > 0.4) suitability = 'GOOD';
      else if (p.sharpeRatio < 0) suitability = 'POOR';

      scores[p.regime] = {
        returnPct: p.strategyReturn,
        sharpe: p.sharpeRatio,
        bestSuitability: suitability,
      };
    });

    return {
      type: strat.type,
      label: strat.label,
      scores,
    };
  });

  return { regimes, strategies };
}
