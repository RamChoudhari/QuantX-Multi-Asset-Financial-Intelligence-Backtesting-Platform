import React from 'react';
import {
  BookOpen,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Rocket,
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            RESEARCH RIGOR & QUANTITATIVE METHODOLOGY
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1.5">
          QuantLens Architecture, Formulas, & Safeguards
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Full documentation of end-to-end data processing, execution conventions, mathematical formulas, and scientific safeguards designed to prevent backtest overfitting.
        </p>
      </div>

      {/* 1. Component-Based Architecture Pipeline Diagram */}
      <div className="terminal-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            End-to-End Quantitative Data Pipeline
          </h2>
          <span className="text-xs font-mono text-cyan-400 font-semibold">
            6-LAYER DETERMINISTIC STACK
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Every price tick flows deterministically through six isolated modular stages to guarantee analytical integrity and zero look-ahead bias.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Layer 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-xs font-bold text-white">Ingestion</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deterministic daily OHLCV series for Gold, BTC, and NVDA, plus custom CSV drag & drop with header validation.
            </p>
          </div>

          {/* Layer 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-xs font-bold text-white">Normalization</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Base-100 index synchronization across uneven calendar trading sessions to enable fair cross-asset comparison.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-xs font-bold text-white">Math Engine</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SMA, EMA, Rolling Volatility (sqrt 252), Bollinger Bands, Pearson correlation, and Rate of Change (ROC).
            </p>
          </div>

          {/* Layer 4 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
              04
            </div>
            <h3 className="text-xs font-bold text-white">Regime Engine</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Four-state macro segmentation (Bull, Bear, High Vol, Low Vol) using 200-day trend and historical percentile bounds.
            </p>
          </div>

          {/* Layer 5 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-2 relative bg-cyan-950/10 group shadow-md shadow-cyan-500/5">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
              05
            </div>
            <h3 className="text-xs font-bold text-white">Execution Simulator</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Signal on Bar t close; execution at Bar t+1 Open with explicit commissions (bps) and slippage deduction.
            </p>
          </div>

          {/* Layer 6 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 relative group hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
              06
            </div>
            <h3 className="text-xs font-bold text-white">Audit & Export</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explainable robustness scoring, 2D parameter heatmaps, 70/30 train/test splits, and CSV/PDF export.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Mathematical Definitions & Formulas */}
      <div className="terminal-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          Mathematical Definitions & Formal Specifications
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Formulas implemented in the QuantLens core library without approximations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-numeric">
          {/* Daily Returns */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">Daily Simple Return</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              R_t = (P_t - P_&#123;t-1&#125;) / P_&#123;t-1&#125;
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Calculates daily discrete return. Baseline input for volatility, Sharpe, and drawdowns.
            </p>
          </div>

          {/* Annualized Volatility */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">Annualized Volatility</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              σ_ann = σ_daily × √252
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Standard deviation of daily returns scaled by the square root of 252 annual trading days.
            </p>
          </div>

          {/* Sharpe Ratio */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">Sharpe Ratio</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              S = (R_ann - R_f) / σ_ann
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Excess return over the 4.0% risk-free rate per unit of annualized total volatility.
            </p>
          </div>

          {/* Maximum Drawdown */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">Maximum Drawdown (MDD)</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              MDD = max_t (Peak_t - Equity_t) / Peak_t
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Greatest percentage loss from a historical equity peak before making a new all-time high.
            </p>
          </div>

          {/* CAGR */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">CAGR</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              CAGR = (V_final / V_start)^(1/Years) - 1
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Compound Annual Growth Rate geometric average over the exact elapsed calendar period.
            </p>
          </div>

          {/* Pearson Correlation */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <span className="text-xs font-sans font-bold text-cyan-300 block">Pearson Correlation (r)</span>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white text-center">
              r = Cov(X, Y) / (σ_X · σ_Y)
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Normalized covariance measuring linear relationship between returns of two assets from -1.0 to +1.0.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Backtesting Safeguards & Risk Controls */}
      <div className="terminal-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Institutional Backtesting Safeguards
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          How QuantLens actively prevents common quantitative flaws and unrealistic academic assumptions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Zero Look-Ahead Bias Guarantee
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Indicators are computed strictly using price points up to Bar t close. Trading orders are submitted for fill at Bar t+1 Open. It is mathematically impossible for the strategy to execute on information from bars that have not yet occurred.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Realistic Friction Modeling
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Commissions (default 10 bps) and adverse execution slippage (default 5 bps) are deducted from cash on both entry and exit. High-turnover strategies are penalized appropriately for excessive trading velocity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Identical Benchmark Baseline
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Buy-and-hold benchmarks are initiated on the exact same date with identical starting capital and fees, ensuring alpha calculations reflect genuine strategy value-add rather than differing time horizons.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" /> 70/30 Out-of-Sample Validation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Users can evaluate strategies across a 70% In-Sample training window and a 30% Out-of-Sample testing window to immediately detect over-optimized curve-fitting.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Future-Ready Quantitative Roadmap */}
      <div className="terminal-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-cyan-400" />
          Future-Ready Quantitative Roadmap
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Planned extensions to expand QuantLens into a complete institutional portfolio analytics workstation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Modern Portfolio Optimization', desc: 'Markowitz Efficient Frontier & Black-Litterman multi-asset weight allocation.' },
            { title: 'Monte Carlo Simulation', desc: '1,000+ synthetic return paths modeling fat-tail black swan events.' },
            { title: 'Value at Risk (VaR & CVaR)', desc: 'Parametric and historical expected shortfall calculations at 95% and 99% confidence.' },
            { title: 'ML Hidden Markov Regimes', desc: 'Unsupervised Gaussian HMM clustering for dynamic transition probabilities.' },
            { title: 'Paper Trading Simulator', desc: 'Real-time simulated order matching with broker API sandbox integrations.' },
            { title: 'AI Research Copilot', desc: 'Natural-language query interface for rapid quantitative parameter discovery.' },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-200 block">{item.title}</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
