import { Card, BlackjackHand } from '../types';

export interface HandCalculation {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export function calculateBlackjackHand(cards: Card[]): HandCalculation {
  // If face down cards exist in the hand, only count face up cards if evaluating visible
  const activeCards = cards.filter(c => c.isFaceUp);
  if (activeCards.length === 0) {
    return { total: 0, isSoft: false, isBust: false, isBlackjack: false };
  }

  let total = 0;
  let aceCount = 0;

  for (const card of activeCards) {
    if (card.rank === 'A') {
      aceCount += 1;
      total += 11;
    } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  let isSoft = false;
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount -= 1;
  }

  // Soft if we still have at least one Ace counted as 11
  if (aceCount > 0 && total <= 21) {
    isSoft = true;
  }

  const isBust = total > 21;
  const isBlackjack = activeCards.length === 2 && total === 21;

  return { total, isSoft, isBust, isBlackjack };
}

export function canSplit(hand: BlackjackHand, playerChips: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (playerChips < hand.bet) return false;
  
  const [c1, c2] = hand.cards;
  // Allow split if ranks match (e.g. 8-8, A-A) or both are 10-value cards (e.g. 10-K, J-Q)
  const ranksMatch = c1.rank === c2.rank;
  const valuesMatch = c1.value === 10 && c2.value === 10;
  
  return ranksMatch || valuesMatch;
}

export function canDoubleDown(hand: BlackjackHand, playerChips: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (playerChips < hand.bet) return false;
  if (hand.isDoubled || hand.isStanding || hand.isBusted) return false;
  return true;
}
