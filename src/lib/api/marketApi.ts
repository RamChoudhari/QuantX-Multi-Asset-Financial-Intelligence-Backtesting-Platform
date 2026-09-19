/**
 * QUANTEXA Market & AI Backend API Client
 * Connects directly to the FastAPI backend with multi-tier fallback.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface MarketHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BackendMarketData {
  symbol: string;
  name: string;
  category?: string;
  unit?: string;
  latest_price: number;
  previous_close?: number;
  daily_change?: number;
  daily_change_pct: number;
  period_return_pct: number;
  annualized_volatility: number;
  history: MarketHistoryPoint[];
  data_source?: string;
}

export interface AIAnalyzeResponse {
  answer: string;
  model: string;
  is_demo: boolean;
  provider?: string;
  context?: Record<string, any>;
  error?: string;
}

// In-memory cache for fast repeated views
const marketCache = new Map<string, { data: BackendMarketData; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Maps frontend Asset ID to official market symbols:
 * GOLD -> GC=F
 * BTC  -> BTC-USD
 * NVDA -> NVDA
 */
export function getBackendSymbol(assetId: string): string {
  const upper = (assetId || '').toUpperCase();
  if (upper === 'GOLD' || upper === 'XAU' || upper === 'GC=F') return 'GC=F';
  if (upper === 'BTC' || upper === 'BITCOIN' || upper === 'BTC-USD') return 'BTC-USD';
  if (upper === 'NVDA' || upper === 'NVIDIA') return 'NVDA';
  return assetId;
}

export function getFrontendAssetId(symbol: string): 'GOLD' | 'BTC' | 'NVDA' | string {
  const upper = (symbol || '').toUpperCase();
  if (upper === 'GC=F' || upper.includes('GOLD')) return 'GOLD';
  if (upper === 'BTC-USD' || upper.includes('BTC')) return 'BTC';
  if (upper === 'NVDA') return 'NVDA';
  return symbol;
}

/**
 * Fetches real market OHLCV data from the FastAPI /market/{symbol} endpoint.
 */
export async function fetchMarketData(symbolOrId: string): Promise<BackendMarketData | null> {
  const symbol = getBackendSymbol(symbolOrId);
  const now = Date.now();

  const cached = marketCache.get(symbol);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Try relative proxy first, fallback to direct API_BASE_URL
  const urls = [`/market/${symbol}`, `${API_BASE_URL}/market/${symbol}`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) continue;

      const raw = await res.json();

      // Case 1: Backend returned our structured response { latest_price, history, ... }
      if (raw && raw.latest_price !== undefined && Array.isArray(raw.history)) {
        marketCache.set(symbol, { data: raw, timestamp: now });
        return raw;
      }

      // Case 2: Backend returned raw list of [{ Date: ..., Close: ... }]
      if (Array.isArray(raw) && raw.length > 0) {
        const history: MarketHistoryPoint[] = raw.map((item: any) => {
          const rawDate = item.Date || item.date || '';
          const date = typeof rawDate === 'string' ? rawDate.split(' ')[0] : String(rawDate);
          const close = Number(item.Close ?? item.close ?? 0);
          const open = Number(item.Open ?? item.open ?? close);
          const high = Number(item.High ?? item.high ?? close);
          const low = Number(item.Low ?? item.low ?? close);
          const volume = Number(item.Volume ?? item.volume ?? 0);
          return { date, open, high, low, close, volume };
        });

        const first = history[0];
        const last = history[history.length - 1];
        const prev = history.length > 1 ? history[history.length - 2] : last;

        const latest_price = last.close;
        const prev_close = prev.close;
        const daily_change = latest_price - prev_close;
        const daily_change_pct = prev_close > 0 ? (daily_change / prev_close) * 100 : 0;
        const period_return_pct = first.close > 0 ? ((latest_price - first.close) / first.close) * 100 : 0;

        // Calculate volatility from daily closes
        let annualized_volatility = 0.25;
        if (history.length > 2) {
          const returns: number[] = [];
          for (let i = 1; i < history.length; i++) {
            const r = (history[i].close - history[i - 1].close) / history[i - 1].close;
            returns.push(r);
          }
          const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
          annualized_volatility = Math.sqrt(variance) * Math.sqrt(252);
        }

        const normalized: BackendMarketData = {
          symbol,
          name: symbol === 'GC=F' ? 'Gold' : symbol === 'BTC-USD' ? 'Bitcoin' : 'NVIDIA',
          latest_price: Number(latest_price.toFixed(2)),
          previous_close: Number(prev_close.toFixed(2)),
          daily_change: Number(daily_change.toFixed(2)),
          daily_change_pct: Number(daily_change_pct.toFixed(2)),
          period_return_pct: Number(period_return_pct.toFixed(2)),
          annualized_volatility: Number(annualized_volatility.toFixed(4)),
          history,
          data_source: 'fastapi_live_yfinance',
        };

        marketCache.set(symbol, { data: normalized, timestamp: now });
        return normalized;
      }
    } catch (err) {
      console.warn(`Attempt to fetch ${url} failed, trying next fallback:`, err);
    }
  }

  return null;
}

/**
 * Sends a natural language research question to the FastAPI /ai/analyze endpoint.
 */
export async function sendAIQuestion(
  question: string,
  assetSymbol: string = 'BTC-USD',
  timeframe: string = '1mo',
  metrics?: Record<string, any>
): Promise<AIAnalyzeResponse> {
  const symbol = getBackendSymbol(assetSymbol);
  const payload = {
    question,
    asset_symbol: symbol,
    timeframe,
    metrics,
  };

  const urls = ['/ai/analyze', `${API_BASE_URL}/ai/analyze`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.answer || 'No analysis generated.',
          model: data.model || 'quantexa-analyst',
          is_demo: Boolean(data.is_demo),
          provider: data.provider || 'QUANTEXA Engine',
          context: data.context,
        };
      }
    } catch (err) {
      console.warn(`Call to ${url} failed:`, err);
    }
  }

  return {
    answer:
      'QUANTEXA AI Analyst temporarily unavailable. Please verify the FastAPI backend is active on port 8000. Real-time market metrics remain active and updated via Python analytics.',
    model: 'offline-fallback',
    is_demo: true,
    error: 'Network connection failed',
  };
}
