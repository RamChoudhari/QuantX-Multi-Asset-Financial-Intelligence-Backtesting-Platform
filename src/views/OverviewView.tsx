import React, { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  Zap,
  Activity,
  ArrowUpRight,
  Download,
  Bookmark,
  BarChart3,
  Sparkles,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarketUniverse3D } from '../components/MarketUniverse3D';
import { AIAnalyst } from '../components/AIAnalyst';
import { AssetCard } from '../components/AssetCard';
import { PerformanceChart } from '../components/PerformanceChart';
import { QuantMetrics } from '../components/QuantMetrics';
import { InsightCard } from '../components/common/InsightCard';
import { calculateMetricsFromBars } from '../lib/quant/metrics';
import { calculatePearson } from '../lib/quant/indicators';
import { classifyMarketRegimes } from '../lib/quant/regimes';
import { generateOverviewInsight } from '../lib/utils/insights';
import { formatDate, formatPercent } from '../lib/utils/formatting';
import { fetchMarketData, BackendMarketData } from '../lib/api/marketApi';

export const OverviewView: React.FC = () => {
  const {
    assets,
    getBars,
    dateRange,
    activeAsset,
    setActiveAsset,
    setActiveTab,
    setExportModalOpen,
  } = useApp();

  // Real backend market data state
  const [backendDataMap, setBackendDataMap] = useState<Record<string, BackendMarketData | null>>({
    GOLD: null,
    BTC: null,
    NVDA: null,
  });
  const [backendLoading, setBackendLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        setBackendLoading(true);
        const [goldData, btcData, nvdaData] = await Promise.all([
          fetchMarketData('GC=F'),
          fetchMarketData('BTC-USD'),
          fetchMarketData('NVDA'),
        ]);

        if (isMounted) {
          setBackendDataMap({
            GOLD: goldData,
            BTC: btcData,
            NVDA: nvdaData,
          });
          setBackendError(null);
        }
      } catch (err) {
        console.warn('Backend load warning:', err);
        if (isMounted) {
          setBackendError('Market data temporarily unavailable. Offline deterministic engine active.');
        }
      } finally {
        if (isMounted) setBackendLoading(false);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute metrics and normalized growth series rebased to 100
  const { normalizedChartData, portfolioIntel, riskSnapshot, insightText, activeMetrics } = useMemo(() => {
    const barsMap: Record<string, any[]> = {};
    const metricsMap: Record<string, any> = {};

    assets.forEach(a => {
      const bars = getBars(a.id, true);
      barsMap[a.id] = bars;
      metricsMap[a.id] = calculateMetricsFromBars(bars);
    });

    // 1. Build Normalized Performance Chart (rebased to 100 at window start)
    const datesSet = new Set<string>();
    Object.values(barsMap).forEach(bList => bList.forEach(b => datesSet.add(b.date)));
    const sortedDates = Array.from(datesSet).sort();

    const basePrices: Record<string, number> = {};
    assets.forEach(a => {
      const bList = barsMap[a.id];
      basePrices[a.id] = bList && bList.length > 0 ? bList[0].close : 1;
    });

    const priceMaps: Record<string, Map<string, number>> = {};
    assets.forEach(a => {
      const m = new Map<string, number>();
      barsMap[a.id].forEach((b: any) => m.set(b.date, b.close));
      priceMaps[a.id] = m;
    });

    const step = Math.max(1, Math.floor(sortedDates.length / 250));
    const sampledDates = sortedDates.filter((_, idx) => idx % step === 0 || idx === sortedDates.length - 1);

    const normalizedChartData = sampledDates.map(dateStr => {
      const pt: any = { date: dateStr, displayDate: formatDate(dateStr) };
      assets.forEach(a => {
        const p = priceMaps[a.id].get(dateStr);
        if (p !== undefined && basePrices[a.id] > 0) {
          pt[a.id] = Number(((p / basePrices[a.id]) * 100).toFixed(2));
          pt[`${a.id}_raw`] = p;
        }
      });
      return pt;
    });

    // 2. Portfolio Intelligence
    let strongestPerformer = assets[0];
    let lowestRisk = assets[0];
    let maxReturn = -Infinity;
    let minVol = Infinity;

    assets.forEach(a => {
      const m = metricsMap[a.id];
      if (m.totalReturn > maxReturn) {
        maxReturn = m.totalReturn;
        strongestPerformer = a;
      }
      if (m.annualizedVol < minVol && m.annualizedVol > 0) {
        minVol = m.annualizedVol;
        lowestRisk = a;
      }
    });

    const btcCloses = (barsMap['BTC'] || []).map((b: any) => b.close);
    const goldCloses = (barsMap['GOLD'] || []).map((b: any) => b.close);
    const nvdaCloses = (barsMap['NVDA'] || []).map((b: any) => b.close);

    const corrBtcGold = calculatePearson(btcCloses, goldCloses);
    const corrNvdaBtc = calculatePearson(nvdaCloses, btcCloses);
    const corrGoldNvda = calculatePearson(goldCloses, nvdaCloses);

    const pairs = [
      { pair: 'NVDA & BTC', corr: corrNvdaBtc },
      { pair: 'BTC & Gold', corr: corrBtcGold },
      { pair: 'Gold & NVDA', corr: corrGoldNvda },
    ];
    pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
    const mostCorrelatedPair = pairs[0];

    const activeBars = barsMap[activeAsset] || barsMap['GOLD'] || [];
    const { regimePoints } = classifyMarketRegimes(activeBars);
    const latestRegimePoint = regimePoints[regimePoints.length - 1];
    const currentRegime = latestRegimePoint ? latestRegimePoint.regime : 'BULL';

    const activeMetrics = metricsMap[activeAsset] || metricsMap['GOLD'];

    const insightText = generateOverviewInsight(
      metricsMap,
      strongestPerformer.id,
      lowestRisk.id,
      strongestPerformer.name,
      lowestRisk.name
    );

    return {
      normalizedChartData,
      portfolioIntel: {
        strongestPerformer,
        lowestRisk,
        mostCorrelatedPair,
        currentRegime,
      },
      riskSnapshot: activeMetrics,
      insightText,
      activeMetrics,
    };
  }, [assets, getBars, activeAsset]);

  const activeAssetObj = assets.find(a => a.id === activeAsset) || assets[0];
  const activeBackendData = backendDataMap[activeAsset];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-[#0d1322] to-slate-900/95 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              QUANTEXA 3D FINANCIAL INTELLIGENCE TERMINAL
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Window: {dateRange}</span>
            {backendLoading ? (
              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 animate-pulse ml-2">
                ● Syncing FastAPI / yfinance
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 ml-2">
                ● Live FastAPI Feed Active
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Institutional Research Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive 3D market universe, quantitative cross-asset dynamics, and Featherless-powered AI analytical intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Chips Quick Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {assets.slice(0, 3).map(a => {
              const isSelected = activeAsset === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveAsset(a.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span>{a.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {backendError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{backendError}</span>
        </div>
      )}

      {/* CENTERPIECE: 3D Market Universe & QUANTEXA AI Analyst Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Column: 3D Market Universe Centerpiece (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Interactive 3D Market Universe
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Active Focus: <strong className="text-cyan-400">{activeAssetObj.name}</strong>
            </span>
          </div>

          <MarketUniverse3D
            selectedAsset={activeAsset}
            onSelectAsset={setActiveAsset}
            marketDataMap={backendDataMap}
          />
        </div>

        {/* Right Column: QUANTEXA AI Analyst Panel (5 Cols) */}
        <div className="lg:col-span-5 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                QUANTEXA AI Analyst
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              FastAPI Context Connected
            </span>
          </div>

          <AIAnalyst
            activeAsset={activeAsset}
            activeAssetName={activeAssetObj.name}
            marketData={activeBackendData}
            timeframe={dateRange}
          />
        </div>
      </div>

      {/* SECTION C: 3 Upgraded Asset Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Core Market Assets</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Click any asset card to focus 3D universe & AI context
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assets.slice(0, 3).map(asset => {
            const bData = backendDataMap[asset.id];
            const isSelected = activeAsset === asset.id;
            const bars = getBars(asset.id, true);
            const fallbackSparkline = bars.slice(-30).map(b => b.close);
            const m = calculateMetricsFromBars(bars);

            return (
              <AssetCard
                key={asset.id}
                id={asset.id}
                name={asset.name}
                symbol={asset.id === 'GOLD' ? 'GC=F' : asset.id === 'BTC' ? 'BTC-USD' : 'NVDA'}
                category={asset.category}
                color={asset.color}
                isSelected={isSelected}
                onSelect={setActiveAsset}
                onDeepDive={id => {
                  setActiveAsset(id);
                  setActiveTab('explorer');
                }}
                marketData={bData}
                fallbackPrice={bars.length ? bars[bars.length - 1].close : 100}
                fallbackChange={m.totalReturn * 100}
                fallbackVol={m.annualizedVol}
                sparkline={fallbackSparkline}
              />
            );
          })}
        </div>
      </div>

      {/* SECTION D: Upgraded Multi-Asset Normalized Performance Chart */}
      <PerformanceChart
        assets={assets}
        backendDataMap={backendDataMap}
        fallbackNormalizedData={normalizedChartData}
        selectedAsset={activeAsset}
        onSelectAsset={setActiveAsset}
      />

      {/* SECTION E: Institutional Quantitative Metrics */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800 shadow-xl">
        <QuantMetrics
          assetName={activeAssetObj.name}
          symbol={activeAsset === 'GOLD' ? 'GC=F' : activeAsset === 'BTC' ? 'BTC-USD' : 'NVDA'}
          metrics={{
            totalReturn: activeMetrics.totalReturn,
            cagr: activeMetrics.cagr,
            annualizedVol: activeMetrics.annualizedVol,
            sharpeRatio: activeMetrics.sharpeRatio,
            maxDrawdown: activeMetrics.maxDrawdown,
          }}
          hasBacktestRun={false}
        />
      </div>

      {/* Automated Plain-English Quantitative Insight Card */}
      <InsightCard insight={insightText} />

      {/* Portfolio Intelligence & Risk Snapshot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strongest Performer */}
        <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider">Strongest Performer</span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: portfolioIntel.strongestPerformer.color }} />
            {portfolioIntel.strongestPerformer.name}
          </div>
          <p className="text-xs text-emerald-400 font-mono mt-1 font-semibold">
            Alpha leader across evaluation window
          </p>
        </div>

        {/* Lowest Risk Asset */}
        <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-semibold uppercase tracking-wider">Defensive Anchor</span>
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: portfolioIntel.lowestRisk.color }} />
            {portfolioIntel.lowestRisk.name}
          </div>
          <p className="text-xs text-amber-300 font-mono mt-1">
            Lowest volatility capital preserver
          </p>
        </div>

        {/* Most Correlated Pair */}
        <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">Highest Correlation</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {portfolioIntel.mostCorrelatedPair.pair}
          </div>
          <p className="text-xs text-cyan-400 font-mono mt-1 font-semibold">
            Pearson r = {portfolioIntel.mostCorrelatedPair.corr.toFixed(2)}
          </p>
        </div>

        {/* Prevailing Market Regime */}
        <div className="rounded-xl p-4 bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-semibold uppercase tracking-wider">Active Regime</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {portfolioIntel.currentRegime.replace('_', ' ')}
          </div>
          <p className="text-xs text-purple-300 font-mono mt-1">
            200-day trend & volatility filter
          </p>
        </div>
      </div>
    </div>
  );
};
