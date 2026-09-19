import { BacktestResult, OHLCVBar, StrategyParams } from '../types';
import { runBacktest } from './backtestEngine';

export interface ParameterGridCell {
  xParam: number; // e.g. Fast period
  yParam: number; // e.g. Slow period
  returnPct: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradeCount: number;
  isCurrent: boolean;
}

export interface ParameterSensitivityGrid {
  xLabel: string;
  yLabel: string;
  xValues: number[];
  yValues: number[];
  cells: ParameterGridCell[][];
  bestCell: ParameterGridCell;
  worstCell: ParameterGridCell;
  medianSharpe: number;
}

export interface CostSensitivityPoint {
  feeBps: number;
  returnPct: number;
  sharpe: number;
  totalFees: number;
  alpha: number;
}

export interface OutOfSampleComparison {
  inSampleBarsCount: number;
  outOfSampleBarsCount: number;
  inSampleRange: { start: string; end: string };
  outOfSampleRange: { start: string; end: string };
  inSampleResult: BacktestResult;
  outOfSampleResult: BacktestResult;
  degradationPct: number; // OOS return vs IS return annualized
}

export interface RobustnessScorecard {
  overallScore: number; // 0 - 100
  grade: 'High Robustness' | 'Moderate Stability' | 'Overfitting Warning' | 'Fragile / Unstable';
  components: {
    oosPreservation: { score: number; max: 30; label: string; details: string };
    drawdownControl: { score: number; max: 25; label: string; details: string };
    parameterStability: { score: number; max: 25; label: string; details: string };
    costResilience: { score: number; max: 20; label: string; details: string };
  };
  summary: string;
}

export function computeParameterSensitivity(
  bars: OHLCVBar[],
  baseParams: StrategyParams
): ParameterSensitivityGrid {
  let xLabel = 'Fast Period';
  let yLabel = 'Slow Period';
  let xValues = [5, 10, 15, 20, 25];
  let yValues = [20, 35, 50, 75, 100];

  if (baseParams.strategyType === 'MOMENTUM') {
    xLabel = 'Lookback (Days)';
    yLabel = 'Threshold (%)';
    xValues = [5, 10, 15, 20, 30];
    yValues = [1, 2, 3, 5, 7];
  } else if (baseParams.strategyType === 'MEAN_REVERSION') {
    xLabel = 'BB Period';
    yLabel = 'Z-Score Entry';
    xValues = [10, 15, 20, 25, 30];
    yValues = [-1.5, -1.8, -2.0, -2.3, -2.5];
  }

  const cells: ParameterGridCell[][] = [];
  let bestCell: ParameterGridCell | null = null;
  let worstCell: ParameterGridCell | null = null;
  const allSharpes: number[] = [];

  for (let y = 0; y < yValues.length; y++) {
    const row: ParameterGridCell[] = [];
    for (let x = 0; x < xValues.length; x++) {
      const xVal = xValues[x];
      const yVal = yValues[y];

      // Clone params with test coordinates
      const testParams: StrategyParams = { ...baseParams };
      if (baseParams.strategyType === 'SMA_CROSSOVER' || baseParams.strategyType === 'EMA_TREND') {
        testParams.fastPeriod = xVal;
        testParams.slowPeriod = yVal;
      } else if (baseParams.strategyType === 'MOMENTUM') {
        testParams.momentumLookback = xVal;
        testParams.momentumThreshold = yVal;
      } else if (baseParams.strategyType === 'MEAN_REVERSION') {
        testParams.meanReversionPeriod = xVal;
        testParams.zScoreEntry = yVal;
      }

      // Fast backtest run
      const res = runBacktest(bars, testParams);
      const isCurrent =
        (baseParams.strategyType === 'SMA_CROSSOVER' || baseParams.strategyType === 'EMA_TREND')
          ? baseParams.fastPeriod === xVal && baseParams.slowPeriod === yVal
          : baseParams.strategyType === 'MOMENTUM'
          ? baseParams.momentumLookback === xVal && baseParams.momentumThreshold === yVal
          : baseParams.meanReversionPeriod === xVal && baseParams.zScoreEntry === yVal;

      const cell: ParameterGridCell = {
        xParam: xVal,
        yParam: yVal,
        returnPct: res.metrics.strategy.totalReturn,
        sharpeRatio: res.metrics.strategy.sharpeRatio,
        maxDrawdown: res.metrics.strategy.maxDrawdown,
        tradeCount: res.metrics.totalTrades,
        isCurrent,
      };

      allSharpes.push(cell.sharpeRatio);

      if (!bestCell || cell.sharpeRatio > bestCell.sharpeRatio) {
        bestCell = cell;
      }
      if (!worstCell || cell.sharpeRatio < worstCell.sharpeRatio) {
        worstCell = cell;
      }

      row.push(cell);
    }
    cells.push(row);
  }

  allSharpes.sort((a, b) => a - b);
  const medianSharpe = allSharpes[Math.floor(allSharpes.length / 2)] || 0;

  return {
    xLabel,
    yLabel,
    xValues,
    yValues,
    cells,
    bestCell: bestCell!,
    worstCell: worstCell!,
    medianSharpe,
  };
}

export function computeCostSensitivity(
  bars: OHLCVBar[],
  baseParams: StrategyParams
): CostSensitivityPoint[] {
  const feeTiers = [0, 5, 10, 25, 50, 100]; // in bps

  return feeTiers.map(feeBps => {
    const testParams = { ...baseParams, feeBps };
    const res = runBacktest(bars, testParams);
    return {
      feeBps,
      returnPct: res.metrics.strategy.totalReturn,
      sharpe: res.metrics.strategy.sharpeRatio,
      totalFees: res.metrics.totalFees,
      alpha: res.metrics.alpha,
    };
  });
}

