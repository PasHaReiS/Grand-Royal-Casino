import { Payline, SlotSymbolDef } from '../types';

export const SLOT_SYMBOLS: SlotSymbolDef[] = [
  {
    id: 'crown',
    name: 'Kraliyet Tacı',
    icon: '👑',
    multiplier3: 100,
    multiplier2: 10,
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.15)',
  },
  {
    id: 'diamond',
    name: 'Elmas',
    icon: '💎',
    multiplier3: 50,
    multiplier2: 5,
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
  },
  {
    id: 'seven',
    name: 'Şanslı 7',
    icon: '7️⃣',
    multiplier3: 30,
    multiplier2: 3,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  {
    id: 'wild',
    name: 'Wild Yıldız',
    icon: '⭐',
    multiplier3: 25,
    color: '#facc15',
    bgColor: 'rgba(250, 204, 21, 0.2)',
    isWild: true,
  },
  {
    id: 'bell',
    name: 'Altın Çan',
    icon: '🔔',
    multiplier3: 15,
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.12)',
  },
  {
    id: 'clover',
    name: 'Şans Yoncası',
    icon: '🍀',
    multiplier3: 10,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
  },
  {
    id: 'grapes',
    name: 'Üzüm',
    icon: '🍇',
    multiplier3: 6,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
  },
  {
    id: 'cherry',
    name: 'Kiraz',
    icon: '🍒',
    multiplier3: 4,
    multiplier2: 2,
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.12)',
  },
  {
    id: 'bar',
    name: 'Altın Külçe',
    icon: '🪙',
    multiplier3: 3,
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
  },
];

// 5 Standard Classic Paylines across a 3x3 reel setup
export const PAYLINES: Payline[] = [
  {
    id: 1,
    name: 'Orta Çizgi (1)',
    coords: [[0, 1], [1, 1], [2, 1]], // [reel, row]
    color: '#eab308', // Gold
  },
  {
    id: 2,
    name: 'Üst Çizgi (2)',
    coords: [[0, 0], [1, 0], [2, 0]],
    color: '#38bdf8', // Cyan
  },
  {
    id: 3,
    name: 'Alt Çizgi (3)',
    coords: [[0, 2], [1, 2], [2, 2]],
    color: '#ec4899', // Pink
  },
  {
    id: 4,
    name: 'Çapraz İnen (4)',
    coords: [[0, 0], [1, 1], [2, 2]],
    color: '#a855f7', // Purple
  },
  {
    id: 5,
    name: 'Çapraz Çıkan (5)',
    coords: [[0, 2], [1, 1], [2, 0]],
    color: '#22c55e', // Green
  },
];

// Generate an extended reel strip for continuous seamless circular looping
export function generateReelStrip(): SlotSymbolDef[] {
  // A balanced reel distribution
  const baseSymbols: SlotSymbolDef[] = [
    SLOT_SYMBOLS[0], // Crown
    SLOT_SYMBOLS[8], // Bar
    SLOT_SYMBOLS[7], // Cherry
    SLOT_SYMBOLS[4], // Bell
    SLOT_SYMBOLS[6], // Grapes
    SLOT_SYMBOLS[1], // Diamond
    SLOT_SYMBOLS[7], // Cherry
    SLOT_SYMBOLS[5], // Clover
    SLOT_SYMBOLS[2], // Seven
    SLOT_SYMBOLS[8], // Bar
    SLOT_SYMBOLS[3], // Wild
    SLOT_SYMBOLS[6], // Grapes
    SLOT_SYMBOLS[4], // Bell
    SLOT_SYMBOLS[7], // Cherry
    SLOT_SYMBOLS[5], // Clover
  ];

  // Repeat for length so we can spin deep
  return [...baseSymbols, ...baseSymbols, ...baseSymbols, ...baseSymbols];
}
