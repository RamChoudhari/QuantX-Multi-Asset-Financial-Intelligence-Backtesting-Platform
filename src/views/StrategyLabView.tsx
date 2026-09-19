import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  FlaskConical,
  RotateCcw,
  Bookmark,
  Download,
  ShieldCheck,
  Sliders,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { InsightCard } from '../components/common/InsightCard';
import { runBacktest } from '../lib/quant/backtestEngine';
import {
  computeCostSensitivity,
  computeExplainableRobustnessScore,
  computeOutOfSampleSplit,
  computeParameterSensitivity,
} from '../lib/quant/robustness';
import { generateStrategyVerdict } from '../lib/utils/insights';
import {
  exportEquityCurveToCsv,
  exportTradesToCsv,
  formatCurrency,
  formatDate,
  formatPercent,
} from '../lib/utils/formatting';
import type { SavedBacktest, StrategyParams, StrategyType } from '../lib/types';

export const StrategyLabView: React.FC = () => {
  const {
    assets,
    activeAsset,
    setActiveAsset,
    getBars,
    saveBacktestRun,
  } = useApp();

  // Active Lab Sub-Tab
  const [labTab, setLabTab] = useState<'performance' | 'robustness'>('performance');

  // Strategy Parameters State
  const [strategyType, setStrategyType] = useState<StrategyType>('SMA_CROSSOVER');
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [positionSizing, setPositionSizing] = useState<number>(1.0); // 100%
  const [feeBps, setFeeBps] = useState<number>(10); // 10 bps
  const [slippageBps, setSlippageBps] = useState<number>(5); // 5 bps
  const longOnly = true;

  // Strategy-specific parameters
  const [fastPeriod, setFastPeriod] = useState<number>(10);
  const [slowPeriod, setSlowPeriod] = useState<number>(30);
  const [momentumLookback, setMomentumLookback] = useState<number>(20);
  const [momentumThreshold, setMomentumThreshold] = useState<number>(2.0);
  const [meanReversionPeriod, setMeanReversionPeriod] = useState<number>(20);
  const [zScoreEntry, setZScoreEntry] = useState<number>(-1.8);
  const [zScoreExit, setZScoreExit] = useState<number>(0.0);

  // UI state
  const [showMethodologyPanel, setShowMethodologyPanel] = useState<boolean>(false);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveName, setSaveName] = useState<string>('My Strategy Run');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [robustnessMetric, setRobustnessMetric] = useState<'sharpe' | 'return'>('sharpe');

  // Load Bars for Active Asset
  const bars = getBars(activeAsset, true);

  // Build Params Object
  const currentParams: StrategyParams = useMemo(() => ({
    strategyType,
    assetId: activeAsset,
    initialCapital,
    positionSizing,
    feeBps,
    slippageBps,
    longOnly,
    fastPeriod,
    slowPeriod,
    momentumLookback,
    momentumThreshold,
    meanReversionPeriod,
    zScoreEntry,
    zScoreExit,
  }), [
    strategyType,
    activeAsset,
    initialCapital,
    positionSizing,
    feeBps,
    slippageBps,
    longOnly,
    fastPeriod,
    slowPeriod,
    momentumLookback,
    momentumThreshold,
    meanReversionPeriod,
    zScoreEntry,
    zScoreExit,
  ]);

  // Execute Backtest Engine
  const backtestResult = useMemo(() => {
    return runBacktest(bars, currentParams);
  }, [bars, currentParams]);

  // Robustness Engine Calculations
  const { sensitivityGrid, costCurve, oosSplit, robustnessScorecard } = useMemo(() => {
    if (labTab !== 'robustness') {
      return { sensitivityGrid: null, costCurve: [], oosSplit: null, robustnessScorecard: null };
    }
    const sensitivityGrid = computeParameterSensitivity(bars, currentParams);
    const costCurve = computeCostSensitivity(bars, currentParams);
    const oosSplit = computeOutOfSampleSplit(bars, currentParams);
    const robustnessScorecard = computeExplainableRobustnessScore(sensitivityGrid, costCurve, oosSplit);

    return { sensitivityGrid, costCurve, oosSplit, robustnessScorecard };
  }, [bars, currentParams, labTab]);

  // Plain-English Verdict
  const verdictText = useMemo(() => {
    return generateStrategyVerdict(backtestResult);
  }, [backtestResult]);

  // Presets Handlers
  const applyPreset = (preset: 'conservative' | 'balanced' | 'aggressive' | 'stress') => {
    if (preset === 'conservative') {
      setStrategyType('SMA_CROSSOVER');
      setFastPeriod(20);
      setSlowPeriod(50);
      setPositionSizing(0.5);
      setFeeBps(10);
      setSlippageBps(5);
    } else if (preset === 'balanced') {
      setStrategyType('SMA_CROSSOVER');
      setFastPeriod(10);
      setSlowPeriod(30);
      setPositionSizing(1.0);
      setFeeBps(10);
      setSlippageBps(5);
    } else if (preset === 'aggressive') {
      setStrategyType('MOMENTUM');
      setMomentumLookback(10);
      setMomentumThreshold(3.0);
      setPositionSizing(1.0);
      setFeeBps(10);
      setSlippageBps(5);
    } else if (preset === 'stress') {
      setFeeBps(50);
      setSlippageBps(25);
    }
  };

  const resetDefaults = () => {
    setStrategyType('SMA_CROSSOVER');
    setInitialCapital(10000);
    setPositionSizing(1.0);
    setFeeBps(10);
    setSlippageBps(5);
    setFastPeriod(10);
    setSlowPeriod(30);
    setMomentumLookback(20);
    setMomentumThreshold(2.0);
    setMeanReversionPeriod(20);
    setZScoreEntry(-1.8);
    setZScoreExit(0.0);
  };

  const handleSave = () => {
    const run: SavedBacktest = {
      id: `RUN-${Date.now()}`,
      name: saveName || 'Strategy Backtest',
      timestamp: Date.now(),
      assetId: activeAsset,
      assetName: assets.find(a => a.id === activeAsset)?.name || activeAsset,
      strategyType,
      returnPct: backtestResult.metrics.strategy.totalReturn,
      benchmarkReturnPct: backtestResult.metrics.benchmark.totalReturn,
      sharpe: backtestResult.metrics.strategy.sharpeRatio,
      maxDrawdown: backtestResult.metrics.strategy.maxDrawdown,
      totalTrades: backtestResult.trades.length,
      winRate: backtestResult.metrics.winRate,
      initialCapital,
      finalEquity: backtestResult.equityCurve[backtestResult.equityCurve.length - 1]?.equity || initialCapital,
      params: currentParams,
    };
    saveBacktestRun(run);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveModalOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SYSTEMATIC STRATEGY LAB
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Execution Simulation & Overfitting Audit
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict next-bar open execution, basis-point fees, slippage modeling, and out-of-sample testing.
          </p>
        </div>

        {/* View Toggle (Performance vs Robustness) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setLabTab('performance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                labTab === 'performance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Backtest Performance
            </button>
            <button
              onClick={() => setLabTab('robustness')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                labTab === 'robustness'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Robustness & Sensitivity
            </button>
          </div>

          <button
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Run</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Configuration Panel (4 cols) & Right Results Area (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left-Side Configuration Panel */}
        <div className="lg:col-span-4 terminal-card rounded-2xl p-5 border border-slate-800 space-y-5 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Strategy Configuration
            </span>
            <button
              onClick={resetDefaults}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Reset parameters to standard defaults"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">Scenario Presets</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <button
                onClick={() => applyPreset('conservative')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left"
              >
                🛡️ Conservative
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left"
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => applyPreset('aggressive')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-left"
              >
                🚀 Aggressive
              </button>
              <button
                onClick={() => applyPreset('stress')}
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 text-left"
              >
                ⚠️ Stress Costs
              </button>
            </div>
          </div>

          {/* Asset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">Target Asset</label>
            <div className="grid grid-cols-3 gap-1.5">
              {assets.slice(0, 3).map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveAsset(a.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    activeAsset === a.id
                      ? 'bg-slate-800 text-white border border-cyan-500/50 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {a.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-medium">Strategy Architecture</label>
            <select
              value={strategyType}
              onChange={e => setStrategyType(e.target.value as StrategyType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 font-sans"
            >
              <option value="SMA_CROSSOVER">1. SMA Dual Moving Average Crossover</option>
              <option value="EMA_TREND">2. EMA Exponential Trend Following</option>
              <option value="MOMENTUM">3. Rate of Change (ROC) Momentum</option>
              <option value="MEAN_REVERSION">4. Bollinger Z-Score Mean Reversion</option>
            </select>
          </div>

          {/* Strategy-Specific Parameters */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold block">
              Model Parameters
            </span>

            {strategyType === 'SMA_CROSSOVER' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Fast SMA Window</label>
                  <input
                    type="number"
                    min="3"
                    max="50"
                    value={fastPeriod}
                    onChange={e => setFastPeriod(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Slow SMA Window</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={slowPeriod}
                    onChange={e => setSlowPeriod(Math.max(fastPeriod + 1, parseInt(e.target.value) || 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {strategyType === 'EMA_TREND' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Fast EMA Window</label>
                  <input
                    type="number"
                    min="3"
                    max="50"
                    value={fastPeriod}
                    onChange={e => setFastPeriod(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Slow EMA Window</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={slowPeriod}
                    onChange={e => setSlowPeriod(Math.max(fastPeriod + 1, parseInt(e.target.value) || 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {strategyType === 'MOMENTUM' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Lookback (Bars)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={momentumLookback}
                    onChange={e => setMomentumLookback(Math.max(2, parseInt(e.target.value) || 5))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Threshold (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={momentumThreshold}
                    onChange={e => setMomentumThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {strategyType === 'MEAN_REVERSION' && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Bollinger Period</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={meanReversionPeriod}
                    onChange={e => setMeanReversionPeriod(Math.max(5, parseInt(e.target.value) || 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Entry Z-Score</label>
                    <input
                      type="number"
                      step="0.1"
                      value={zScoreEntry}
                      onChange={e => setZScoreEntry(parseFloat(e.target.value) || -1.5)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Exit Z-Score</label>
                    <input
                      type="number"
                      step="0.1"
                      value={zScoreExit}
                      onChange={e => setZScoreExit(parseFloat(e.target.value) || 0.0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Capital & Friction Modeling */}
          <div className="space-y-3 text-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">
              Capital & Market Frictions
            </span>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Initial Capital</span>
                <span className="font-mono text-white">${initialCapital.toLocaleString()}</span>
              </div>
              <input
                type="number"
                step="1000"
                min="1000"
                value={initialCapital}
                onChange={e => setInitialCapital(Math.max(500, parseInt(e.target.value) || 10000))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Position Sizing</span>
                <span className="font-mono text-cyan-300">{Math.round(positionSizing * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={positionSizing}
                onChange={e => setPositionSizing(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Commissions (bps)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeBps}
                  onChange={e => setFeeBps(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Slippage (bps)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={slippageBps}
                  onChange={e => setSlippageBps(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400">Long-Only Constraint</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Cash / Long (No Leverage)
              </span>
            </div>
          </div>

          {/* Collapsible Backtest Methodology Details */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowMethodologyPanel(!showMethodologyPanel)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Execution Methodology Assumptions
              </span>
              {showMethodologyPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showMethodologyPanel && (
              <div className="p-3 mt-2 rounded-xl bg-slate-950 text-[11px] text-slate-400 space-y-1 leading-relaxed border border-slate-800">
                <p>• <strong>Decision Bar:</strong> Indicator values evaluated at close of Bar t.</p>
                <p>• <strong>Execution Bar:</strong> Filled at Bar t+1 Open with explicit slippage deduction.</p>
                <p>• <strong>Friction Drag:</strong> Fee applied to total transaction value on both entry and exit.</p>
                <p>• <strong>Benchmark:</strong> Buy-and-hold calculated over the exact identical period with same initial capital and fee deductions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Results Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {labTab === 'performance' ? (
            <>
              {/* Verdict Insight Card */}
              <InsightCard
                title="Backtest Empirical Verdict"
                insight={verdictText}
                badge="SIMULATION AUDIT"
                type={backtestResult.metrics.alpha > 0 ? 'verdict' : 'warning'}
              />

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Strategy Return"
                  value={formatPercent(backtestResult.metrics.strategy.totalReturn)}
                  subValue={`Final: ${formatCurrency(backtestResult.equityCurve[backtestResult.equityCurve.length - 1]?.equity || initialCapital)}`}
                  subType={backtestResult.metrics.strategy.totalReturn >= 0 ? 'positive' : 'negative'}
                  definition="Net cumulative percentage return achieved after deducting all commissions and slippage."
                />
                <MetricCard
                  label="Benchmark Return"
                  value={formatPercent(backtestResult.metrics.benchmark.totalReturn)}
                  subValue={`Final: ${formatCurrency(backtestResult.equityCurve[backtestResult.equityCurve.length - 1]?.benchmarkEquity || initialCapital)}`}
                  subType="neutral"
                  definition="Passive buy-and-hold performance over the identical time window."
                />
                <MetricCard
                  label="Alpha vs Benchmark"
                  value={formatPercent(backtestResult.metrics.alpha)}
                  subValue={`Beta: ${backtestResult.metrics.beta.toFixed(2)}`}
                  subType={backtestResult.metrics.alpha >= 0 ? 'positive' : 'negative'}
                  definition="Excess return generated over passive buy-and-hold."
                />
                <MetricCard
                  label="Sharpe Ratio"
                  value={backtestResult.metrics.strategy.sharpeRatio.toFixed(2)}
                  subValue={`Bench: ${backtestResult.metrics.benchmark.sharpeRatio.toFixed(2)}`}
                  subType={backtestResult.metrics.strategy.sharpeRatio > backtestResult.metrics.benchmark.sharpeRatio ? 'positive' : 'neutral'}
                  definition="Annualized excess return per unit of annualized portfolio volatility."
                />
                <MetricCard
                  label="Maximum Drawdown"
                  value={`${backtestResult.metrics.strategy.maxDrawdown.toFixed(1)}%`}
                  subValue={`Bench: ${backtestResult.metrics.benchmark.maxDrawdown.toFixed(1)}%`}
                  subType="negative"
                  definition="Deepest peak-to-trough drop in total equity experienced by the strategy."
                />
                <MetricCard
                  label="Trade Win Rate"
                  value={`${backtestResult.metrics.winRate.toFixed(1)}%`}
                  subValue={`${backtestResult.metrics.winningTrades}W / ${backtestResult.metrics.losingTrades}L`}
                  subType="accent"
                  definition="Percentage of completed round-trip trades that closed with a positive net profit."
                />
                <MetricCard
                  label="Total Completed Trades"
                  value={`${backtestResult.metrics.totalTrades}`}
                  subValue={`PF: ${backtestResult.metrics.profitFactor.toFixed(2)}`}
                  subType="neutral"
                  definition="Total round-trip positions entered and exited."
                />
                <MetricCard
                  label="Total Trading Frictions"
                  value={formatCurrency(backtestResult.metrics.totalFees)}
                  subValue={`${feeBps} bps fee / ${slippageBps} bps slip`}
                  subType="neutral"
                  definition="Cumulative capital lost to brokerage commissions and execution slippage."
                />
              </div>

              {/* Main Equity Curve vs Benchmark Chart */}
              <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Portfolio Equity Curve vs Benchmark
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Marked-to-market daily valuation starting at ${initialCapital.toLocaleString()}.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => exportEquityCurveToCsv(backtestResult.equityCurve)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                      title="Download daily equity curve CSV"
                    >
                      <Download className="w-3 h-3" /> Equity CSV
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={backtestResult.equityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={11} minTickGap={40} />
                      <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const pt = payload[0].payload;
                          return (
                            <div className="terminal-card rounded-xl p-3 text-xs font-mono-numeric min-w-[200px]">
                              <div className="text-slate-400 pb-1 mb-1 border-b border-slate-800 font-sans">{formatDate(label)}</div>
                              <div className="flex justify-between text-cyan-400 font-bold">
                                <span>Strategy Equity:</span><span>${pt.equity.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Benchmark Equity:</span><span>${pt.benchmarkEquity.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800 mt-1">
                                <span>Position:</span><span>{pt.inMarket ? 'IN MARKET' : 'CASH'}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="equity" name="Strategy Equity" stroke="#00f0ff" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="benchmarkEquity" name="Buy & Hold Benchmark" stroke="#64748b" strokeWidth={1.75} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Underwater Drawdown Comparison Chart */}
              <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  Underwater Drawdown Profile (Strategy vs Benchmark)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Visualizes risk preservation and capital drawdowns during macro stress periods.
                </p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={backtestResult.equityCurve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                      <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} minTickGap={40} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${v}%`} />
                      <ReferenceLine y={0} stroke="#475569" />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const pt = payload[0].payload;
                          return (
                            <div className="terminal-card rounded-lg p-2 text-xs font-mono-numeric">
                              <div>{formatDate(label)}</div>
                              <div className="text-rose-400 font-bold">Strategy DD: {pt.drawdown}%</div>
                              <div className="text-slate-400">Benchmark DD: {pt.benchmarkDrawdown}%</div>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="drawdown" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="benchmarkDrawdown" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Returns Heatmap Matrix */}
              {backtestResult.monthlyReturns.length > 0 && (
                <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    Monthly Returns Breakdown (%)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Calendar month performance matrix illustrating seasonality and return distribution.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-center text-xs font-mono-numeric">
                      <thead className="bg-slate-900 text-slate-400">
                        <tr>
                          <th className="p-2 text-left font-sans font-semibold">Year</th>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                            <th key={m} className="p-2 font-semibold">{m}</th>
                          ))}
                          <th className="p-2 font-bold text-white">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {backtestResult.monthlyReturns.map(row => (
                          <tr key={row.year} className="hover:bg-slate-800/20">
                            <td className="p-2 text-left font-bold text-white font-sans">{row.year}</td>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                              const val = row.months[month];
                              if (val === undefined) {
                                return <td key={month} className="p-2 text-slate-600">-</td>;
                              }
                              const bg = val > 3 ? 'bg-emerald-500/25 text-emerald-300' :
                                         val > 0 ? 'bg-emerald-500/10 text-emerald-400' :
                                         val < -3 ? 'bg-rose-500/25 text-rose-300' : 'bg-rose-500/10 text-rose-400';
                              return (
                                <td key={month} className="p-1">
                                  <div className={`p-1 rounded ${bg} text-[11px]`}>
                                    {val > 0 ? '+' : ''}{val.toFixed(1)}%
                                  </div>
                                </td>
                              );
                            })}
                            <td className={`p-2 font-bold ${row.yearTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {row.yearTotal > 0 ? '+' : ''}{row.yearTotal.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Complete Audit-Grade Trade Log Table */}
              <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      Detailed Trade Execution Log ({backtestResult.trades.length} Executed)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Auditable record of all order fills, transaction frictions, P&L, and holding durations.
                    </p>
                  </div>

                  <button
                    onClick={() => exportTradesToCsv(backtestResult.trades)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Trade Log (CSV)
                  </button>
                </div>

                {backtestResult.trades.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No trade executions occurred with the current parameters in this time horizon.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono-numeric">
                      <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5 font-semibold">Trade ID</th>
                          <th className="p-2.5 font-semibold">Entry Date</th>
                          <th className="p-2.5 font-semibold">Exit Date</th>
                          <th className="p-2.5 font-semibold">Entry / Exit Price</th>
                          <th className="p-2.5 font-semibold">Units</th>
                          <th className="p-2.5 font-semibold">Return (%)</th>
                          <th className="p-2.5 font-semibold">Net P&L ($)</th>
                          <th className="p-2.5 font-semibold">Fees Paid</th>
                          <th className="p-2.5 font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {backtestResult.trades.map(t => (
                          <tr key={t.id} className="hover:bg-slate-800/30">
                            <td className="p-2.5 text-cyan-400 font-semibold">{t.id}</td>
                            <td className="p-2.5">{formatDate(t.entryDate)}</td>
                            <td className="p-2.5">{formatDate(t.exitDate)}</td>
                            <td className="p-2.5">
                              ${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}
                            </td>
                            <td className="p-2.5">{t.shares.toFixed(3)}</td>
                            <td className={`p-2.5 font-bold ${t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatPercent(t.returnPct)}
                            </td>
                            <td className={`p-2.5 font-bold ${t.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrency(t.netPnl)}
                            </td>
                            <td className="p-2.5 text-slate-400">${t.feesPaid.toFixed(2)}</td>
                            <td className="p-2.5">{t.holdingDays}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Strategy Robustness & Sensitivity Tab */
            <div className="space-y-6">
              {/* Robustness Scorecard */}
              {robustnessScorecard && (
                <div className="terminal-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#0e172a] to-slate-900/90">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-bold text-white tracking-tight">
                          QuantLens Explainable Robustness Score
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Multi-factor validation checking out-of-sample preservation, cost resilience, and parameter stability.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-3xl font-mono-numeric font-extrabold text-white">
                          {robustnessScorecard.overallScore}<span className="text-slate-500 text-lg">/100</span>
                        </span>
                        <span className="text-xs font-mono font-bold block text-cyan-400">
                          {robustnessScorecard.grade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Component Pillars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
                    {Object.values(robustnessScorecard.components).map((comp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 font-semibold">{comp.label}</span>
                          <span className="text-cyan-300 font-bold">{comp.score}/{comp.max}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                            style={{ width: `${(comp.score / comp.max) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1 leading-snug">
                          {comp.details}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800 leading-relaxed italic">
                    {robustnessScorecard.summary}
                  </p>
                </div>
              )}

              {/* 2D Parameter Grid Search Heatmap */}
              {sensitivityGrid && (
                <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        2D Parameter Sensitivity Heatmap
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Evaluates whether your model occupies an isolated spike (overfitting) or a broad profitable plateau.
                      </p>
                    </div>

                    <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
                      <button
                        onClick={() => setRobustnessMetric('sharpe')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          robustnessMetric === 'sharpe' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Sharpe Ratio
                      </button>
                      <button
                        onClick={() => setRobustnessMetric('return')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          robustnessMetric === 'return' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        Net Return %
                      </button>
                    </div>
                  </div>

                  {/* Warning Notice */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Quantitative Overfitting Warning:</strong> The highest historical Sharpe coordinate is frequently an artifact of in-sample curve fitting. Prefer parameter clusters with stable neighbors.
                    </span>
                  </div>

                  {/* Heatmap Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-xs font-mono text-slate-500">
                            {sensitivityGrid.yLabel} ↓ \ {sensitivityGrid.xLabel} →
                          </th>
                          {sensitivityGrid.xValues.map(xVal => (
                            <th key={xVal} className="p-2 text-xs font-mono font-bold text-slate-300">
                              {xVal}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivityGrid.cells.map((row, yIdx) => (
                          <tr key={yIdx}>
                            <td className="p-2 text-xs font-mono font-bold text-slate-400 text-left">
                              {sensitivityGrid.yValues[yIdx]}
                            </td>
                            {row.map((cell, xIdx) => {
                              const val = robustnessMetric === 'sharpe' ? cell.sharpeRatio : cell.returnPct;
                              const isCurrent = cell.isCurrent;

                              const bgClass =
                                robustnessMetric === 'sharpe'
                                  ? val > 1.2 ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50' :
                                    val > 0.6 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                                    val > 0 ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                                    'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : val > 50 ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50' :
                                    val > 10 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                                    val > 0 ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                                    'bg-rose-500/20 text-rose-300 border-rose-500/30';

                              return (
                                <td key={xIdx} className="p-1">
                                  <div
                                    className={`p-2.5 rounded-xl border text-xs font-mono-numeric font-bold transition-all relative ${bgClass} ${
                                      isCurrent ? 'ring-2 ring-cyan-400 shadow-lg' : ''
                                    }`}
                                  >
                                    {robustnessMetric === 'sharpe' ? val.toFixed(2) : `${val.toFixed(1)}%`}
                                    {isCurrent && (
                                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950" title="Active Parameter Choice" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* In-Sample (70%) vs Out-of-Sample (30%) Train/Test Split */}
              {oosSplit && (
                <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    70% In-Sample vs 30% Out-of-Sample Train/Test Split
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Compares performance on historical training period against unseen future validation period.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* In-Sample Column */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                          In-Sample Training (70%)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {oosSplit.inSampleRange.start} → {oosSplit.inSampleRange.end}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono-numeric">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Return</span>
                          <span className="font-bold text-white">{formatPercent(oosSplit.inSampleResult.metrics.strategy.totalReturn)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sharpe</span>
                          <span className="font-bold text-cyan-300">{oosSplit.inSampleResult.metrics.strategy.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Max DD</span>
                          <span className="font-bold text-rose-400">{oosSplit.inSampleResult.metrics.strategy.maxDrawdown.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Out-of-Sample Column */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                          Out-of-Sample Test (30%)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {oosSplit.outOfSampleRange.start} → {oosSplit.outOfSampleRange.end}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono-numeric">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Return</span>
                          <span className="font-bold text-white">{formatPercent(oosSplit.outOfSampleResult.metrics.strategy.totalReturn)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sharpe</span>
                          <span className="font-bold text-cyan-300">{oosSplit.outOfSampleResult.metrics.strategy.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Max DD</span>
                          <span className="font-bold text-rose-400">{oosSplit.outOfSampleResult.metrics.strategy.maxDrawdown.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Cost Drag Sensitivity Curve */}
              {costCurve.length > 0 && (
                <div className="terminal-card rounded-2xl p-5 border border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    Transaction Cost Sensitivity Curve (0 to 100 bps)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Observes performance decay under progressively harsher brokerage fees and execution slippage.
                  </p>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={costCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                        <XAxis dataKey="feeBps" tickFormatter={v => `${v} bps`} stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${v}%`} />
                        <ReferenceLine y={0} stroke="#475569" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="terminal-card rounded-xl p-3 text-xs font-mono-numeric">
                                <div className="text-slate-400 pb-1 mb-1 border-b border-slate-800">{d.feeBps} bps Drag</div>
                                <div className="text-white font-bold">Net Return: {formatPercent(d.returnPct)}</div>
                                <div className="text-cyan-400">Sharpe Ratio: {d.sharpe.toFixed(2)}</div>
                                <div className="text-slate-400">Fees Paid: ${d.totalFees.toFixed(2)}</div>
                              </div>
                            );
                          }}
                        />
                        <Line type="monotone" dataKey="returnPct" name="Net Return %" stroke="#00f0ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00f0ff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Backtest Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" /> Save Backtest Run
            </h3>
            <p className="text-xs text-slate-400">
              Save this backtest configuration and its KPI outcomes into browser localStorage for cross-run comparison.
            </p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Backtest Name</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                placeholder="e.g. Gold SMA Trend Run #1"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{saveSuccess ? 'Saved!' : 'Confirm Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
