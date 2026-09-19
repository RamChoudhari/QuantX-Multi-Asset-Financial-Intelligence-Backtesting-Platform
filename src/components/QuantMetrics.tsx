import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Activity,
  ShieldAlert,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface QuantMetricsProps {
  assetName: string;
  symbol: string;
  metrics?: {
    initialCapital?: number;
    finalCapital?: number;
    totalReturn?: number;
    cagr?: number;
    annualizedVol?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    winRate?: number;
  } | null;
  hasBacktestRun?: boolean;
}

export const QuantMetrics: React.FC<QuantMetricsProps> = ({
  assetName,
  symbol,
  metrics,
  hasBacktestRun = false,
}) => {
  const cards = [
    {
      title: 'Initial Capital',
      value: hasBacktestRun && metrics?.initialCapital !== undefined
        ? `$${metrics.initialCapital.toLocaleString()}`
        : null,
      unavailableReason: 'Awaiting Backtest Engine',
      icon: DollarSign,
      color: '#38bdf8',
      formula: 'Configured capital allocation ($10,000 base)',
    },
    {
      title: 'Final Capital',
      value: hasBacktestRun && metrics?.finalCapital !== undefined
        ? `$${metrics.finalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : null,
      unavailableReason: 'Awaiting Backtest Engine',
      icon: DollarSign,
      color: '#34d399',
      formula: 'Marked-to-market net equity after friction deductions',
    },
    {
      title: 'Total Return',
      value: metrics?.totalReturn !== undefined
        ? `${metrics.totalReturn >= 0 ? '+' : ''}${(metrics.totalReturn * 100).toFixed(2)}%`
        : null,
      unavailableReason: 'Computing in Python...',
      icon: TrendingUp,
      color: metrics?.totalReturn && metrics.totalReturn >= 0 ? '#34d399' : '#f87171',
      formula: '(P_end - P_start) / P_start',
    },
    {
      title: 'CAGR',
      value: metrics?.cagr !== undefined
        ? `${metrics.cagr >= 0 ? '+' : ''}${(metrics.cagr * 100).toFixed(2)}%`
        : null,
      unavailableReason: 'Computing in Python...',
      icon: Percent,
      color: '#38bdf8',
      formula: '(P_end / P_start)^(252 / N) - 1',
    },
    {
      title: 'Annualized Volatility',
      value: metrics?.annualizedVol !== undefined
        ? `${(metrics.annualizedVol * 100).toFixed(2)}%`
        : null,
      unavailableReason: 'Computing in Python...',
      icon: Activity,
      color: '#fbbf24',
      formula: 'sigma_daily * sqrt(252)',
    },
    {
      title: 'Sharpe Ratio',
      value: metrics?.sharpeRatio !== undefined
        ? metrics.sharpeRatio.toFixed(2)
        : null,
      unavailableReason: 'Computing in Python...',
      icon: Award,
      color: '#a78bfa',
      formula: '(R_p - R_f) / sigma_p with R_f = 4.0%',
    },
    {
      title: 'Maximum Drawdown',
      value: metrics?.maxDrawdown !== undefined
        ? `${(metrics.maxDrawdown * 100).toFixed(2)}%`
        : null,
      unavailableReason: 'Computing in Python...',
      icon: ShieldAlert,
      color: '#f87171',
      formula: 'Min((P_t - HighWaterMark_t) / HighWaterMark_t)',
    },
    {
      title: 'Win Rate',
      value: hasBacktestRun && metrics?.winRate !== undefined
        ? `${(metrics.winRate * 100).toFixed(1)}%`
        : null,
      unavailableReason: 'Awaiting Backtest Engine',
      icon: CheckCircle2,
      color: '#2dd4bf',
      formula: 'Count(Profitable Trades) / Total Trades',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
            <span>Institutional Quantitative Metrics</span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
              {assetName} ({symbol})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical parameters evaluated via Python Pandas & NumPy algorithms. Uncomputed trade models display explicit pending states.
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg w-fit">
          Python Engine: Source of Truth
        </div>
      </div>

      {/* Grid of 8 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const isAvailable = c.value !== null && c.value !== undefined;

          return (
            <div
              key={idx}
              className="rounded-xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-lg relative overflow-hidden transition-all duration-200 hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span className="font-medium">{c.title}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
              </div>

              {isAvailable ? (
                <div>
                  <div className="text-xl font-bold font-mono text-white tracking-tight">
                    {c.value}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 truncate" title={c.formula}>
                    {c.formula}
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950 border border-amber-500/30 text-[11px] font-mono text-amber-400/90">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{c.unavailableReason}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Run Strategy Lab to generate</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
