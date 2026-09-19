import React from 'react';
import { Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DateRangePreset } from '../../lib/types';

export const DateRangeSelector: React.FC = () => {
  const { dateRange, setDateRange, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate } = useApp();

  const presets: { id: DateRangePreset; label: string }[] = [
    { id: '1M', label: '1M' },
    { id: '3M', label: '3M' },
    { id: '6M', label: '6M' },
    { id: '1Y', label: '1Y' },
    { id: '3Y', label: '3Y' },
    { id: '5Y', label: '5Y' },
    { id: 'MAX', label: 'Max' },
    { id: 'CUSTOM', label: 'Custom' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex p-1 bg-slate-900/80 border border-slate-800 rounded-lg shadow-inner">
        {presets.map(p => {
          const isActive = dateRange === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setDateRange(p.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {dateRange === 'CUSTOM' && (
        <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <input
            type="date"
            value={customStartDate}
            onChange={e => setCustomStartDate(e.target.value)}
            className="bg-transparent text-slate-200 border-none outline-none text-xs font-mono-numeric cursor-pointer"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={e => setCustomEndDate(e.target.value)}
            className="bg-transparent text-slate-200 border-none outline-none text-xs font-mono-numeric cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
