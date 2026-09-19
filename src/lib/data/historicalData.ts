import { AssetId, AssetMeta, OHLCVBar } from '../types';

export const ASSETS: AssetMeta[] = [
  {
    id: 'GOLD',
    symbol: 'XAU/USD',
    name: 'Gold Spot',
    category: 'Commodity',
    color: '#f59e0b', // Amber/Gold
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    description: 'Physical bullion proxy. Traditionally acts as a macro inflation hedge and safe haven during market crises.',
    unit: '$ / oz',
  },
  {
    id: 'BTC',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'Crypto',
    color: '#f97316', // Orange
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    badgeBorder: 'rgba(249, 115, 22, 0.3)',
    description: 'Decentralized digital commodity. High historical alpha with elevated annualized volatility and asymmetric upside.',
    unit: '$ / BTC',
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'Equity',
    color: '#00f0ff', // Electric Cyan
    badgeBg: 'rgba(0, 240, 255, 0.12)',
    badgeBorder: 'rgba(0, 240, 255, 0.3)',
    description: 'Semiconductor pioneer and global leader in accelerated computing and AI infrastructure architectures.',
    unit: '$ / share',
  },
];

// Seeded LCG pseudorandom generator for 100% deterministic, reproducible historical series
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Generate realistic daily bars between 2020-01-02 and 2025-12-31 (~1500 trading days)
function generateDeterministicSeries(
  assetId: AssetId,
  startPrice: number,
  baseVol: number,
  keyAnchors: { date: string; target: number; volMultiplier?: number }[],
  seed: number,
  volumeBase: number
): OHLCVBar[] {
  const rand = createSeededRandom(seed);
  const bars: OHLCVBar[] = [];

  const startDate = new Date('2020-01-02T00:00:00Z');
  const endDate = new Date('2025-12-31T00:00:00Z');

  // Build calendar of business days (Mon-Fri)
  const dates: string[] = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    const day = curr.getUTCDay();
    if (day !== 0 && day !== 6) { // Weekdays only
      dates.push(curr.toISOString().slice(0, 10));
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  // Pre-calculate target trajectory across anchors
  const anchorMap = new Map<string, { target: number; volMult: number }>();
  keyAnchors.forEach(a => anchorMap.set(a.date, { target: a.target, volMult: a.volMultiplier || 1.0 }));

  let currentPrice = startPrice;
  let targetIndex = 0;

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];

    // Find bounding anchors
    while (targetIndex < keyAnchors.length - 1 && dates[i] > keyAnchors[targetIndex].date) {
      targetIndex++;
    }

    const nextAnchor = keyAnchors[Math.min(targetIndex, keyAnchors.length - 1)];
    const prevAnchor = targetIndex > 0 ? keyAnchors[targetIndex - 1] : { date: dates[0], target: startPrice, volMultiplier: 1.0 };

    const daysRemaining = Math.max(1, (new Date(nextAnchor.date).getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    const meanDrift = (nextAnchor.target - currentPrice) / Math.max(15, daysRemaining);

    // Box-Muller normal distribution for realistic returns
    const u1 = Math.max(1e-6, rand());
    const u2 = rand();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const activeVol = baseVol * (nextAnchor.volMultiplier || 1.0);
    const dailyReturn = (meanDrift / currentPrice) + (z * activeVol);

    const open = currentPrice;
    let close = Math.max(currentPrice * 0.1, currentPrice * (1 + dailyReturn));

    // Calculate realistic intra-day high and low
    const spread1 = rand() * activeVol * 1.5;
    const spread2 = rand() * activeVol * 1.5;
    const high = Math.max(open, close) * (1 + spread1);
    const low = Math.min(open, close) * (1 - spread2);

    // Volume with volatility surge
    const volSurge = 1 + Math.abs(dailyReturn / activeVol) * 1.8;
    const volume = Math.round(volumeBase * volSurge * (0.8 + rand() * 0.4));

    bars.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return bars;
}

// 1. GOLD / XAUUSD historical milestones
// 2020 pandemic surge from $1520 to $2060, consolidation $1700-$1900 in 2021-22, 2023-2025 rally past $2600
const GOLD_ANCHORS = [
  { date: '2020-01-02', target: 1520.5, volMultiplier: 0.9 },
  { date: '2020-03-20', target: 1480.0, volMultiplier: 2.2 }, // Covid liquidity crunch
  { date: '2020-08-07', target: 2063.0, volMultiplier: 1.4 }, // All time high 2020
  { date: '2021-03-31', target: 1707.0, volMultiplier: 1.0 }, // Pullback
  { date: '2022-03-08', target: 2050.0, volMultiplier: 1.6 }, // Ukraine war safe-haven spike
  { date: '2022-10-31', target: 1640.0, volMultiplier: 1.1 }, // Fed rate hiking bottom
  { date: '2023-05-04', target: 2050.0, volMultiplier: 1.2 }, // Banking crisis rally
  { date: '2023-10-06', target: 1820.0, volMultiplier: 0.9 }, // Pre-rally dip
  { date: '2024-04-12', target: 2400.0, volMultiplier: 1.3 }, // Central bank buying breakout
  { date: '2024-10-30', target: 2780.0, volMultiplier: 1.1 }, // Record run
  { date: '2025-06-30', target: 2650.0, volMultiplier: 0.9 },
  { date: '2025-12-31', target: 2720.0, volMultiplier: 0.9 },
];

// 2. BITCOIN / BTC-USD historical milestones
// 2020 start $7,200 -> crash to $5,000 -> 2021 peak $69,000 -> 2022 crash to $16,000 -> 2024 ATH $73,000 -> $95,000+
const BTC_ANCHORS = [
  { date: '2020-01-02', target: 7200.0, volMultiplier: 1.0 },
  { date: '2020-03-12', target: 4900.0, volMultiplier: 3.5 }, // Black Thursday crash
  { date: '2020-10-01', target: 10600.0, volMultiplier: 0.9 },
  { date: '2020-12-31', target: 29000.0, volMultiplier: 2.1 }, // Institutional breakout
  { date: '2021-04-14', target: 63500.0, volMultiplier: 2.2 }, // Coinbase IPO peak
  { date: '2021-07-20', target: 29800.0, volMultiplier: 2.4 }, // China mining ban summer dip
  { date: '2021-11-10', target: 68789.0, volMultiplier: 1.8 }, // 2021 ATH
  { date: '2022-06-18', target: 19000.0, volMultiplier: 2.8 }, // Luna / Celsius unwind
  { date: '2022-11-21', target: 15750.0, volMultiplier: 2.5 }, // FTX crash bottom
  { date: '2023-04-15', target: 30400.0, volMultiplier: 1.3 }, // Bank crisis flight
  { date: '2023-10-15', target: 27000.0, volMultiplier: 1.0 },
  { date: '2024-03-14', target: 73750.0, volMultiplier: 2.0 }, // Spot ETF rush ATH
  { date: '2024-08-05', target: 54000.0, volMultiplier: 2.2 }, // Yen carry unwind dip
  { date: '2024-12-15', target: 102000.0, volMultiplier: 2.4 }, // Post-election surge
  { date: '2025-06-30', target: 94000.0, volMultiplier: 1.7 },
  { date: '2025-12-31', target: 98500.0, volMultiplier: 1.6 },
];

// 3. NVIDIA / NVDA historical milestones (Split-adjusted 10-for-1 June 2024 basis)
// 2020 start ~$5.90 -> 2021 peak ~$33.00 -> 2022 tech drawdown to ~$11.20 -> 2023-2024 AI explosion past $130+
const NVDA_ANCHORS = [
  { date: '2020-01-02', target: 5.95, volMultiplier: 1.0 },
  { date: '2020-03-23', target: 4.55, volMultiplier: 2.4 }, // Pandemic tech dip
  { date: '2020-09-02', target: 14.30, volMultiplier: 1.8 }, // Ampere GPU launch
  { date: '2021-03-08', target: 11.60, volMultiplier: 1.2 },
  { date: '2021-11-29', target: 33.37, volMultiplier: 2.0 }, // 2021 Metaverse / Tech peak
  { date: '2022-10-14', target: 11.22, volMultiplier: 2.2 }, // Semiconductor cycle trough (-66%)
  { date: '2023-01-03', target: 14.30, volMultiplier: 1.2 }, // ChatGPT inception
  { date: '2023-05-25', target: 37.98, volMultiplier: 3.0 }, // Historic Q1 earnings gap up
  { date: '2023-12-29', target: 49.52, volMultiplier: 1.2 },
  { date: '2024-06-18', target: 135.58, volMultiplier: 2.0 }, // Reached world's most valuable company
  { date: '2024-08-07', target: 98.90, volMultiplier: 2.2 }, // Growth pullback
  { date: '2024-11-20', target: 146.00, volMultiplier: 1.6 }, // Blackwell architecture delivery
  { date: '2025-06-30', target: 138.00, volMultiplier: 1.4 },
  { date: '2025-12-31', target: 142.50, volMultiplier: 1.3 },
];

// Lazy cached historical database
let cachedDatabase: Record<AssetId, OHLCVBar[]> | null = null;

export function getHistoricalData(assetId: AssetId): OHLCVBar[] {
  if (!cachedDatabase) {
    cachedDatabase = {
      GOLD: generateDeterministicSeries('GOLD', 1520.5, 0.0075, GOLD_ANCHORS, 4242, 185000),
      BTC: generateDeterministicSeries('BTC', 7200.0, 0.026, BTC_ANCHORS, 9999, 450000),
      NVDA: generateDeterministicSeries('NVDA', 5.95, 0.021, NVDA_ANCHORS, 7777, 65000000),
    };
  }

  return cachedDatabase[assetId] || [];
}

export function registerCustomDataset(assetMeta: AssetMeta, bars: OHLCVBar[]): void {
  if (!cachedDatabase) {
    getHistoricalData('GOLD'); // warm cache
  }
  if (cachedDatabase) {
    cachedDatabase[assetMeta.id] = bars;
  }
}
