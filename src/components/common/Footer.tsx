import React from 'react';
import { ShieldAlert, BookCheck, Terminal, Cpu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#060910] text-slate-400 py-8 px-4 lg:px-8 mt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Prominent Educational & Regulatory Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300/90 text-xs leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
              Quantitative Research & Educational Use Disclaimer
            </span>
            <p className="text-amber-200/80">
              Historical analysis is not financial advice. Past performance does not guarantee future results.
              QuantLens is an academic research and technical simulation platform. All strategy simulations, backtest outcomes,
              metrics, and regime classifications are computed strictly from historical empirical data and mathematical models.
              They do not account for unmodelled market anomalies, unexpected regulatory changes, extreme liquidity dry-ups, or systemic counterparty defaults.
            </p>
          </div>
        </div>

        {/* Terminal Meta & Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="font-semibold text-slate-300">QuantLens v2.4 Terminal</span>
            <span className="text-slate-400">•</span>
            <span>Deterministic Research Edition</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => setActiveTab('methodology')}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <BookCheck className="w-3.5 h-3.5" />
              Methodology & Safeguards
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5" />
              Zero Look-Ahead Execution Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
