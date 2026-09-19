import React from 'react';
import { LayoutDashboard, LineChart, Grid3X3, FlaskConical, Gauge, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Explorer', icon: LineChart },
    { id: 'correlations', label: 'Matrix', icon: Grid3X3 },
    { id: 'strategy', label: 'Strategy', icon: FlaskConical },
    { id: 'regimes', label: 'Regimes', icon: Gauge },
    { id: 'methodology', label: 'Docs', icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070a12]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors flex-1 ${
              isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />
            <span className="text-[10px] mt-1 font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
