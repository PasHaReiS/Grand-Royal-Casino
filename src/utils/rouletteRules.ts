import { RouletteBet } from '../types';

// Standard European Roulette Wheel sequence (clockwise from 0)
export const ROULETTE_SEQUENCE: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS: Set<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const BLACK_NUMBERS: Set<number> = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]);

export function getNumberColor(num: number): 'red' | 'black' | 'green' {
  if (num === 0) return 'green';
  return RED_NUMBERS.has(num) ? 'red' : 'black';
}

export function isEven(num: number): boolean {
  if (num === 0) return false;
  return num % 2 === 0;
}

export function isOdd(num: number): boolean {
  if (num === 0) return false;
  return num % 2 !== 0;
}

export function isLow(num: number): boolean {
  return num >= 1 && num <= 18;
}

export function isHigh(num: number): boolean {
  return num >= 19 && num <= 36;
}

export function getDozen(num: number): 1 | 2 | 3 | null {
  if (num >= 1 && num <= 12) return 1;
  if (num >= 13 && num <= 24) return 2;
  if (num >= 25 && num <= 36) return 3;
  return null;
}

export function getColumn(num: number): 1 | 2 | 3 | null {
  if (num === 0) return null;
  const mod = num % 3;
  if (mod === 1) return 1; // 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  if (mod === 2) return 2; // 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  return 3; // 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
}

// Columns array helper (each with 12 numbers)
export const COLUMN_1_NUMBERS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
export const COLUMN_2_NUMBERS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
export const COLUMN_3_NUMBERS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

// Dozens helper
export const DOZEN_1_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
export const DOZEN_2_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 13);
export const DOZEN_3_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 25);

// French / Announce Bets
export const FRENCH_BETS = {
  voisins: {
    name: 'Voisins du Zéro (Sıfırın Komşuları)',
    numbers: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
    description: 'Çarkta sıfırın iki yanındaki 17 sayı (9 fiş kombini)',
  },
  tiers: {
    name: 'Tiers du Cylindre (Silindirin Üçte Biri)',
    numbers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
    description: 'Sıfırın tam karşısındaki 12 sayı (6 fiş kombini)',
  },
  orphelins: {
    name: 'Orphelins (Yetimler)',
    numbers: [1, 20, 14, 31, 9, 17, 34, 6],
    description: 'Voisins ve Tiers dışındaki 8 sayı (5 fiş kombini)',
  },
  zeroSpiel: {
    name: 'Jeu Zéro (Sıfır Oyunu)',
    numbers: [12, 35, 3, 26, 0, 32, 15],
    description: 'Sıfırın en yakın 7 komşusu (4 fiş kombini)',
  },
};

export interface WinningBetResult {
  bet: RouletteBet;
  winAmount: number;
  multiplier: number;
  label: string;
}

export interface RoulettePayoutResult {
  totalWon: number;
  totalStaked: number;
  netWin: number;
  winningBets: WinningBetResult[];
}

export function calculateRoulettePayout(bets: RouletteBet[], winningNumber: number): RoulettePayoutResult {
  let totalWon = 0;
  let totalStaked = 0;
  const winningBets: WinningBetResult[] = [];

  for (const bet of bets) {
    totalStaked += bet.amount;
    let isWin = false;

    switch (bet.type) {
      case 'straight':
      case 'split':
      case 'street':
      case 'corner':
      case 'sixline':
        isWin = bet.numbers.includes(winningNumber);
        break;

      case 'dozen':
        isWin = bet.numbers.includes(winningNumber);
        break;

      case 'column':
        isWin = bet.numbers.includes(winningNumber);
        break;

      case 'red':
        isWin = getNumberColor(winningNumber) === 'red';
        break;

      case 'black':
        isWin = getNumberColor(winningNumber) === 'black';
        break;

      case 'even':
        isWin = isEven(winningNumber);
        break;

      case 'odd':
        isWin = isOdd(winningNumber);
        break;

      case 'low':
        isWin = isLow(winningNumber);
        break;

      case 'high':
        isWin = isHigh(winningNumber);
        break;
    }

    if (isWin) {
      const winAmount = bet.amount * bet.payoutMultiplier;
      totalWon += winAmount;
      winningBets.push({
        bet,
        winAmount,
        multiplier: bet.payoutMultiplier,
        label: bet.label,
      });
    }
  }

  return {
    totalWon,
    totalStaked,
    netWin: totalWon - totalStaked,
    winningBets,
  };
}