export function computeOutOfSampleSplit(
  bars: OHLCVBar[],
  baseParams: StrategyParams
): OutOfSampleComparison {
  const splitIndex = Math.floor(bars.length * 0.7);
  const inSampleBars = bars.slice(0, splitIndex);
  const outOfSampleBars = bars.slice(splitIndex);

  const inSampleResult = runBacktest(inSampleBars, baseParams);
  const outOfSampleResult = runBacktest(outOfSampleBars, baseParams);

  const isReturn = inSampleResult.metrics.strategy.cagr;
  const oosReturn = outOfSampleResult.metrics.strategy.cagr;
  const degradationPct = isReturn > 0 ? Number((((oosReturn - isReturn) / Math.abs(isReturn)) * 100).toFixed(1)) : 0;

  return {
    inSampleBarsCount: inSampleBars.length,
    outOfSampleBarsCount: outOfSampleBars.length,
    inSampleRange: {
      start: inSampleBars[0]?.date || '',
      end: inSampleBars[inSampleBars.length - 1]?.date || '',
    },
    outOfSampleRange: {
      start: outOfSampleBars[0]?.date || '',
      end: outOfSampleBars[outOfSampleBars.length - 1]?.date || '',
    },
    inSampleResult,
    outOfSampleResult,
    degradationPct,
  };
}

export function computeExplainableRobustnessScore(
  sensitivity: ParameterSensitivityGrid,
  costs: CostSensitivityPoint[],
  oos: OutOfSampleComparison
): RobustnessScorecard {
  // 1. OOS Preservation (max 30 pts)
  const oosSharpe = oos.outOfSampleResult.metrics.strategy.sharpeRatio;
  let oosScore = 0;
  let oosDetails = '';
  if (oosSharpe > 0.8) {
    oosScore = 30;
    oosDetails = `Excellent OOS Sharpe (${oosSharpe}) confirms strategy generalizability.`;
  } else if (oosSharpe > 0.3) {
    oosScore = 20;
    oosDetails = `Positive OOS Sharpe (${oosSharpe}) with minor performance taper.`;
  } else if (oosSharpe > 0) {
    oosScore = 12;
    oosDetails = `Marginal OOS Sharpe (${oosSharpe}); some overfitting risk observed.`;
  } else {
    oosScore = 4;
    oosDetails = `Negative OOS Sharpe (${oosSharpe}) signals significant overfitting in training period.`;
  }

  // 2. Drawdown Control (max 25 pts)
  const mdd = Math.abs(oos.outOfSampleResult.metrics.strategy.maxDrawdown);
  let ddScore = 0;
  let ddDetails = '';
  if (mdd < 15) {
    ddScore = 25;
    ddDetails = `Controlled maximum drawdown (${mdd}%) in out-of-sample testing.`;
  } else if (mdd < 25) {
    ddScore = 18;
    ddDetails = `Moderate drawdown (${mdd}%) within normal quantitative bounds.`;
  } else if (mdd < 40) {
    ddScore = 10;
    ddDetails = `Elevated drawdown risk (${mdd}%). Capital preservation is challenged.`;
  } else {
    ddScore = 4;
    ddDetails = `Severe drawdown (${mdd}%). Position sizing or stop logic required.`;
  }

  // 3. Parameter Neighborhood Stability (max 25 pts)
  let positiveCells = 0;
  let totalCells = 0;
  sensitivity.cells.forEach(row => {
    row.forEach(c => {
      totalCells++;
      if (c.sharpeRatio > 0.2) positiveCells++;
    });
  });
  const stabilityRatio = totalCells > 0 ? positiveCells / totalCells : 0;
  const paramScore = Math.round(stabilityRatio * 25);
  const paramDetails = `${Math.round(stabilityRatio * 100)}% of neighboring parameter configurations achieve positive risk-adjusted returns.`;

  // 4. Cost Resilience (max 20 pts)
  const costAt25bps = costs.find(c => c.feeBps === 25);
  let costScore = 0;
  let costDetails = '';
  if (costAt25bps && costAt25bps.returnPct > 0 && costAt25bps.alpha > 0) {
    costScore = 20;
    costDetails = 'Retains positive alpha even under aggressive 25 bps fees and slippage.';
  } else if (costAt25bps && costAt25bps.returnPct > 0) {
    costScore = 14;
    costDetails = 'Remains profitable at 25 bps costs, though alpha diminishes.';
  } else {
    costScore = 5;
    costDetails = 'Highly sensitive to transaction fees. High turnover erodes edge.';
  }

  const overallScore = Math.min(100, Math.max(0, oosScore + ddScore + paramScore + costScore));

  let grade: RobustnessScorecard['grade'] = 'High Robustness';
  if (overallScore < 45) grade = 'Fragile / Unstable';
  else if (overallScore < 65) grade = 'Overfitting Warning';
  else if (overallScore < 80) grade = 'Moderate Stability';

  const summary = `QuantLens Robustness Engine scored this model ${overallScore}/100 (${grade}). ${oosDetails} ${paramDetails} ${costDetails}`;

  return {
    overallScore,
    grade,
    components: {
      oosPreservation: { score: oosScore, max: 30, label: 'Out-of-Sample Alpha', details: oosDetails },
      drawdownControl: { score: ddScore, max: 25, label: 'Downside Resilience', details: ddDetails },
      parameterStability: { score: paramScore, max: 25, label: 'Parameter Plateau', details: paramDetails },
      costResilience: { score: costScore, max: 20, label: 'Friction Drag Immunity', details: costDetails },
    },
    summary,
  };
}
