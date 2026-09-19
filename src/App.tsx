import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { Footer } from './components/common/Footer';

// Views
import { OverviewView } from './views/OverviewView';
import { AssetExplorerView } from './views/AssetExplorerView';
import { CorrelationsView } from './views/CorrelationsView';
import { StrategyLabView } from './views/StrategyLabView';
import { MarketRegimesView } from './views/MarketRegimesView';
import { MethodologyView } from './views/MethodologyView';

// Modals
import { OnboardingModal } from './components/modals/OnboardingModal';
import { GuidedTourModal } from './components/modals/GuidedTourModal';
import { CsvUploadModal } from './components/modals/CsvUploadModal';
import { SavedBacktestsModal } from './components/modals/SavedBacktestsModal';
import { ExportReportModal } from './components/modals/ExportReportModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'explorer':
        return <AssetExplorerView />;
      case 'correlations':
        return <CorrelationsView />;
      case 'strategy':
        return <StrategyLabView />;
      case 'regimes':
        return <MarketRegimesView />;
      case 'methodology':
        return <MethodologyView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Fixed Header */}
      <Navbar />

      {/* Main Content Layout */}
      <div className="flex-1 flex w-full">
        {/* Collapsible Desktop Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* View Workspace */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Educational Footer */}
      <Footer />

      {/* Interactive Modals */}
      <OnboardingModal />
      <GuidedTourModal />
      <CsvUploadModal />
      <SavedBacktestsModal />
      <ExportReportModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
