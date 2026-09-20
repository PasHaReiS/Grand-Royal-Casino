export interface TableTier {
  id: string;
  name: string;
  tagline: string;
  minBet: number;
  maxBet: number; // 0 means Unlimited (Sınırsız ∞)
  badge: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate';
  accentBorder: string;
  bgGradient: string;
  defaultChip: number;
  recommendedChips: number[];
  isVip?: boolean;
}

export const DEFAULT_TABLE_TIERS: TableTier[] = [
  {
    id: 'tier-standard',
    name: 'Standart Vegas Masası',
    tagline: 'Geleneksel kumarhane ritmi ve dengeli limitler',
    minBet: 50,
    maxBet: 50000,
    badge: '🎲 Standart',
    color: 'emerald',
    accentBorder: 'border-emerald-500/40',
    bgGradient: 'from-emerald-950/70 to-slate-900',
    defaultChip: 50,
    recommendedChips: [10, 25, 50, 100, 500, 1000, 5000],
  },
  {
    id: 'tier-highroller',
    name: 'High Roller Kulübü',
    tagline: 'Yüksek kazanç hedefleyen usta oyuncular için',
    minBet: 1000,
    maxBet: 500000,
    badge: '💎 High Roller',
    color: 'blue',
    accentBorder: 'border-blue-500/40',
    bgGradient: 'from-blue-950/70 to-slate-900',
    defaultChip: 1000,
    recommendedChips: [500, 1000, 5000, 10000, 25000, 100000],
  },
  {
    id: 'tier-vip',
    name: 'VIP Elit Salonu',
    tagline: 'Özel krupiye, lüks atmosfer ve prestijli eller',
    minBet: 50000,
    maxBet: 5000000,
    badge: '👑 VIP Elit',
    color: 'purple',
    accentBorder: 'border-purple-500/40',
    bgGradient: 'from-purple-950/70 to-slate-900',
    defaultChip: 50000,
    recommendedChips: [25000, 50000, 100000, 250000, 500000, 1000000],
    isVip: true,
  },
  {
    id: 'tier-whale',
    name: 'Balina Masası (Whale Lounge)',
    tagline: 'Devasa sermayeler ve yüksek tansiyonlu turlar',
    minBet: 500000,
    maxBet: 50000000,
    badge: '🐋 Whale Club',
    color: 'amber',
    accentBorder: 'border-amber-500/40',
    bgGradient: 'from-amber-950/70 to-slate-900',
    defaultChip: 500000,
    recommendedChips: [100000, 500000, 1000000, 2500000, 5000000, 10000000],
    isVip: true,
  },
  {
    id: 'tier-unlimited',
    name: 'Grand Royale (Limitsiz)',
    tagline: 'Asgari $10.000.000, üst tavan sınırı yok (Unlimited)!',
    minBet: 10000000,
    maxBet: 0, // 0 = Sınırsız / Unlimited
    badge: '⚡ Sınırsız (∞)',
    color: 'rose',
    accentBorder: 'border-rose-500/50',
    bgGradient: 'from-rose-950/70 to-slate-900',
    defaultChip: 10000000,
    recommendedChips: [1000000, 5000000, 10000000, 25000000, 50000000],
    isVip: true,
  },
];

export function formatLimitText(minBet: number, maxBet: number): string {
  const minStr = `$${minBet.toLocaleString('tr-TR')}`;
  const maxStr = maxBet && maxBet > 0 ? `$${maxBet.toLocaleString('tr-TR')}` : 'Sınırsız (∞)';
  return `Min: ${minStr} • Max: ${maxStr}`;
}

export function formatMinMaxBadge(minBet: number, maxBet: number): string {
  const minFormatted = minBet >= 1000000 ? `${minBet / 1000000}M` : minBet >= 1000 ? `${minBet / 1000}K` : `${minBet}`;
  const maxFormatted = maxBet && maxBet > 0 
    ? (maxBet >= 1000000 ? `${maxBet / 1000000}M` : maxBet >= 1000 ? `${maxBet / 1000}K` : `${maxBet}`)
    : '∞';
  return `$${minFormatted} - $${maxFormatted}`;
}

export function getSavedTableTier(gameKey: string, fallbackTierId = 'tier-standard'): TableTier {
  try {
    const saved = localStorage.getItem(`casino_table_tier_${gameKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.minBet !== undefined) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_TABLE_TIERS.find((t) => t.id === fallbackTierId) || DEFAULT_TABLE_TIERS[0];
}

export function saveTableTier(gameKey: string, tier: TableTier): void {
  try {
    localStorage.setItem(`casino_table_tier_${gameKey}`, JSON.stringify(tier));
  } catch {}
}
