import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Upload,
  Calendar,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import {
  calculateDailyReturns,
  calculateDrawdownSeries,
  calculateEMA,
  calculateRollingAnnualizedVol,
  calculateSMA,
} from '../lib/quant/indicators';
import { calculateMetricsFromBars, calculateRollingReturns } from '../lib/quant/metrics';
import { formatDate, formatPercent } from '../lib/utils/formatting';

export const AssetExplorerView: React.FC = () => {
  const { assets, activeAsset, setActiveAsset, getBars, setCsvModalOpen } = useApp();

  // Indicator Overlay Toggles
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showEMA20, setShowEMA20] = useState<boolean>(false);
  const [showEMA50, setShowEMA50] = useState<boolean>(false);

  // Active Sub-Chart view
  const [activeSubChart, setActiveSubChart] = useState<'volume' | 'returns' | 'volatility' | 'drawdown'>('volume');

  const currentAssetMeta = assets.find(a => a.id === activeAsset) || assets[0];
  const bars = getBars(activeAsset, true);

  // Quantitative Calculations
  const {
    chartData,
    metrics,
    rollingReturns,
  } = useMemo(() => {
    if (!bars || bars.length === 0) {
      return { chartData: [], metrics: calculateMetricsFromBars([]), rollingReturns: { '1M': null, '3M': null, '6M': null, '1Y': null, '3Y': null } };
    }

    const closes = bars.map(b => b.close);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const dailyReturns = calculateDailyReturns(closes);
    const rollingVol = calculateRollingAnnualizedVol(closes, 20);
    const { drawdownPct } = calculateDrawdownSeries(closes);

    const chartData = bars.map((b, i) => ({
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      sma20: sma20[i],
      sma50: sma50[i],
      ema20: ema20[i],
      ema50: ema50[i],
      dailyReturn: Number((dailyReturns[i] * 100).toFixed(2)),
      volatility: rollingVol[i],
      drawdown: drawdownPct[i],
    }));

    const metrics = calculateMetricsFromBars(bars);
    const rollingReturns = calculateRollingReturns(bars);

    return { chartData, metrics, rollingReturns };
  }, [bars]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header with Asset Switcher & Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
            style={{
              backgroundColor: currentAssetMeta.badgeBg,
              color: currentAssetMeta.color,
              border: `1px solid ${currentAssetMeta.badgeBorder}`,
            }}
          >
            {currentAssetMeta.symbol.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {currentAssetMeta.name}
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {currentAssetMeta.symbol}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {currentAssetMeta.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              {currentAssetMeta.description}
            </p>
          </div>
        </div>

        {/* Asset Selector Tabs & CSV button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {assets.map(a => {
              const isSelected = activeAsset === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveAsset(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span>{a.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Price Chart with Overlays */}
      <div className="terminal-card rounded-2xl p-5 lg:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Historical Price & Moving Average Indicators
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive high-precision price series with SMA & EMA trend overlays.
            </p>
          </div>

          {/* Indicator Overlays Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                showSMA20
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              SMA 20
            </button>

            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                showSMA50
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              SMA 50
            </button>

            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                showEMA20
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              EMA 20
            </button>

            <button
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                showEMA50
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 opacity-60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              EMA 50
            </button>
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={['auto', 'auto']}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="terminal-card rounded-xl p-3 border border-slate-700 text-xs font-mono-numeric min-w-[200px]">
                      <div className="font-sans font-semibold text-white pb-1.5 mb-1.5 border-b border-slate-800 flex justify-between">
                        <span>{formatDate(label)}</span>
                        <span className="text-cyan-400">${d.close.toFixed(2)}</span>
                      </div>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex justify-between"><span>Open:</span><span>${d.open.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>High:</span><span className="text-emerald-400">${d.high.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Low:</span><span className="text-rose-400">${d.low.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Volume:</span><span>{d.volume.toLocaleString()}</span></div>
                        {d.sma20 && <div className="flex justify-between text-cyan-300"><span>SMA 20:</span><span>${d.sma20.toFixed(2)}</span></div>}
                        {d.sma50 && <div className="flex justify-between text-blue-300"><span>SMA 50:</span><span>${d.sma50.toFixed(2)}</span></div>}
                        {d.ema20 && <div className="flex justify-between text-purple-300"><span>EMA 20:</span><span>${d.ema20.toFixed(2)}</span></div>}
                        {d.ema50 && <div className="flex justify-between text-amber-300"><span>EMA 50:</span><span>${d.ema50.toFixed(2)}</span></div>}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="close"
                name="Close Price"
                stroke={currentAssetMeta.color}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              {showSMA20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  name="SMA 20"
                  stroke="#00f0ff"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showSMA50 && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  name="SMA 50"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showEMA20 && (
                <Line
                  type="monotone"
                  dataKey="ema20"
                  name="EMA 20"
                  stroke="#c084fc"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showEMA50 && (
                <Line
                  type="monotone"
                  dataKey="ema50"
                  name="EMA 50"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-Charts Section: Synced Volume, Daily Returns, Rolling Volatility, Underwater Drawdown */}
      <div className="terminal-card rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Quantitative Sub-Charts
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect secondary series synchronized with the primary price timeline.
            </p>
          </div>

          {/* Subchart view pills */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setActiveSubChart('volume')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeSubChart === 'volume'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trading Volume
            </button>
            <button
              onClick={() => setActiveSubChart('returns')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeSubChart === 'returns'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily Returns
            </button>
            <button
              onClick={() => setActiveSubChart('volatility')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeSubChart === 'volatility'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rolling Volatility
            </button>
            <button
              onClick={() => setActiveSubChart('drawdown')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeSubChart === 'drawdown'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Underwater Drawdown
            </button>
          </div>
        </div>

        {/* Sub-Chart Area */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeSubChart === 'volume' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} minTickGap={40} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${(v / 1e3).toFixed(0)}k`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="terminal-card rounded-lg p-2 text-xs font-mono-numeric">
                        <div>{formatDate(label)}</div>
                        <div className="text-cyan-400 font-bold">{payload[0].value?.toLocaleString()} units</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="volume" fill="#00f0ff" opacity={0.6} isAnimationActive={false} />
              </BarChart>
            ) : activeSubChart === 'returns' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} minTickGap={40} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={0} stroke="#475569" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const val = Number(payload[0].value);
                    return (
                      <div className="terminal-card rounded-lg p-2 text-xs font-mono-numeric">
                        <div>{formatDate(label)}</div>
                        <div className={`font-bold ${val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="dailyReturn" isAnimationActive={false}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.dailyReturn >= 0 ? '#10b981' : '#f43f5e'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            ) : activeSubChart === 'volatility' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} minTickGap={40} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="terminal-card rounded-lg p-2 text-xs font-mono-numeric">
                        <div>{formatDate(label)}</div>
                        <div className="text-amber-400 font-bold">{payload[0].value}% Ann. Volatility</div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="volatility" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} minTickGap={40} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={0} stroke="#475569" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="terminal-card rounded-lg p-2 text-xs font-mono-numeric">
                        <div>{formatDate(label)}</div>
                        <div className="text-rose-400 font-bold">{payload[0].value}% Drawdown</div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="drawdown" stroke="#f43f5e" fill="url(#drawdownGradient)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Metric Panel (9 Quantitative Metrics with Tooltips) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Institutional Quantitative Metrics
          </h3>
          <span className="text-xs text-slate-400">Validated across {metrics.totalDays} bars</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Total Return"
            value={formatPercent(metrics.totalReturn)}
            subValue={`CAGR: ${formatPercent(metrics.cagr)}`}
            subType={metrics.totalReturn >= 0 ? 'positive' : 'negative'}
            definition="Cumulative price change over the selected analysis horizon."
          />
          <MetricCard
            label="Annualized Volatility"
            value={`${metrics.annualizedVol.toFixed(1)}%`}
            subValue={`Daily: ${metrics.dailyVol.toFixed(2)}%`}
            subType="neutral"
            definition="Sample standard deviation of daily logarithmic returns annualized by multiplying by sqrt(252)."
          />
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpeRatio.toFixed(2)}
            subValue="Rf = 4.0%"
            subType={metrics.sharpeRatio > 1.0 ? 'positive' : 'neutral'}
            definition="Ratio of annualized excess return over the risk-free rate (4.0%) to annualized volatility."
          />
          <MetricCard
            label="Maximum Drawdown"
            value={`${metrics.maxDrawdown.toFixed(1)}%`}
            subValue={`${metrics.maxDrawdownDays} bars duration`}
            subType="negative"
            definition="Deepest observed peak-to-trough capital decline before exceeding previous peak."
          />
          <MetricCard
            label="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            subValue={`${metrics.positiveDays} up / ${metrics.negativeDays} down`}
            subType="accent"
            definition="Percentage of total trading sessions ending with a positive net return."
          />
          <MetricCard
            label="Sortino Ratio"
            value={metrics.sortinoRatio.toFixed(2)}
            subValue="Downside Risk"
            subType={metrics.sortinoRatio > 1.0 ? 'positive' : 'neutral'}
            definition="Risk-adjusted metric measuring excess return relative only to negative (downside) volatility."
          />
          <MetricCard
            label="Calmar Ratio"
            value={metrics.calmarRatio.toFixed(2)}
            subValue="CAGR / |MDD|"
            subType="neutral"
            definition="Compound Annual Growth Rate divided by the absolute value of the maximum drawdown."
          />
          <MetricCard
            label="Best Single Day"
            value={`+${metrics.bestDay.returnPct.toFixed(1)}%`}
            subValue={formatDate(metrics.bestDay.date)}
            subType="positive"
            definition="Largest single session price gain observed in the series."
          />
          <MetricCard
            label="Worst Single Day"
            value={`${metrics.worstDay.returnPct.toFixed(1)}%`}
            subValue={formatDate(metrics.worstDay.date)}
            subType="negative"
            definition="Largest single session price crash observed in the series."
          />
          <MetricCard
            label="Total Trading Days"
            value={`${metrics.totalDays}`}
            subValue="Business Days"
            subType="neutral"
            definition="Number of historical trading sessions evaluated in this window."
          />
        </div>
      </div>

      {/* Rolling Return Matrix */}
      <div className="terminal-card rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Rolling Return Trajectory
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Point-in-time trailing returns evaluated from latest available bar backwards.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-numeric">
          {([
            { key: '1M', label: '1 Month' },
            { key: '3M', label: '3 Months' },
            { key: '6M', label: '6 Months' },
            { key: '1Y', label: '1 Year' },
            { key: '3Y', label: '3 Years' },
          ] as const).map(({ key, label }) => {
            const ret = rollingReturns[key];
            return (
              <div key={key} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] font-sans font-medium text-slate-400 block mb-1">
                  {label}
                </span>
                <span className={`text-base font-bold ${
                  ret === null ? 'text-slate-500' : ret >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {ret === null ? 'N/A' : formatPercent(ret)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
