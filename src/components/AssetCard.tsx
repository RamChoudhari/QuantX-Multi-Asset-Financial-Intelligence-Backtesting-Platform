import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Activity, Shield } from 'lucide-react';
import { BackendMarketData } from '../lib/api/marketApi';

interface AssetCardProps {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  color: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDeepDive?: (id: string) => void;
  marketData?: BackendMarketData | null;
  fallbackPrice?: number;
  fallbackChange?: number;
  fallbackVol?: number;
  sparkline?: number[];
}

export const AssetCard: React.FC<AssetCardProps> = ({
  id,
  name,
  symbol,
  category,
  color,
  isSelected,
  onSelect,
  onDeepDive,
  marketData,
  fallbackPrice = 100,
  fallbackChange = 0,
  fallbackVol = 0.2,
  sparkline = [],
}) => {
  // Use real backend data if available, fallback gracefully
  const latestPrice = marketData?.latest_price ?? fallbackPrice;
  const periodReturn = marketData?.period_return_pct ?? fallbackChange;
  const volatility = marketData?.annualized_volatility ?? fallbackVol;
  const isPositive = periodReturn >= 0;

  // Build SVG sparkline path
  const points = (marketData?.history?.slice(-30).map(h => h.close) || sparkline).slice(-30);
  const minVal = points.length ? Math.min(...points) : 0;
  const maxVal = points.length ? Math.max(...points) : 1;
  const range = maxVal - minVal || 1;

  const width = 120;
  const height = 36;
  const svgPath = points.length > 1
    ? points
        .map((p, idx) => {
          const x = (idx / (points.length - 1)) * width;
          const y = height - ((p - minVal) / range) * (height - 6) - 3;
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ')
    : '';

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-gradient-to-b from-slate-900 via-[#0d1527] to-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-950/30 scale-[1.02]'
          : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Active Indicator Strip */}
      {isSelected && (
        <div
          className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Top row: Name, Category, Symbol */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <div>
            <h3 className="font-bold text-white text-base leading-snug group-hover:text-cyan-300 transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
              <span>{symbol}</span>
              {category && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-500 uppercase">{category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live data pulse indicator */}
        <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Middle row: Latest Price & Sparkline */}
      <div className="flex items-end justify-between mt-5 gap-3">
        <div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
            ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold font-mono px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}
              {periodReturn.toFixed(2)}%
            </span>
            <span className="text-[11px] text-slate-500">Period Return</span>
          </div>
        </div>

        {/* Mini SVG Sparkline */}
        {svgPath && (
          <div className="shrink-0">
            <svg width={width} height={height} className="overflow-visible">
              <path
                d={svgPath}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom row: Volatility & Deep Dive Action */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Vol (Ann):</span>
          <span className="font-semibold text-slate-200">
            {(volatility * 100).toFixed(1)}%
          </span>
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            if (onDeepDive) onDeepDive(id);
            else onSelect(id);
          }}
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors group/btn"
        >
          <span>Analyze</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
