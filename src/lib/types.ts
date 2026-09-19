export interface OHLCVBar {
  date: string;       // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetId = 'GOLD' | 'BTC' | 'NVDA' | string;

export interface AssetMeta {
  id: AssetId;
  symbol: string;
  name: string;
  category: 'Commodity' | 'Crypto' | 'Equity' | 'Custom';
  color: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
  unit: string;
}

export type DateRangePreset = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX' | 'CUSTOM';

export interface QuantitativeMetrics {
  totalReturn: number;       // as percentage, e.g. 45.2
  cagr: number;              // as percentage
  dailyVol: number;          // as percentage
  annualizedVol: number;     // as percentage (dailyVol * sqrt(252))
  sharpeRatio: number;       // (annReturn - riskFree) / annVol
  sortinoRatio: number;      // downside risk adjusted
  calmarRatio: number;       // cagr / abs(maxDrawdown)
  maxDrawdown: number;       // as percentage, e.g. -24.5
  maxDrawdownDays: number;   // duration in bars
  winRate: number;           // percentage of positive return days
  bestDay: { date: string; returnPct: number };
  worstDay: { date: string; returnPct: number };
  positiveDays: number;
  negativeDays: number;
  totalDays: number;
}

export type StrategyType = 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION';

export interface StrategyParams {
  strategyType: StrategyType;
  assetId: AssetId;
  startDate?: string;
  endDate?: string;
  initialCapital: number;     // e.g. 10000
  positionSizing: number;     // 0.1 to 1.0 (default 1.0)
  feeBps: number;             // basis points (e.g. 10 = 0.10%)
  slippageBps: number;        // basis points (e.g. 5 = 0.05%)
  longOnly: boolean;          // true

  // Specific params
  fastPeriod: number;         // SMA/EMA fast
  slowPeriod: number;         // SMA/EMA slow
  momentumLookback: number;   // bars
  momentumThreshold: number;  // %
  meanReversionPeriod: number;// bars
  zScoreEntry: number;        // e.g. -1.8
  zScoreExit: number;         // e.g. 0.0
}

export interface Trade {
  id: string;
  entryDate: string;
  exitDate: string;
  side: 'LONG';
  entryPrice: number;
  exitPrice: number;
  shares: number;
  netPnl: number;
  returnPct: number;
  feesPaid: number;
  holdingDays: number;
  exitReason: 'SIGNAL' | 'END_OF_PERIOD';
}

export interface DailyEquityPoint {
  date: string;
  close: number;
  equity: number;
  benchmarkEquity: number;
  cash: number;
  positionValue: number;
  shares: number;
  inMarket: boolean;
  drawdown: number;          // as percentage e.g. -5.2
  benchmarkDrawdown: number;
  dailyReturn: number;
  signal?: 'BUY' | 'SELL' | 'HOLD';
  tradeMarker?: 'BUY' | 'SELL';
  executionPrice?: number;
}

export interface MonthlyReturnRow {
  year: number;
  months: { [month: number]: number }; // month 1-12 as returnPct
  yearTotal: number;
}

export interface BacktestResult {
  config: StrategyParams;
  equityCurve: DailyEquityPoint[];
  trades: Trade[];
  metrics: {
    strategy: QuantitativeMetrics;
    benchmark: QuantitativeMetrics;
    alpha: number;             // strategy return - benchmark return
    beta: number;
    profitFactor: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;           // winning trades / total trades
    totalFees: number;
    avgTradeReturn: number;
    maxConsecutiveLosses: number;
  };
  monthlyReturns: MonthlyReturnRow[];
  insufficientWarmupBars?: boolean;
}

export type MarketRegimeType = 'BULL' | 'BEAR' | 'HIGH_VOL' | 'LOW_VOL';

export interface RegimePoint {
  date: string;
  close: number;
  regime: MarketRegimeType;
  sma200: number;
  momentum: number;
  volPercentile: number;
}

export interface SavedBacktest {
  id: string;
  name: string;
  timestamp: number;
  assetId: AssetId;
  assetName: string;
  strategyType: StrategyType;
  returnPct: number;
  benchmarkReturnPct: number;
  sharpe: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
  initialCapital: number;
  finalEquity: number;
  params: StrategyParams;
}

export interface CorrelationMatrix {
  assets: AssetId[];
  matrix: { [assetA: string]: { [assetB: string]: number } };
}

export interface RollingCorrelationPoint {
  date: string;
  correlation: number;
}
