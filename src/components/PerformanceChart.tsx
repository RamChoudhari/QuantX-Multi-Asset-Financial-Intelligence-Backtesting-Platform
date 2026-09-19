import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Layers, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '../lib/utils/formatting';
import { BackendMarketData } from '../lib/api/marketApi';

interface PerformanceChartProps {
  assets: Array<{ id: string; name: string; symbol: string; color: string }>;
  backendDataMap?: Record<string, BackendMarketData | null>;
  fallbackNormalizedData?: any[];
  selectedAsset: string;
  onSelectAsset: (id: string) => void;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  assets,
  backendDataMap,
  fallbackNormalizedData = [],
  selectedAsset,
  onSelectAsset,
}) => {
  // Visibility toggles for the 3 assets
  const [visible, setVisible] = useState<Record<string, boolean>>({
    GOLD: true,
    BTC: true,
    NVDA: true,
  });

  const toggleVisibility = (id: string) => {
    setVisible(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build normalized base-100 series from real backend history
  const chartData = useMemo(() => {
    // Check if we have real backend history
    const btcHistory = backendDataMap?.['BTC']?.history || [];
    const goldHistory = backendDataMap?.['GOLD']?.history || [];
    const nvdaHistory = backendDataMap?.['NVDA']?.history || [];

    if (!btcHistory.length && !goldHistory.length && !nvdaHistory.length) {
      return fallbackNormalizedData;
    }

    // Collect all dates
    const dateMap = new Map<string, Record<string, number>>();

    const addHistory = (assetId: string, history: Array<{ date: string; close: number }>) => {
      if (!history.length) return;
      const baseClose = history[0].close || 1;

      history.forEach(pt => {
        if (!dateMap.has(pt.date)) {
          dateMap.set(pt.date, {});
        }
        const record = dateMap.get(pt.date)!;
        record[assetId] = Number(((pt.close / baseClose) * 100).toFixed(2));
        record[`${assetId}_raw`] = pt.close;
      });
    };

    addHistory('BTC', btcHistory);
    addHistory('GOLD', goldHistory);
    addHistory('NVDA', nvdaHistory);

    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map(dateStr => {
      const dataPoint: any = {
        date: dateStr,
        displayDate: formatDate(dateStr),
        ...dateMap.get(dateStr),
      };
      return dataPoint;
    });
  }, [backendDataMap, fallbackNormalizedData]);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-xl p-3.5 bg-[#090e1c]/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[220px]">
        <div className="text-slate-400 font-sans font-semibold pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Base = 100</span>
        </div>
        <div className="space-y-2">
          {payload.map((item: any) => {
            const asset = assets.find(a => a.id === item.dataKey);
            if (!asset) return null;
            const normVal = Number(item.value);
            const delta = normVal - 100;
            const isSelected = selectedAsset === asset.id;

            return (
              <div
                key={item.dataKey}
                className={`flex items-center justify-between gap-3 p-1 rounded-md ${
                  isSelected ? 'bg-cyan-500/10 border border-cyan-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 font-sans font-medium text-slate-200">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{asset.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">{normVal.toFixed(1)}</span>
                  <span
                    className={`text-[10px] ml-1.5 font-semibold ${
                      delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ({delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 p-5 shadow-xl">
      {/* Header & Asset Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-base tracking-wide">
              Multi-Asset Normalized Performance
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Indexed to 100 at window start to compare relative capital trajectories across disparate asset classes.
          </p>
        </div>

        {/* Visibility Buttons */}
        <div className="flex items-center gap-2">
          {assets.slice(0, 3).map(a => {
            const isVis = visible[a.id] !== false;
            const isSelected = selectedAsset === a.id;
            return (
              <button
                key={a.id}
                onClick={() => toggleVisibility(a.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                  isVis
                    ? isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400/40'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-60'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isVis ? a.color : '#475569' }}
                />
                <span className="font-bold">{a.id}</span>
                {isVis ? <Eye className="w-3 h-3 ml-0.5 opacity-70" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              minTickGap={35}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={val => `${val.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Render Lines for each visible asset */}
            {assets.slice(0, 3).map(a => {
              if (visible[a.id] === false) return null;
              const isSelected = selectedAsset === a.id;
              return (
                <Line
                  key={a.id}
                  type="monotone"
                  dataKey={a.id}
                  name={a.name}
                  stroke={a.color}
                  strokeWidth={isSelected ? 3 : 1.8}
                  strokeOpacity={isSelected ? 1 : 0.75}
                  dot={false}
                  activeDot={{
                    r: isSelected ? 6 : 4,
                    stroke: a.color,
                    strokeWidth: 2,
                    fill: '#0f172a',
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
        <span>{'Formula: P_norm = (P_t / P_0) * 100'}</span>
        <span>Python Backend Real-Time Verification</span>
      </div>
    </div>
  );
};
