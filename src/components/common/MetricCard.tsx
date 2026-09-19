import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subText?: string;
  subType?: 'positive' | 'negative' | 'neutral' | 'accent';
  definition?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  subText,
  subType = 'neutral',
  definition,
  sparklineData,
  sparklineColor = '#00f0ff',
  icon,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getSubColor = () => {
    switch (subType) {
      case 'positive': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'negative': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'accent': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      default: return 'text-slate-400 bg-slate-800/60 border-slate-700/50';
    }
  };

  // Generate lightweight SVG sparkline
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 80;
    const height = 28;

    const points = sparklineData.map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={sparklineColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="terminal-card rounded-xl p-4 relative group transition-all duration-200 hover:border-slate-700">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span>{label}</span>
          {definition && (
            <div className="relative inline-block">
              <button
                type="button"
                aria-label={`Definition of ${label}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 shadow-xl leading-relaxed pointer-events-none">
                  {definition}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
        {sparklineData && renderSparkline()}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono-numeric text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        {subValue && (
          <span className={`text-xs font-mono-numeric font-medium px-2 py-0.5 rounded border ${getSubColor()}`}>
            {subValue}
          </span>
        )}
      </div>

      {subText && (
        <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">
          {subText}
        </p>
      )}
    </div>
  );
};
