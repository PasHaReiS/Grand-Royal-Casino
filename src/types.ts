export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // 2-10, J/Q/K = 10, A = 11 (adjusted dynamically)
  isFaceUp: boolean;
}

export type GameView = 'lobby' | 'blackjack' | 'poker' | 'slot' | 'roulette' | 'baccarat' | 'multiplayer';

// ---------------- BACCARAT & CASINO DICE (BARBUT) TYPES ----------------
export type BaccaratBetType =
  | 'pass_line'   // Kazanır / Ön (Come-out 7,11 wins; 2,3,12 craps; point)
  | 'dont_pass'   // Kaybeder / Arka (2,3 wins; 12 push; 7,11 loses; point)
  | 'player'      // Baccarat Oyuncu (1:1)
  | 'banker'      // Baccarat Kasa (1:1 / 0.95:1)
  | 'tie'         // Baccarat Beraberlik (8:1)
  | 'field'       // Alan: 2, 3, 4, 9, 10, 11, 12 (2 pays 2:1, 12 pays 3:1)
  | 'any_seven'   // Kırmızı Yedi (4:1)
  | 'any_craps'   // Craps / Barbut 2, 3, 12 (7:1)
  | 'yo_eleven'   // 11 (15:1)
  | 'snake_eyes'  // 1-1 Hep Yek (30:1)
  | 'boxcars'     // 6-6 Düşeş (30:1)
  | 'hard_4'      // 2-2 Dört Cihar (9:1)
  | 'hard_6'      // 3-3 Dü Se (9:1)
  | 'hard_8'      // 4-4 Dört Dört (9:1)
  | 'hard_10'     // 5-5 Dü Beş (9:1)
  | 'place_4'     // Sayı 4 (9:5)
  | 'place_5'     // Sayı 5 (7:5)
  | 'place_6'     // Sayı 6 (7:6)
  | 'place_8'     // Sayı 8 (7:6)
  | 'place_9'     // Sayı 9 (7:5)
  | 'place_10';   // Sayı 10 (9:5)

export interface BaccaratBet {
  id: string;
  type: BaccaratBetType;
  amount: number;
  label: string;
  payoutMultiplier: number;
}

export interface DiceRollResult {
  die1: number; // 1 to 6
  die2: number; // 1 to 6
  total: number; // 2 to 12
  isPointHit?: boolean;
  isSevenOut?: boolean;
  isNatural?: boolean;
  isCraps?: boolean;
  pointEstablished?: number | null;
  baccaratWinner: 'player' | 'banker' | 'tie';
  playerVal: number;
  bankerVal: number;
}

export interface DiceHistoryItem {
  id: string;
  die1: number;
  die2: number;
  total: number;
  point: number | null;
  timestamp: number;
  statusText: string;
}

// ---------------- ROULETTE TYPES ----------------
export type RouletteBetType =
  | 'straight' // single number 0-36
  | 'split'    // 2 numbers
  | 'street'   // 3 numbers row
  | 'corner'   // 4 numbers
  | 'sixline'  // 6 numbers
  | 'dozen'    // 1-12, 13-24, 25-36
  | 'column'   // col 1, col 2, col 3
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'      // 1-18
  | 'high';    // 19-36

export interface RouletteBet {
  id: string;
  type: RouletteBetType;
  amount: number;
  numbers: number[];
  label: string;
  payoutMultiplier: number;
}

export interface RouletteHistoryItem {
  id: string;
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: number;
}

// ---------------- BLACKJACK TYPES ----------------
export interface BlackjackHand {
  id: string;
  cards: Card[];
  bet: number;
  isBusted: boolean;
  isStanding: boolean;
  isBlackjack: boolean;
  isDoubled: boolean;
  statusText?: string;
  payout?: number;
}

export type BlackjackPhase = 'betting' | 'dealing' | 'playerTurn' | 'dealerTurn' | 'roundOver';

