import type { DailyEquityPoint, Trade } from '../types';

export function formatCurrency(val: number, compact: boolean = false): string {
  if (isNaN(val)) return '$0.00';
  if (compact) {
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Math.abs(val) < 10 && Math.abs(val) > 0 ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatPercent(val: number, includeSign: boolean = true, decimals: number = 2): string {
  if (isNaN(val)) return '0.00%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatBps(bps: number): string {
  return `${bps} bps (${(bps / 100).toFixed(2)}%)`;
}

export function formatDate(dateStr: string | number | undefined | null): string {
  if (!dateStr || dateStr === '-') return '-';
  const str = String(dateStr);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function getReturnColorClass(val: number): string {
  if (val > 0) return 'text-emerald-400';
  if (val < 0) return 'text-rose-400';
  return 'text-slate-400';
}

export function getReturnBgClass(val: number): string {
  if (val > 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (val < 0) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-slate-800 text-slate-400 border-slate-700';
}

export function exportTradesToCsv(trades: Trade[], filename: string = 'quantlens_trades.csv'): void {
  if (!trades || trades.length === 0) return;

  const headers = ['Trade ID', 'Entry Date', 'Exit Date', 'Side', 'Entry Price', 'Exit Price', 'Units', 'Net PnL ($)', 'Return (%)', 'Fees ($)', 'Holding Days', 'Exit Reason'];
  const rows = trades.map(t => [
    t.id,
    t.entryDate,
    t.exitDate,
    t.side,
    t.entryPrice.toFixed(2),
    t.exitPrice.toFixed(2),
    t.shares.toFixed(4),
    t.netPnl.toFixed(2),
    t.returnPct.toFixed(2),
    t.feesPaid.toFixed(2),
    t.holdingDays,
    t.exitReason,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportEquityCurveToCsv(curve: DailyEquityPoint[], filename: string = 'quantlens_equity_curve.csv'): void {
  if (!curve || curve.length === 0) return;

  const headers = ['Date', 'Asset Close', 'Strategy Equity', 'Benchmark Equity', 'Cash', 'Position Value', 'In Market', 'Strategy Drawdown (%)', 'Benchmark Drawdown (%)'];
  const rows = curve.map(c => [
    c.date,
    c.close.toFixed(2),
    c.equity.toFixed(2),
    c.benchmarkEquity.toFixed(2),
    c.cash.toFixed(2),
    c.positionValue.toFixed(2),
    c.inMarket ? 'TRUE' : 'FALSE',
    c.drawdown.toFixed(2),
    c.benchmarkDrawdown.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
