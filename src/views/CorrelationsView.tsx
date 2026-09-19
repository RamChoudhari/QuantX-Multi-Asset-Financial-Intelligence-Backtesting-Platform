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
  Grid3X3,
  Activity,
  Compass,
  ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InsightCard } from '../components/common/InsightCard';
import { MetricCard } from '../components/common/MetricCard';
import { calculatePearson, calculateRollingCorrelation } from '../lib/quant/indicators';
import { generateCorrelationInsight } from '../lib/utils/insights';
import { formatDate } from '../lib/utils/formatting';

export const CorrelationsView: React.FC = () => {
  const { assets, getBars } = useApp();

  // Selected pair for rolling correlation
  const [pairA, setPairA] = useState<string>('BTC');
  const [pairB, setPairB] = useState<string>('GOLD');
  const [rollingWindow, setRollingWindow] = useState<number>(60);

  // Compute 3x3 Heatmap Matrix
  const heatmap = useMemo(() => {
    const selectedAssets = assets.slice(0, 3);
    const matrix: Record<string, Record<string, number>> = {};

    selectedAssets.forEach(a => {
      matrix[a.id] = {};
      const barsA = getBars(a.id, true);
      const closesA = barsA.map(b => b.close);

      selectedAssets.forEach(b => {
        if (a.id === b.id) {
          matrix[a.id][b.id] = 1.0;
        } else {
          const barsB = getBars(b.id, true);
          const closesB = barsB.map(b => b.close);
          matrix[a.id][b.id] = calculatePearson(closesA, closesB);
        }
      });
    });

    return { assets: selectedAssets, matrix };
  }, [assets, getBars]);

  // Compute Rolling Correlation Series
  const { rollingSeries, stats, insightText } = useMemo(() => {
    const barsA = getBars(pairA, true);
    const barsB = getBars(pairB, true);
    const series = calculateRollingCorrelation(barsA, barsB, rollingWindow);

    if (series.length === 0) {
      return {
        rollingSeries: [],
        stats: { current: 0, avg: 0, min: 0, max: 0 },
        insightText: 'Insufficient historical overlap to compute rolling correlation.',
      };
    }

    const values = series.map(s => s.correlation);
    const current = values[values.length - 1];
    const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    const min = Number(Math.min(...values).toFixed(2));
    const max = Number(Math.max(...values).toFixed(2));

    const metaA = assets.find(a => a.id === pairA)?.name || pairA;
    const metaB = assets.find(a => a.id === pairB)?.name || pairB;

    const insightText = generateCorrelationInsight(metaA, metaB, current, avg, min, max);

    return {
      rollingSeries: series,
      stats: { current, avg, min, max },
      insightText,
    };
  }, [pairA, pairB, rollingWindow, getBars, assets]);

  // Heatmap Cell Color Helper
  const getCellBg = (val: number) => {
    if (val === 1.0) return 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50';
    if (val >= 0.6) return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40';
    if (val >= 0.3) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (val >= 0.0) return 'bg-slate-800/80 text-slate-300 border-slate-700';
    if (val >= -0.3) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/25 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            CROSS-ASSET CO-DEPENDENCE
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white mt-1">
          Correlation Heatmap & Rolling Diversification Lens
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Measure linear dependence across Gold, Bitcoin, and NVIDIA to uncover diversification benefits and regime breakdowns.
        </p>
      </div>

      {/* 3x3 Correlation Heatmap Matrix & Diversification Lens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap Column */}
        <div className="lg:col-span-5 terminal-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-cyan-400" />
                3x3 Cross-Asset Heatmap
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Pearson r</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-mono text-slate-500"></th>
                    {heatmap.assets.map(a => (
                      <th key={a.id} className="p-2 text-xs font-mono font-bold text-slate-200">
                        {a.symbol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.assets.map(rowAsset => (
                    <tr key={rowAsset.id}>
                      <td className="p-2 text-xs font-mono font-bold text-slate-300 text-left whitespace-nowrap">
                        {rowAsset.symbol}
                      </td>
                      {heatmap.assets.map(colAsset => {
                        const val = heatmap.matrix[rowAsset.id]?.[colAsset.id] ?? 0;
                        const isDiagonal = rowAsset.id === colAsset.id;
                        return (
                          <td key={colAsset.id} className="p-1.5">
                            <div
                              onClick={() => {
                                if (!isDiagonal) {
                                  setPairA(rowAsset.id);
                                  setPairB(colAsset.id);
                                }
                              }}
                              className={`p-3 rounded-xl border text-sm font-mono-numeric font-bold transition-all ${
                                !isDiagonal ? 'cursor-pointer hover:scale-105 shadow-md' : 'cursor-default'
                              } ${getCellBg(val)}`}
                              title={`${rowAsset.name} vs ${colAsset.name}: ${val.toFixed(2)}`}
                            >
                              {val.toFixed(2)}
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

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Click any off-diagonal cell to graph pair</span>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-rose-400">-1.0 (Inverse)</span>
              <span className="text-slate-500">0.0</span>
              <span className="text-cyan-400">+1.0 (Co-move)</span>
            </div>
          </div>
        </div>

        {/* Diversification Lens Column */}
        <div className="lg:col-span-7 terminal-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Diversification Lens: {assets.find(a => a.id === pairA)?.name} vs {assets.find(a => a.id === pairB)?.name}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {rollingWindow}D Sliding Window
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Current Rolling r"
                value={`${stats.current > 0 ? '+' : ''}${stats.current.toFixed(2)}`}
                subValue={stats.current < 0.2 ? 'Low Correlation' : 'Correlated'}
                subType={stats.current < 0.2 ? 'positive' : 'neutral'}
                definition="Pearson coefficient of daily percentage returns over the most recent window."
              />
              <MetricCard
                label="Historical Mean r"
                value={`${stats.avg > 0 ? '+' : ''}${stats.avg.toFixed(2)}`}
                subValue="Full Horizon"
                subType="neutral"
                definition="Mean of all rolling correlation observations across the dataset."
              />
              <MetricCard
                label="Observed Min r"
                value={`${stats.min > 0 ? '+' : ''}${stats.min.toFixed(2)}`}
                subValue="Max Divergence"
                subType="positive"
                definition="Trough correlation observed during peak market decoupling."
              />
              <MetricCard
                label="Observed Max r"
                value={`${stats.max > 0 ? '+' : ''}${stats.max.toFixed(2)}`}
                subValue="Peak Coupling"
                subType="negative"
                definition="Crest correlation observed during synchronized market runs or panics."
              />
            </div>
          </div>

          {/* Educational Formula & Infographic */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Why Correlation Changes Over Time
              </span>
              <span className="text-[10px] font-mono text-cyan-300">PORTFOLIO VARIANCE THEORY</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In Modern Portfolio Theory, overall risk is governed by covariance:
              <span className="block font-mono-numeric text-cyan-300 text-xs my-1 bg-slate-950 p-2 rounded border border-slate-800 text-center">
                σ_p² = w_A² σ_A² + w_B² σ_B² + 2 w_A w_B (r_AB · σ_A σ_B)
              </span>
              When correlation <code className="text-cyan-300">r_AB</code> shifts from <code className="text-emerald-400">+0.10</code> to <code className="text-rose-400">+0.75</code> during macro liquidity crunches, expected diversification evaporates precisely when needed most.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Rolling Correlation Time-Series Chart */}
      <div className="terminal-card rounded-2xl p-5 lg:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Rolling Correlation Timeline ({assets.find(a => a.id === pairA)?.symbol} vs {assets.find(a => a.id === pairB)?.symbol})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks the evolution of linear co-movement through major historical macro events.
            </p>
          </div>

          {/* Window Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Sliding Window:</span>
            {[30, 60, 90, 180].map(days => (
              <button
                key={days}
                onClick={() => setRollingWindow(days)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                  rollingWindow === days
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={11} minTickGap={40} />
              <YAxis stroke="#64748b" fontSize={11} domain={[-1.0, 1.0]} ticks={[-1.0, -0.5, 0.0, 0.5, 1.0]} />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = Number(payload[0].value);
                  return (
                    <div className="terminal-card rounded-xl p-3 border border-slate-700 text-xs font-mono-numeric">
                      <div className="text-slate-400 pb-1 mb-1 border-b border-slate-800">{formatDate(label)}</div>
                      <div className="flex justify-between items-center gap-3">
                        <span className="font-sans text-slate-300">Rolling {rollingWindow}D r:</span>
                        <span className={`font-bold ${val >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                          {val >= 0 ? '+' : ''}{val.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="correlation"
                name="Rolling Correlation"
                stroke="#00f0ff"
                strokeWidth={2.25}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Algorithmic Correlation Insight Card */}
      <InsightCard
        title="Diversification Lens Insight"
        insight={insightText}
        badge="CORRELATION DYNAMICS"
      />
    </div>
  );
};
