import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Grid3X3,
  FlaskConical,
  Gauge,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 'Main' },
    { id: 'explorer', label: 'Asset Explorer', icon: LineChart, badge: 'Deep Dive' },
    { id: 'correlations', label: 'Correlations', icon: Grid3X3, badge: 'Matrix' },
    { id: 'strategy', label: 'Strategy Lab', icon: FlaskConical, badge: 'Hero', highlight: true },
    { id: 'regimes', label: 'Market Regimes', icon: Gauge, badge: 'Classifier' },
    { id: 'methodology', label: 'Methodology', icon: BookOpen, badge: 'Docs' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-800/80 bg-[#070a12]/95 transition-all duration-300 select-none z-20 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-mono-numeric uppercase tracking-wider text-slate-500 font-semibold">
            {!collapsed && 'Terminal Modules'}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.highlight ? (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> HERO
                      </span>
                    ) : item.badge ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )}
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Sidebar Widget */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
          {!collapsed && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-300">Terminal State</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                FastAPI Python engine & Featherless AI connected. Real-time 3D universe active.
              </p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-xs transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> <span>Collapse</span></>}
          </button>
        </div>
      </div>
    </aside>
  );
};
