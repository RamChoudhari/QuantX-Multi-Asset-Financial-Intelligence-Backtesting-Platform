import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Gauge,
  Activity,
  Layers,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  classifyMarketRegimes,
  computeCrossStrategyRegimeMatrix,
  computeRegimePerformance,
} from '../lib/quant/regimes';
import { formatDate, formatPercent } from '../lib/utils/formatting';
import type { MarketRegimeType, StrategyParams } from '../lib/types';

export const MarketRegimesView: React.FC = () => {
  const { assets, activeAsset, setActiveAsset, getBars } = useApp();

  const currentAssetMeta = assets.find(a => a.id === activeAsset) || assets[0];
  const bars = getBars(activeAsset, true);

  // Classify Regimes & Compute Performance Breakdown
  const { regimePoints, distribution, performanceByRegime, crossStrategyMatrix } = useMemo(() => {
    if (!bars || bars.length === 0) {
      return { regimePoints: [], distribution: [], performanceByRegime: [], crossStrategyMatrix: { regimes: [], strategies: [] } };
    }

    const { regimePoints, distribution } = classifyMarketRegimes(bars);

    const defaultParams: StrategyParams = {
      strategyType: 'SMA_CROSSOVER',
      assetId: activeAsset,
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
    };

    const performanceByRegime = computeRegimePerformance(bars, regimePoints, defaultParams);
    const crossStrategyMatrix = computeCrossStrategyRegimeMatrix(bars);

    return { regimePoints, distribution, performanceByRegime, crossStrategyMatrix };
  }, [bars, activeAsset]);

  const activeRegime = regimePoints[regimePoints.length - 1]?.regime || 'BULL';

  const regimeColors: Record<MarketRegimeType, string> = {
    BULL: '#10b981',
    BEAR: '#f43f5e',
    HIGH_VOL: '#f59e0b',
    LOW_VOL: '#00f0ff',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              EMPIRICAL REGIME CLASSIFIER
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Market Regime Engine: {currentAssetMeta.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Classifies macroeconomic price action into Bull, Bear, High Volatility, and Low Volatility states.
          </p>
        </div>

        {/* Asset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          {assets.slice(0, 3).map(a => (
            <button
              key={a.id}
              onClick={() => setActiveAsset(a.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeAsset === a.id
                  ? 'bg-slate-800 text-white border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Regime Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {distribution.map(item => {
          const isCurrent = activeRegime === item.regime;
          return (
            <div
              key={item.regime}
              className={`terminal-card rounded-2xl p-5 border relative overflow-hidden transition-all ${
                isCurrent ? 'ring-1 ring-cyan-400 border-cyan-500/50' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {item.label}
                  </h2>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-mono-numeric font-extrabold text-white">
                  {item.pct}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {item.count} sessions
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono-numeric">
                <div>
                  <span className="text-[10px] text-slate-500 block">Avg Daily</span>
                  <span className={item.avgDailyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {item.avgDailyReturn > 0 ? '+' : ''}{item.avgDailyReturn.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Ann. Vol</span>
                  <span className="text-amber-300">{item.annualizedVol.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Color-Coded Regime Timeline Chart */}
      <div className="terminal-card rounded-2xl p-5 lg:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Historical Regime Classification Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical bars classified by 200 SMA trend filters, 20d momentum, and volatility percentile bands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Bull
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Bear
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> High Vol
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Low Vol
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={regimePoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={11} minTickGap={40} />
              <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} tickFormatter={v => `$${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0].payload;
                  return (
                    <div className="terminal-card rounded-xl p-3 text-xs font-mono-numeric min-w-[200px]">
                      <div className="text-slate-400 pb-1 mb-1 border-b border-slate-800 font-sans flex justify-between">
                        <span>{formatDate(label)}</span>
                        <span className="font-bold" style={{ color: regimeColors[pt.regime as MarketRegimeType] }}>
                          {pt.regime}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex justify-between"><span>Price:</span><span className="font-bold text-white">${pt.close.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>200 SMA:</span><span>${pt.sma200.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>20d Momentum:</span><span>{pt.momentum}%</span></div>
                        <div className="flex justify-between"><span>Ann. Volatility:</span><span>{pt.volPercentile}%</span></div>
                      </div>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="close" stroke="#cbd5e1" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="sma200" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Performance Breakdown by Regime */}
      <div className="terminal-card rounded-2xl p-5 border border-slate-800">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          Strategy Performance Profile Across Regimes
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Empirical return, risk-adjusted Sharpe ratio, and drawdown distribution within each macroeconomic state.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono-numeric">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold font-sans">Market Regime</th>
                <th className="p-3 font-semibold">Strategy Return</th>
                <th className="p-3 font-semibold">Benchmark Return</th>
                <th className="p-3 font-semibold">Sharpe Ratio</th>
                <th className="p-3 font-semibold">Max Drawdown</th>
                <th className="p-3 font-semibold">Trade Count</th>
                <th className="p-3 font-semibold">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {performanceByRegime.map(item => (
                <tr key={item.regime} className="hover:bg-slate-800/20">
                  <td className="p-3 font-bold font-sans flex items-center gap-2 text-white">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: regimeColors[item.regime] }} />
                    {item.label}
                  </td>
                  <td className={`p-3 font-bold ${item.strategyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(item.strategyReturn)}
                  </td>
                  <td className="p-3 text-slate-400">
                    {formatPercent(item.benchmarkReturn)}
                  </td>
                  <td className="p-3 font-bold text-cyan-300">
                    {item.sharpeRatio.toFixed(2)}
                  </td>
                  <td className="p-3 text-rose-400">
                    {item.maxDrawdown.toFixed(1)}%
                  </td>
                  <td className="p-3">
                    {item.tradeCount}
                  </td>
                  <td className="p-3">
                    {item.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Strategy Regime Suitability Matrix */}
      <div className="terminal-card rounded-2xl p-5 border border-slate-800">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Cross-Strategy Regime Suitability Matrix
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Comparative suitability mapping which algorithmic architectures naturally excel or degrade in each market condition.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-center text-xs font-mono-numeric">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 text-left font-sans font-semibold">Strategy Model</th>
                <th className="p-3 font-semibold text-emerald-400">Bull Expansion</th>
                <th className="p-3 font-semibold text-rose-400">Bear Contraction</th>
                <th className="p-3 font-semibold text-amber-400">High Volatility</th>
                <th className="p-3 font-semibold text-cyan-400">Low Volatility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {crossStrategyMatrix.strategies.map(strat => (
                <tr key={strat.type} className="hover:bg-slate-800/20">
                  <td className="p-3 text-left font-sans font-semibold text-white">
                    {strat.label}
                  </td>
                  {(['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'] as MarketRegimeType[]).map(reg => {
                    const score = strat.scores[reg];
                    const badgeClass =
                      score.bestSuitability === 'BEST' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      score.bestSuitability === 'GOOD' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                      score.bestSuitability === 'NEUTRAL' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/40';

                    return (
                      <td key={reg} className="p-2.5">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeClass}`}>
                            {score.bestSuitability}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Sharpe: {score.sharpe.toFixed(2)}
                          </span>
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

      {/* Educational Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Methodology Safeguard: Historical Classifications vs Predictive Models</strong>
          Market regimes calculated by QuantLens are backward-looking empirical segmentations constructed from moving average trends and historical volatility percentiles.
          They explain how strategies behaved historically during specific market conditions, but do not guarantee when future regime transitions will occur.
        </div>
      </div>
    </div>
  );
};
