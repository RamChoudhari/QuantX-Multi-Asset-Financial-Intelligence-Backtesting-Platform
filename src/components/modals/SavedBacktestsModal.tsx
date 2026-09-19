import React from 'react';
import { X, Bookmark, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatPercent, formatDate } from '../../lib/utils/formatting';

export const SavedBacktestsModal: React.FC = () => {
  const { savedModalOpen, setSavedModalOpen, savedBacktests, deleteBacktestRun, setActiveTab, setActiveAsset } = useApp();

  if (!savedModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-gradient-to-b from-slate-900 to-[#070a12] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={() => setSavedModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Bookmark className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Saved Research Runs & Backtests
            </h2>
            <p className="text-xs text-slate-400">
              Persisted across browser sessions in localStorage. Compare quantitative metrics side-by-side.
            </p>
          </div>
        </div>

        {savedBacktests.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-300 font-medium">No saved backtests yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Run a backtest in the Strategy Lab and click "Save Backtest" to preserve and compare your experiments here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono-numeric">
                    <th className="p-3 font-semibold">Run Name & Asset</th>
                    <th className="p-3 font-semibold">Strategy</th>
                    <th className="p-3 font-semibold">Net Return</th>
                    <th className="p-3 font-semibold">Benchmark</th>
                    <th className="p-3 font-semibold">Alpha</th>
                    <th className="p-3 font-semibold">Sharpe</th>
                    <th className="p-3 font-semibold">Max DD</th>
                    <th className="p-3 font-semibold">Trades / Win Rate</th>
                    <th className="p-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numeric text-slate-300">
                  {savedBacktests.map(run => {
                    const alpha = run.returnPct - run.benchmarkReturnPct;
                    return (
                      <tr key={run.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-white font-sans">{run.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-cyan-400">{run.assetName}</span>
                            <span>•</span>
                            <span>{formatDate(new Date(run.timestamp).toISOString())}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-sans">
                            {run.strategyType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`p-3 font-bold ${run.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPercent(run.returnPct)}
                        </td>
                        <td className="p-3 text-slate-400">
                          {formatPercent(run.benchmarkReturnPct)}
                        </td>
                        <td className={`p-3 font-semibold ${alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPercent(alpha)}
                        </td>
                        <td className="p-3 font-semibold text-cyan-300">
                          {run.sharpe.toFixed(2)}
                        </td>
                        <td className="p-3 text-rose-400">
                          {run.maxDrawdown.toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <div>{run.totalTrades} trades</div>
                          <div className="text-[10px] text-slate-400">{run.winRate.toFixed(1)}% win</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveAsset(run.assetId);
                                setActiveTab('strategy');
                                setSavedModalOpen(false);
                              }}
                              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                              title="Inspect in Strategy Lab"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBacktestRun(run.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Run"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            LocalStorage persistence active
          </span>
          <button
            onClick={() => setSavedModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