// ---------------- POKER TYPES ----------------
export enum PokerHandRank {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export interface PokerEvaluation {
  rank: PokerHandRank;
  nameTr: string;
  primaryRankValue: number; // for tie breaking
  secondaryRankValue: number; // for two pair / full house
  kickers: number[]; // remaining cards in descending rank order
  score: number; // calculated composite numeric score for foolproof comparison
  winningIndices: number[]; // indices of cards making up the winning combo
  payoutMultiplier: number; // base multiplier for video poker / bonus
}

export type PokerPhase = 'betting' | 'dealing' | 'holding' | 'drawing' | 'showdown';

// ---------------- SLOT MACHINE TYPES ----------------
export interface SlotSymbolDef {
  id: string;
  name: string;
  icon: string;
  multiplier3: number; // 3 on payline
  multiplier2?: number; // 2 on payline (for top tier symbols)
  color: string;
  bgColor: string;
  isWild?: boolean;
}

export interface Payline {
  id: number;
  name: string;
  coords: [number, number][]; // row indices for [reel0, reel1, reel2] e.g. [1,1,1] is center row
  color: string;
}

export interface SlotSpinResult {
  matrix: SlotSymbolDef[][]; // 3 columns (reels), each having rows [0, 1, 2]
  winningLines: {
    payline: Payline;
    symbol: SlotSymbolDef;
    count: number;
    winAmount: number;
  }[];
  totalWin: number;
}

// ---------------- USER & STATS ----------------
export type StatTimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface GameHistoryEntry {
  id: string;
  timestamp: number;
  game: 'blackjack' | 'poker' | 'slot' | 'roulette' | 'baccarat';
  bet: number;
  won: number;
  netWin: number;
}

export interface UserStats {
  totalBets: number;
  totalWon: number;
  gamesPlayed: number;
  bestWin: number;
  blackjackWins: number;
  pokerWins: number;
  slotWins: number;
  rouletteWins: number;
  baccaratWins?: number;
}

export interface FilteredStats {
  gamesPlayed: number;
  totalBets: number;
  totalWon: number;
  netProfit: number;
  bestWin: number;
  winCount: number;
  winRate: number; // percentage 0-100
  blackjack: { played: number; won: number; bets: number; payouts: number; winRate: number };
  poker: { played: number; won: number; bets: number; payouts: number; winRate: number };
  slot: { played: number; won: number; bets: number; payouts: number; winRate: number };
  roulette: { played: number; won: number; bets: number; payouts: number; winRate: number };
  baccarat?: { played: number; won: number; bets: number; payouts: number; winRate: number };
}

export interface VaultDebtInfo {
  principal: number; // Ana para borcu ($)
  accruedInterest: number; // Biriken faiz ($)
  dailyRatePercent: number; // Günlük faiz oranı (varsayılan %5)
  borrowedAt: number; // Borcun alındığı ilk tarih (timestamp)
  lastAccrualTimestamp: number; // Son faiz işletilen tarih (timestamp)
  weeklyDueDate: number; // Haftalık faiz ödeme son tarihi (timestamp, borrowedAt + 7 days)
  simulatedDaysElapsed?: number; // Test/simülasyon için eklenen gün sayısı
  totalBorrowedHistorical: number; // Bugüne kadar çekilen toplam borç
  totalRepaidHistorical: number; // Bugüne kadar geri ödenen toplam borç
  debtForgivenByPatron?: boolean; // Patron tarafından borç affedildi mi
  forgivenAt?: number; // Affedilme zamanı
}

export const MAX_MEMBER_DEBT = 100_000_000; // Üyelerde maksimum borç tutarı: $100.000.000 (100 Milyon Dolar)
export const DEFAULT_DAILY_INTEREST_RATE = 5; // Günlük %5 faiz

export const createEmptyDebtInfo = (): VaultDebtInfo => ({
  principal: 0,
  accruedInterest: 0,
  dailyRatePercent: DEFAULT_DAILY_INTEREST_RATE,
  borrowedAt: 0,
  lastAccrualTimestamp: 0,
  weeklyDueDate: 0,
  simulatedDaysElapsed: 0,
  totalBorrowedHistorical: 0,
  totalRepaidHistorical: 0,
  debtForgivenByPatron: false,
  forgivenAt: 0,
});

export const isVipManager = (name: string): boolean => {
  return (name || '').trim().toLowerCase() === 'pasha';
};

// ---------------- MULTIPLAYER REAL-TIME TYPES ----------------
export interface PlayerProfile {
  id: string;
  name: string;
  isPasha: boolean;
  bankroll: number;
  avatarSeed?: string;
}

export interface MultiplayerSeat {
  seatIndex: number;
  player: PlayerProfile | null;
  bet: number;
  cards: Card[];
  score: number;
  isStanding: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
  isDoubled: boolean;
  payout: number;
  statusText?: string;
  // Poker specific
  heldIndices?: number[];
  pokerEvaluation?: PokerEvaluation | null;
  hasDrawn?: boolean;
}

export type TablePhase = 'waiting_bets' | 'dealing' | 'player_turns' | 'dealer_turn' | 'round_ended';

export interface MultiplayerTableState {
  tableId: string;
  name: string;
  gameType: 'blackjack' | 'poker';
  phase: TablePhase;
  dealerCards: Card[];
  dealerScore: number;
  seats: (MultiplayerSeat | null)[];
  activeSeatIndex: number | null;
  turnTimeRemaining: number;
  deckCount: number;
  roundNumber: number;
  minBet: number;
  maxBet: number;
  isVipRoom: boolean;
  history: { id: string; text: string; time: string; type: 'info' | 'win' | 'bet' }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  isPasha: boolean;
  text: string;
  timestamp: number;
  type: 'chat' | 'reaction' | 'system';
}

export interface TableSummary {
  tableId: string;
  name: string;
  gameType: 'blackjack' | 'poker';
  playerCount: number;
  seatedCount: number;
  maxSeats: number;
  minBet: number;
  maxBet: number;
  isVipRoom: boolean;
  currentPhase: TablePhase;
}
