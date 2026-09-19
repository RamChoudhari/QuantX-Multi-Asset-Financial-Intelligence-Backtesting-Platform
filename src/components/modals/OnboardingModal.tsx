import React from 'react';
import { X, Sparkles, TrendingUp, ShieldCheck, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, setShowGuidedTour } = useApp();

  if (!showOnboarding) return null;

  const handleStartTour = () => {
    setShowOnboarding(false);
    setShowGuidedTour(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-slate-900 to-[#070a12] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-500/10">
        {/* Close */}
        <button
          onClick={() => setShowOnboarding(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <img src="/logo.svg" alt="QuantLens" className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Welcome to Quant<span className="text-cyan-400">Lens</span>
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                RESEARCH TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              From raw market data to research-grade quantitative decisions.
            </p>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Multi-Asset Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyze Gold, Bitcoin, and NVIDIA across normalized growth, volatility, and risk metrics.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Systematic Strategy Lab</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Backtest SMA, EMA, Momentum, and Mean Reversion with realistic slippage, fees, and zero look-ahead bias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Regimes & Robustness</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test parameter sensitivity, 70/30 out-of-sample splits, and 4-state market regime adaptability.
            </p>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-normal mb-6">
          <strong className="text-slate-300">Responsible Methodology Notice:</strong> All quantitative simulations include transaction friction modeling (fees & slippage) and follow strict next-bar execution. Historical results are for academic exploration and not financial advice.
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => setShowOnboarding(false)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Start Exploring Directly
          </button>
          <button
            onClick={handleStartTour}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            <Compass className="w-4 h-4" />
            Launch Guided Demo Tour
          </button>
        </div>
      </div>
    </div>
  );
};
