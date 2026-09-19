import { OHLCVBar } from '../types';

export interface CsvParseResult {
  success: boolean;
  bars: OHLCVBar[];
  errors: string[];
  warnings: string[];
  summary?: {
    totalRows: number;
    validBars: number;
    startDate: string;
    endDate: string;
    firstClose: number;
    lastClose: number;
  };
}

export function parseOHLCVCsv(csvText: string): CsvParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bars: OHLCVBar[] = [];

  if (!csvText || !csvText.trim()) {
    return { success: false, bars: [], errors: ['CSV content is completely empty.'], warnings: [] };
  }

  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return { success: false, bars: [], errors: ['CSV must have a header row and at least one data row.'], warnings: [] };
  }

  // Parse Header
  const headerTokens = lines[0].split(/,|;|\t/).map(t => t.replace(/["']/g, '').trim().toLowerCase());
  
  const dateIdx = headerTokens.findIndex(h => h === 'date' || h === 'timestamp' || h === 'time');
  const openIdx = headerTokens.findIndex(h => h === 'open' || h === 'o');
  const highIdx = headerTokens.findIndex(h => h === 'high' || h === 'h');
  const lowIdx = headerTokens.findIndex(h => h === 'low' || h === 'l');
  const closeIdx = headerTokens.findIndex(h => h === 'close' || h === 'c' || h === 'adj close' || h === 'price');
  const volumeIdx = headerTokens.findIndex(h => h === 'volume' || h === 'vol' || h === 'v');

  if (dateIdx === -1) {
    errors.push("Missing required header: 'Date' (or 'Timestamp').");
  }
  if (closeIdx === -1) {
    errors.push("Missing required header: 'Close' (or 'Price').");
  }

  if (errors.length > 0) {
    return { success: false, bars: [], errors, warnings };
  }

  const seenDates = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const tokens = lines[i].split(/,|;|\t/).map(t => t.replace(/["']/g, '').trim());

    if (tokens.length <= Math.max(dateIdx, closeIdx)) {
      warnings.push(`Row ${lineNum}: Ignored malformed line (insufficient columns).`);
      continue;
    }

    const rawDate = tokens[dateIdx];
    const parsedDate = normalizeDateString(rawDate);
    if (!parsedDate) {
      if (errors.length < 10) {
        errors.push(`Row ${lineNum}: Unable to parse date '${rawDate}'. Expected YYYY-MM-DD.`);
      }
      continue;
    }

    if (seenDates.has(parsedDate)) {
      warnings.push(`Row ${lineNum}: Duplicate date '${parsedDate}' skipped.`);
      continue;
    }
    seenDates.add(parsedDate);

    const closeVal = parseFloat(tokens[closeIdx]);
    if (isNaN(closeVal) || closeVal <= 0) {
      if (errors.length < 10) {
        errors.push(`Row ${lineNum}: Invalid Close price '${tokens[closeIdx]}'. Must be a positive number.`);
      }
      continue;
    }

    const openVal = openIdx !== -1 && !isNaN(parseFloat(tokens[openIdx])) ? parseFloat(tokens[openIdx]) : closeVal;
    let highVal = highIdx !== -1 && !isNaN(parseFloat(tokens[highIdx])) ? parseFloat(tokens[highIdx]) : Math.max(openVal, closeVal);
    let lowVal = lowIdx !== -1 && !isNaN(parseFloat(tokens[lowIdx])) ? parseFloat(tokens[lowIdx]) : Math.min(openVal, closeVal);
    const volumeVal = volumeIdx !== -1 && !isNaN(parseFloat(tokens[volumeIdx])) ? Math.max(0, parseFloat(tokens[volumeIdx])) : 10000;

    // Sanity clamp High and Low
    highVal = Math.max(highVal, openVal, closeVal);
    lowVal = Math.min(lowVal, openVal, closeVal);

    bars.push({
      date: parsedDate,
      open: Number(openVal.toFixed(2)),
      high: Number(highVal.toFixed(2)),
      low: Number(lowVal.toFixed(2)),
      close: Number(closeVal.toFixed(2)),
      volume: Math.round(volumeVal),
    });
  }

  if (errors.length > 0 && bars.length === 0) {
    return { success: false, bars: [], errors, warnings };
  }

  // Sort ascending by date
  bars.sort((a, b) => a.date.localeCompare(b.date));

  if (bars.length < 20) {
    errors.push(`Dataset contains only ${bars.length} valid bars. Minimum required for quantitative analysis is 20 bars.`);
    return { success: false, bars, errors, warnings };
  }

  return {
    success: true,
    bars,
    errors: [],
    warnings,
    summary: {
      totalRows: lines.length - 1,
      validBars: bars.length,
      startDate: bars[0].date,
      endDate: bars[bars.length - 1].date,
      firstClose: bars[0].close,
      lastClose: bars[bars.length - 1].close,
    },
  };
}

function normalizeDateString(str: string): string | null {
  if (!str) return null;
  // Test ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Test MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (slashMatch) {
    const p1 = slashMatch[1].padStart(2, '0');
    const p2 = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    // assume MM-DD-YYYY if p1 <= 12
    return `${y}-${p1}-${p2}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

export function generateSampleCsv(): string {
  return `Date,Open,High,Low,Close,Volume
2024-01-02,100.50,102.30,99.80,101.75,124000
2024-01-03,101.90,103.40,101.10,102.80,145000
2024-01-04,103.00,104.20,102.50,103.90,110000
2024-01-05,103.50,105.00,102.80,104.40,165000
2024-01-08,104.80,106.10,104.00,105.60,180000
2024-01-09,105.20,105.80,103.90,104.10,132000
2024-01-10,104.30,106.50,104.00,106.20,195000
2024-01-11,106.50,107.80,105.90,107.40,210000
2024-01-12,107.20,108.50,106.80,108.10,175000
2024-01-16,108.00,109.20,107.40,108.90,140000
2024-01-17,108.50,108.90,106.50,107.00,160000
2024-01-18,107.20,108.40,106.90,108.15,130000
2024-01-19,108.30,109.80,107.90,109.50,220000
2024-01-22,109.90,111.40,109.20,110.80,240000
2024-01-23,110.50,111.90,110.10,111.25,185000
2024-01-24,111.50,113.00,111.00,112.70,215000
2024-01-25,112.80,113.60,111.90,113.10,170000
2024-01-26,113.00,114.20,112.40,113.80,195000
2024-01-29,114.00,115.50,113.60,115.10,230000
2024-01-30,114.80,115.20,113.50,114.30,160000
2024-01-31,114.50,116.00,114.00,115.80,250000`;
}
