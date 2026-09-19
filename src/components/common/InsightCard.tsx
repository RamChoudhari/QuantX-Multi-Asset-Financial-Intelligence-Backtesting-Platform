import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface InsightCardProps {
  title?: string;
  insight: string;
  badge?: string;
  type?: 'research' | 'warning' | 'verdict';
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = 'Research Intelligence Insight',
  insight,
  badge = 'ALGORITHMIC SYNTHESIS',
  type = 'research',
}) => {
  const getBorderGlow = () => {
    switch (type) {
      case 'warning': return 'border-amber-500/30 bg-amber-950/10';
      case 'verdict': return 'border-emerald-500/30 bg-emerald-950/10';
      default: return 'border-cyan-500/30 bg-cyan-950/10';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning': return <Info className="w-4 h-4 text-amber-400" />;
      default: return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className={`terminal-card rounded-xl p-4 border ${getBorderGlow()} relative overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-mono-numeric font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-slate-700">
          {badge}
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        {insight}
      </p>

      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>Computed strictly from empirical mark-to-market data points</span>
        <span className="italic">Non-advisory educational research</span>
      </div>
    </div>
  );
};
