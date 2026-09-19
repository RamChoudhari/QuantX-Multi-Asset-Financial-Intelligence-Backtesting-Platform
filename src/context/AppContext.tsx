import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ASSETS, getHistoricalData, registerCustomDataset } from '../lib/data/historicalData';
import { AssetId, AssetMeta, DateRangePreset, OHLCVBar, SavedBacktest } from '../lib/types';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAsset: AssetId;
  setActiveAsset: (asset: AssetId) => void;
  dateRange: DateRangePreset;
  setDateRange: (range: DateRangePreset) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  assets: AssetMeta[];
  getBars: (assetId: AssetId, respectDateRange?: boolean) => OHLCVBar[];
  riskFreeRate: number;
  setRiskFreeRate: (rate: number) => void;
  savedBacktests: SavedBacktest[];
  saveBacktestRun: (backtest: SavedBacktest) => void;
  deleteBacktestRun: (id: string) => void;
  addCustomAsset: (meta: AssetMeta, bars: OHLCVBar[]) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showGuidedTour: boolean;
  setShowGuidedTour: (show: boolean) => void;
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  csvModalOpen: boolean;
  setCsvModalOpen: (open: boolean) => void;
  savedModalOpen: boolean;
  setSavedModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_SAVED_RUNS_KEY = 'quantlens_saved_backtests_v1';
const STORAGE_ONBOARDED_KEY = 'quantlens_has_seen_onboarding_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeAsset, setActiveAsset] = useState<AssetId>('GOLD');
  const [dateRange, setDateRange] = useState<DateRangePreset>('1Y');
  const [customStartDate, setCustomStartDate] = useState<string>('2024-01-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2025-12-31');
  const [assets, setAssets] = useState<AssetMeta[]>(ASSETS);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.04);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [savedModalOpen, setSavedModalOpen] = useState<boolean>(false);
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);

  // Onboarding first-time visitor check
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const seen = localStorage.getItem(STORAGE_ONBOARDED_KEY);
      return !seen;
    } catch {
      return true;
    }
  });

  // Saved backtest runs from localStorage
  const [savedBacktests, setSavedBacktests] = useState<SavedBacktest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_RUNS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_RUNS_KEY, JSON.stringify(savedBacktests));
    } catch {
      // ignore
    }
  }, [savedBacktests]);

  const saveBacktestRun = (run: SavedBacktest) => {
    setSavedBacktests(prev => [run, ...prev.filter(r => r.id !== run.id)]);
  };

  const deleteBacktestRun = (id: string) => {
    setSavedBacktests(prev => prev.filter(r => r.id !== id));
  };

  const addCustomAsset = (meta: AssetMeta, bars: OHLCVBar[]) => {
    registerCustomDataset(meta, bars);
    setAssets(prev => [...prev.filter(a => a.id !== meta.id), meta]);
    setActiveAsset(meta.id);
  };

  // Helper to slice bars according to dateRange filter
  const getBars = useMemo(() => {
    return (assetId: AssetId, respectDateRange: boolean = true): OHLCVBar[] => {
      const rawBars = getHistoricalData(assetId);
      if (!rawBars || rawBars.length === 0 || !respectDateRange) return rawBars;

      if (dateRange === 'MAX') return rawBars;

      const lastBar = rawBars[rawBars.length - 1];
      const lastDate = new Date(lastBar.date);

      if (dateRange === 'CUSTOM') {
        return rawBars.filter(b => b.date >= customStartDate && b.date <= customEndDate);
      }

      let daysBack = 365;
      switch (dateRange) {
        case '1M': daysBack = 30; break;
        case '3M': daysBack = 90; break;
        case '6M': daysBack = 180; break;
        case '1Y': daysBack = 365; break;
        case '3Y': daysBack = 365 * 3; break;
        case '5Y': daysBack = 365 * 5; break;
        default: daysBack = 365;
      }

      const cutoffTime = lastDate.getTime() - daysBack * 24 * 3600 * 1000;
      const filtered = rawBars.filter(b => new Date(b.date).getTime() >= cutoffTime);
      return filtered.length > 5 ? filtered : rawBars;
    };
  }, [dateRange, customStartDate, customEndDate]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeAsset,
        setActiveAsset,
        dateRange,
        setDateRange,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        assets,
        getBars,
        riskFreeRate,
        setRiskFreeRate,
        savedBacktests,
        saveBacktestRun,
        deleteBacktestRun,
        addCustomAsset,
        showOnboarding,
        setShowOnboarding: (val: boolean) => {
          setShowOnboarding(val);
          if (!val) {
            try { localStorage.setItem(STORAGE_ONBOARDED_KEY, 'true'); } catch {}
          }
        },
        showGuidedTour,
        setShowGuidedTour,
        exportModalOpen,
        setExportModalOpen,
        csvModalOpen,
        setCsvModalOpen,
        savedModalOpen,
        setSavedModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
