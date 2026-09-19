import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Compass, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GuidedTourModal: React.FC = () => {
  const { showGuidedTour, setShowGuidedTour, setActiveTab, setActiveAsset } = useApp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showGuidedTour) return null;

  const tourSteps = [
    {
      stepNumber: 1,
      tabId: 'overview',
      title: 'Compare Gold, Bitcoin, & NVIDIA',
      description: 'The Overview dashboard normalizes all three assets to a base value of 100 to clearly contrast asymmetric risk-adjusted performance. Observe how Bitcoin leads returns while Gold offers maximum downside preservation.',
      action: () => {
        setActiveTab('overview');
      },
      tag: 'Step 1 of 5',
    },
    {
      stepNumber: 2,
      tabId: 'correlations',
      title: 'Reveal Changing Correlations',
      description: 'Inspect the 3x3 Correlation Heatmap and slide the rolling correlation window (30d to 180d). Notice how cross-asset correlations are not static, but shift dynamically during macro risk-off shocks.',
      action: () => {
        setActiveTab('correlations');
      },
      tag: 'Step 2 of 5',
    },
    {
      stepNumber: 3,
      tabId: 'strategy',
      title: 'Systematic Strategy Backtesting',
      description: 'Test quantitative rules (SMA, EMA, Momentum, Mean Reversion) in the Strategy Lab. The engine simulates execution strictly at next-bar open to eliminate look-ahead bias.',
      action: () => {
        setActiveTab('strategy');
        setActiveAsset('GOLD');
      },
      tag: 'Step 3 of 5',
    },
    {
      stepNumber: 4,
      tabId: 'strategy',
      title: 'Fair Benchmark & Friction Testing',
      description: 'Evaluate alpha after deducting basis-point fees (10 bps) and slippage (5 bps) on both entry and exit. View the equity curve, underwater drawdowns, and the complete audit-grade trade log.',
      action: () => {
        setActiveTab('strategy');
      },
      tag: 'Step 4 of 5',
    },
    {
      stepNumber: 5,
      tabId: 'regimes',
      title: 'Market Regimes & Robustness',
      description: 'Verify if your trading edge holds across Bull, Bear, and High-Volatility regimes. Use parameter heatmaps and 70/30 out-of-sample train/test splits to detect overfitting.',
      action: () => {
        setActiveTab('regimes');
      },
      tag: 'Step 5 of 5',
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      tourSteps[next].action();
    } else {
      setShowGuidedTour(false);
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      tourSteps[prev].action();
    }
  };

  const current = tourSteps[currentStep];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="terminal-card rounded-2xl border-2 border-cyan-500/50 p-5 bg-[#0b1222]/95 backdrop-blur-2xl shadow-2xl shadow-cyan-500/20">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
              {current.stepNumber}
            </span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              {current.tag}
            </span>
          </div>
          <button
            onClick={() => setShowGuidedTour(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/60 transition-colors"
            aria-label="Exit Guided Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-cyan-400" />
          {current.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {current.description}
        </p>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            {currentStep === tourSteps.length - 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
