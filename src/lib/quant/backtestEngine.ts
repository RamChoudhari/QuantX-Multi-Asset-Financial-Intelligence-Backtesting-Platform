import { BacktestResult, DailyEquityPoint, MonthlyReturnRow, OHLCVBar, StrategyParams, Trade } from '../types';
import { calculateBollingerBands, calculateEMA, calculateROC, calculateSMA } from './indicators';
import { calculateMetricsFromBars } from './metrics';

export function runBacktest(
  bars: OHLCVBar[],
  params: StrategyParams,
  riskFreeRate: number = 0.04
): BacktestResult {
  const {
    strategyType,
    initialCapital = 10000,
    positionSizing = 1.0,
    feeBps = 10,
    slippageBps = 5,
    fastPeriod = 10,
    slowPeriod = 30,
    momentumLookback = 20,
    momentumThreshold = 2.0,
    meanReversionPeriod = 20,
    zScoreEntry = -1.8,
    zScoreExit = 0.0,
  } = params;

  // Filter bars by date if specified
  let activeBars = [...bars];
  if (params.startDate) {
    activeBars = activeBars.filter(b => b.date >= params.startDate!);
  }
  if (params.endDate) {
    activeBars = activeBars.filter(b => b.date <= params.endDate!);
  }

  if (activeBars.length < 25) {
    return createEmptyBacktestResult(params, activeBars);
  }

  const closes = activeBars.map(b => b.close);

  // Precompute signals based on strategy type using data available at close t
  const signals: ('BUY' | 'SELL' | null)[] = new Array(activeBars.length).fill(null);
  let warmupBars = 0;

  if (strategyType === 'SMA_CROSSOVER') {
    warmupBars = Math.max(fastPeriod, slowPeriod);
    const fastSMA = calculateSMA(closes, fastPeriod);
    const slowSMA = calculateSMA(closes, slowPeriod);

    for (let t = warmupBars; t < activeBars.length; t++) {
      const prevFast = fastSMA[t - 1];
      const prevSlow = slowSMA[t - 1];
      const currFast = fastSMA[t];
      const currSlow = slowSMA[t];

      if (prevFast !== null && prevSlow !== null && currFast !== null && currSlow !== null) {
        if (prevFast <= prevSlow && currFast > currSlow) {
          signals[t] = 'BUY';
        } else if (prevFast >= prevSlow && currFast < currSlow) {
          signals[t] = 'SELL';
        }
      }
    }
  } else if (strategyType === 'EMA_TREND') {
    warmupBars = Math.max(fastPeriod, slowPeriod);
    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);

    for (let t = warmupBars; t < activeBars.length; t++) {
      const prevFast = fastEMA[t - 1];
      const prevSlow = slowEMA[t - 1];
      const currFast = fastEMA[t];
      const currSlow = slowEMA[t];

      if (prevFast !== null && prevSlow !== null && currFast !== null && currSlow !== null) {
        if (currFast > currSlow && closes[t] > currSlow && prevFast <= prevSlow) {
          signals[t] = 'BUY';
        } else if (currFast < currSlow && prevFast >= prevSlow) {
          signals[t] = 'SELL';
        }
      }
    }
  } else if (strategyType === 'MOMENTUM') {
    warmupBars = momentumLookback + 1;
    const roc = calculateROC(closes, momentumLookback);

    for (let t = warmupBars; t < activeBars.length; t++) {
      const currRoc = roc[t];
      const prevRoc = roc[t - 1];
      if (currRoc !== null && prevRoc !== null) {
        if (currRoc >= momentumThreshold && prevRoc < momentumThreshold) {
          signals[t] = 'BUY';
        } else if (currRoc < 0 && prevRoc >= 0) {
          signals[t] = 'SELL';
        }
      }
    }
  } else if (strategyType === 'MEAN_REVERSION') {
    warmupBars = meanReversionPeriod;
    const bb = calculateBollingerBands(closes, meanReversionPeriod, 2.0);

    for (let t = warmupBars; t < activeBars.length; t++) {
      const currZ = bb.zScore[t];
      const prevZ = bb.zScore[t - 1];
      if (currZ !== null && prevZ !== null) {
        // Cross below entry threshold -> Oversold Buy
        if (currZ <= zScoreEntry && prevZ > zScoreEntry) {
          signals[t] = 'BUY';
        } else if (currZ >= zScoreExit && prevZ < zScoreExit) {
          signals[t] = 'SELL';
        }
      }
    }
  }

  // Next-bar Execution Engine (Signal generated at t close -> executed at t+1 Open)
  const feeRate = feeBps / 10000;
  const slippageRate = slippageBps / 10000;

  let cash = initialCapital;
  let shares = 0;
  let inMarket = false;
  let currentTrade: Partial<Trade> | null = null;
  const trades: Trade[] = [];
  let totalFees = 0;

  // Benchmark setup: buy and hold on first tradable bar
  const benchmarkInitialFill = activeBars[0].open * (1 + slippageRate);
  const benchmarkFee = initialCapital * feeRate;
  const benchmarkShares = (initialCapital - benchmarkFee) / benchmarkInitialFill;
  let benchmarkCash = 0;

  const equityCurve: DailyEquityPoint[] = [];
  let peakEquity = initialCapital;
  let peakBenchmarkEquity = initialCapital;

  for (let i = 0; i < activeBars.length; i++) {
    const bar = activeBars[i];
    let dailyTradeMarker: 'BUY' | 'SELL' | undefined = undefined;
    let executionPrice: number | undefined = undefined;

    // Check if previous day generated an order to fill on today's Open
    if (i > 0) {
      const pendingSignal = signals[i - 1];

      if (pendingSignal === 'BUY' && !inMarket) {
        // Execute Buy Order on Bar i's Open
        const fillPrice = bar.open * (1 + slippageRate);
        const allocatedCash = cash * Math.max(0.1, Math.min(1.0, positionSizing));
        const fee = allocatedCash * feeRate;
        const netCashForShares = allocatedCash - fee;
        const boughtShares = netCashForShares / fillPrice;

        shares = boughtShares;
        cash -= allocatedCash;
        inMarket = true;
        totalFees += fee;
        dailyTradeMarker = 'BUY';
        executionPrice = fillPrice;

        currentTrade = {
          id: `TRD-${trades.length + 1}`,
          entryDate: bar.date,
          side: 'LONG',
          entryPrice: Number(fillPrice.toFixed(2)),
          shares: Number(boughtShares.toFixed(4)),
          feesPaid: fee,
        };
      } else if (pendingSignal === 'SELL' && inMarket) {
        // Execute Sell Order on Bar i's Open
        const fillPrice = bar.open * (1 - slippageRate);
        const grossProceeds = shares * fillPrice;
        const fee = grossProceeds * feeRate;
        const netProceeds = grossProceeds - fee;

        cash += netProceeds;
        totalFees += fee;
        dailyTradeMarker = 'SELL';
        executionPrice = fillPrice;

        if (currentTrade) {
          const entryVal = currentTrade.shares! * currentTrade.entryPrice!;
          const netPnl = netProceeds - entryVal;
          const returnPct = entryVal > 0 ? (netPnl / entryVal) * 100 : 0;
          const holdingDays = Math.max(
            1,
            Math.round((new Date(bar.date).getTime() - new Date(currentTrade.entryDate!).getTime()) / (1000 * 3600 * 24))
          );

          trades.push({
            id: currentTrade.id!,
            entryDate: currentTrade.entryDate!,
            exitDate: bar.date,
            side: 'LONG',
            entryPrice: currentTrade.entryPrice!,
            exitPrice: Number(fillPrice.toFixed(2)),
            shares: currentTrade.shares!,
            netPnl: Number(netPnl.toFixed(2)),
            returnPct: Number(returnPct.toFixed(2)),
            feesPaid: Number((currentTrade.feesPaid! + fee).toFixed(2)),
            holdingDays,
            exitReason: 'SIGNAL',
          });
          currentTrade = null;
        }

        shares = 0;
        inMarket = false;
      }
    }

    // Mark-to-market valuation at end of day (bar.close)
    const positionValue = shares * bar.close;
    const currentEquity = cash + positionValue;
    const benchmarkEquity = benchmarkCash + benchmarkShares * bar.close;

    if (currentEquity > peakEquity) peakEquity = currentEquity;
    if (benchmarkEquity > peakBenchmarkEquity) peakBenchmarkEquity = benchmarkEquity;

    const currentDrawdown = peakEquity > 0 ? ((currentEquity - peakEquity) / peakEquity) * 100 : 0;
    const benchmarkDrawdown = peakBenchmarkEquity > 0 ? ((benchmarkEquity - peakBenchmarkEquity) / peakBenchmarkEquity) * 100 : 0;

    const prevEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : initialCapital;
    const dailyReturn = prevEquity > 0 ? (currentEquity - prevEquity) / prevEquity : 0;

    equityCurve.push({
      date: bar.date,
      close: bar.close,
      equity: Number(currentEquity.toFixed(2)),
      benchmarkEquity: Number(benchmarkEquity.toFixed(2)),
      cash: Number(cash.toFixed(2)),
      positionValue: Number(positionValue.toFixed(2)),
      shares: Number(shares.toFixed(4)),
      inMarket,
      drawdown: Number(currentDrawdown.toFixed(2)),
      benchmarkDrawdown: Number(benchmarkDrawdown.toFixed(2)),
      dailyReturn,
      signal: signals[i] || 'HOLD',
      tradeMarker: dailyTradeMarker,
      executionPrice,
    });
  }

  // Close open position on final bar for consistent metrics
  if (inMarket && currentTrade) {
    const lastBar = activeBars[activeBars.length - 1];
    const fillPrice = lastBar.close * (1 - slippageRate);
    const gross = shares * fillPrice;
    const fee = gross * feeRate;
    const net = gross - fee;
    const entryVal = currentTrade.shares! * currentTrade.entryPrice!;
    const netPnl = net - entryVal;
    const returnPct = entryVal > 0 ? (netPnl / entryVal) * 100 : 0;
    const holdingDays = Math.max(
      1,
      Math.round((new Date(lastBar.date).getTime() - new Date(currentTrade.entryDate!).getTime()) / (1000 * 3600 * 24))
    );

    trades.push({
      id: currentTrade.id!,
      entryDate: currentTrade.entryDate!,
      exitDate: lastBar.date,
      side: 'LONG',
      entryPrice: currentTrade.entryPrice!,
      exitPrice: Number(fillPrice.toFixed(2)),
      shares: currentTrade.shares!,
      netPnl: Number(netPnl.toFixed(2)),
      returnPct: Number(returnPct.toFixed(2)),
      feesPaid: Number((currentTrade.feesPaid! + fee).toFixed(2)),
      holdingDays,
      exitReason: 'END_OF_PERIOD',
    });
  }

  // Synthesize metrics for Strategy and Benchmark
  const strategyBarsAsOHLCV: OHLCVBar[] = equityCurve.map(e => ({
    date: e.date,
    open: e.equity,
    high: e.equity,
    low: e.equity,
    close: e.equity,
    volume: 1000,
  }));

  const benchmarkBarsAsOHLCV: OHLCVBar[] = equityCurve.map(e => ({
    date: e.date,
    open: e.benchmarkEquity,
    high: e.benchmarkEquity,
    low: e.benchmarkEquity,
    close: e.benchmarkEquity,
    volume: 1000,
  }));

  const strategyMetrics = calculateMetricsFromBars(strategyBarsAsOHLCV, riskFreeRate);
  const benchmarkMetrics = calculateMetricsFromBars(benchmarkBarsAsOHLCV, riskFreeRate);

  // Trade stats
  const winningTrades = trades.filter(t => t.netPnl > 0).length;
  const losingTrades = trades.filter(t => t.netPnl <= 0).length;
  const totalProfit = trades.filter(t => t.netPnl > 0).reduce((a, t) => a + t.netPnl, 0);
  const totalLoss = Math.abs(trades.filter(t => t.netPnl < 0).reduce((a, t) => a + t.netPnl, 0));
  const profitFactor = totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : totalProfit > 0 ? 99.9 : 0;
  const avgTradeReturn = trades.length > 0 ? Number((trades.reduce((a, t) => a + t.returnPct, 0) / trades.length).toFixed(2)) : 0;

  // Max consecutive losses
  let maxConsecutiveLosses = 0;
  let currentLossStreak = 0;
  trades.forEach(t => {
    if (t.netPnl < 0) {
      currentLossStreak++;
      if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
    } else {
      currentLossStreak = 0;
    }
  });

  // Calculate Beta & Alpha
  const stratReturns = equityCurve.map(e => e.dailyReturn);
  const benchReturns = activeBars.map((b, idx) => {
    if (idx === 0) return 0;
    const prev = activeBars[idx - 1].close;
    return prev > 0 ? (b.close - prev) / prev : 0;
  });

  let cov = 0;
  let benchVar = 0;
  const n = stratReturns.length;
  const meanS = stratReturns.reduce((a, b) => a + b, 0) / n;
  const meanB = benchReturns.reduce((a, b) => a + b, 0) / n;

  for (let k = 0; k < n; k++) {
    cov += (stratReturns[k] - meanS) * (benchReturns[k] - meanB);
    benchVar += Math.pow(benchReturns[k] - meanB, 2);
  }
  const beta = benchVar > 0 ? Number((cov / benchVar).toFixed(2)) : 1.0;
  const alpha = Number((strategyMetrics.totalReturn - benchmarkMetrics.totalReturn).toFixed(2));

  // Build Monthly Return Grid
  const monthlyReturns = calculateMonthlyReturns(equityCurve);

  return {
    config: params,
    equityCurve,
    trades,
    metrics: {
      strategy: strategyMetrics,
      benchmark: benchmarkMetrics,
      alpha,
      beta,
      profitFactor,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate: trades.length > 0 ? Number(((winningTrades / trades.length) * 100).toFixed(1)) : 0,
      totalFees: Number(totalFees.toFixed(2)),
      avgTradeReturn,
      maxConsecutiveLosses,
    },
    monthlyReturns,
    insufficientWarmupBars: activeBars.length < warmupBars + 10,
  };
}

