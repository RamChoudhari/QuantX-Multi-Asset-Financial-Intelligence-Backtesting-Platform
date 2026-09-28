import React from 'react';
import { Download, Upload, Bookmark, HelpCircle, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DateRangeSelector } from './DateRangeSelector';
import { DataHealthBadge } from './DataHealthBadge';

export const Navbar: React.FC = () => {
  const {
    savedBacktests,
    setExportModalOpen,
    setCsvModalOpen,
    setSavedModalOpen,
    setShowGuidedTour,
    setShowOnboarding,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-[#070a12]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-[#0b1324] border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <img src="/logo.svg" alt="QUANTORA Logo" className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                QUAN<span className="text-cyan-400">TORA</span>
              </h1>
              <span className="text-[10px] uppercase font-mono-numeric font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                3D TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Quantitative Financial Intelligence Terminal
            </p>
          </div>
        </div>

        {/* Center: Global Date Range Selector & Data Health */}
        <div className="hidden md:flex items-center gap-3">
          <DateRangeSelector />
          <DataHealthBadge />
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Guided Tour button */}
          <button
            onClick={() => setShowGuidedTour(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:bg-cyan-500/10 text-xs font-medium transition-all shadow-sm"
            title="Start Interactive Guided Demo Tour"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Guided Demo</span>
          </button>

          {/* Upload CSV */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Upload Custom OHLCV CSV Dataset"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Import CSV</span>
          </button>

          {/* Saved Backtests */}
          <button
            onClick={() => setSavedModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors relative"
            title="View Saved Backtests"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Saved</span>
            {savedBacktests.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono-numeric font-bold bg-amber-500 text-slate-950 rounded-full">
                {savedBacktests.length}
              </span>
            )}
          </button>

          {/* Export Report */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-semibold transition-all shadow-lg shadow-cyan-500/20"
            title="Generate Printable Executive Research Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          {/* Help / About modal trigger */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Terminal Guide & Introduction"
            aria-label="Terminal Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile date selector bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-t border-slate-800/60 bg-slate-950/70 overflow-x-auto">
        <DateRangeSelector />
        <DataHealthBadge />
      </div>
    </header>
  );
};
