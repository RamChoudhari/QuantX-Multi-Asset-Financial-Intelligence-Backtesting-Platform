import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Download, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSampleCsv, parseOHLCVCsv, CsvParseResult } from '../../lib/data/csvParser';
import { AssetMeta } from '../../lib/types';

export const CsvUploadModal: React.FC = () => {
  const { csvModalOpen, setCsvModalOpen, addCustomAsset, setActiveTab } = useApp();

  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('Custom Asset');
  const [assetSymbol, setAssetSymbol] = useState<string>('CUSTOM');
  const [assetColor, setAssetColor] = useState<string>('#38bdf8');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!csvModalOpen) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const inferredName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
    setAssetName(inferredName);
    setAssetSymbol(inferredName.slice(0, 6));

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvText(text);
      const res = parseOHLCVCsv(text);
      setParseResult(res);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const content = generateSampleCsv();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_ohlcv_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!parseResult || !parseResult.success || parseResult.bars.length === 0) return;

    const id = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;
    const meta: AssetMeta = {
      id,
      symbol: assetSymbol || 'CUSTOM',
      name: assetName || 'Custom Uploaded Asset',
      category: 'Custom',
      color: assetColor,
      badgeBg: `${assetColor}20`,
      badgeBorder: `${assetColor}50`,
      description: `User-imported dataset containing ${parseResult.bars.length} verified historical trading bars.`,
      unit: '$ / unit',
    };

    addCustomAsset(meta, parseResult.bars);
    setCsvModalOpen(false);
    setActiveTab('explorer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-slate-900 to-[#070a12] border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={() => setCsvModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <Upload className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Import Historical OHLCV CSV
            </h2>
            <p className="text-xs text-slate-400">
              Upload custom price series for deep analytics and systematic backtesting.
            </p>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
          }`}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv,text/csv"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">
            {fileName ? fileName : 'Drag & drop your CSV file here'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            Expected headers: <code className="text-cyan-300">Date, Open, High, Low, Close, Volume</code>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor="csv-file-input"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
            >
              Browse Local Files
            </label>
            <button
              onClick={handleDownloadSample}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Sample Template
            </button>
          </div>
        </div>

        {/* Diagnostics & Validation Feedback */}
        {parseResult && (
          <div className="space-y-4 mb-4">
            {parseResult.success ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  Dataset Validated Successfully ({parseResult.summary?.validBars} Bars)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-numeric">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date Range</span>
                    <span className="text-slate-200">{parseResult.summary?.startDate} to {parseResult.summary?.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">First Close</span>
                    <span className="text-slate-200">${parseResult.summary?.firstClose.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Last Close</span>
                    <span className="text-slate-200">${parseResult.summary?.lastClose.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Bars</span>
                    <span className="text-emerald-400 font-bold">{parseResult.summary?.validBars}</span>
                  </div>
                </div>

                {parseResult.warnings.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-amber-300 space-y-0.5">
                    {parseResult.warnings.slice(0, 3).map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Errors Found
                </div>
                <ul className="text-xs text-rose-300 space-y-1 list-disc pl-5">
                  {parseResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Custom Asset Metadata Inputs */}
            {parseResult.success && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ticker / Symbol</label>
                  <input
                    type="text"
                    value={assetSymbol}
                    onChange={e => setAssetSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase font-mono-numeric outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Theme Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={assetColor}
                      onChange={e => setAssetColor(e.target.value)}
                      className="h-8 w-10 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                    />
                    <span className="font-mono-numeric text-slate-300">{assetColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => setCsvModalOpen(false)}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parseResult?.success}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            <span>Import Dataset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