function calculateMonthlyReturns(equityCurve: DailyEquityPoint[]): MonthlyReturnRow[] {
  if (!equityCurve || equityCurve.length === 0) return [];

  const groupedByYear: { [year: number]: { [month: number]: { first: number; last: number } } } = {};

  equityCurve.forEach(pt => {
    const d = new Date(pt.date);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1; // 1-12

    if (!groupedByYear[y]) groupedByYear[y] = {};
    if (!groupedByYear[y][m]) {
      groupedByYear[y][m] = { first: pt.equity, last: pt.equity };
    } else {
      groupedByYear[y][m].last = pt.equity;
    }
  });

  const rows: MonthlyReturnRow[] = [];
  const years = Object.keys(groupedByYear).map(Number).sort((a, b) => a - b);

  years.forEach(year => {
    const monthsObj: { [month: number]: number } = {};
    const monthsData = groupedByYear[year];
    let yearStartEquity: number | null = null;
    let yearEndEquity: number | null = null;

    for (let m = 1; m <= 12; m++) {
      if (monthsData[m]) {
        const { first, last } = monthsData[m];
        if (yearStartEquity === null) yearStartEquity = first;
        yearEndEquity = last;
        monthsObj[m] = Number((((last - first) / first) * 100).toFixed(2));
      }
    }

    const yearTotal = yearStartEquity && yearEndEquity
      ? Number((((yearEndEquity - yearStartEquity) / yearStartEquity) * 100).toFixed(2))
      : 0;

    rows.push({
      year,
      months: monthsObj,
      yearTotal,
    });
  });

  return rows;
}

function createEmptyBacktestResult(params: StrategyParams, bars: OHLCVBar[]): BacktestResult {
  const emptyMetrics = calculateMetricsFromBars([], 0.04);
  return {
    config: params,
    equityCurve: [],
    trades: [],
    metrics: {
      strategy: emptyMetrics,
      benchmark: emptyMetrics,
      alpha: 0,
      beta: 1,
      profitFactor: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalFees: 0,
      avgTradeReturn: 0,
      maxConsecutiveLosses: 0,
    },
    monthlyReturns: [],
    insufficientWarmupBars: true,
  };
}
