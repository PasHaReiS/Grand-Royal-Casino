import { Card, PokerEvaluation, PokerHandRank } from '../types';
import { getPokerRankNumeric } from './cards';

export function evaluate5CardHand(cards: Card[]): PokerEvaluation {
  if (cards.length !== 5) {
    return {
      rank: PokerHandRank.HIGH_CARD,
      nameTr: 'Yetersiz Kart',
      primaryRankValue: 0,
      secondaryRankValue: 0,
      kickers: [],
      score: 0,
      winningIndices: [],
      payoutMultiplier: 0,
    };
  }

  // Extract items with original index
  const indexed = cards.map((c, idx) => ({
    card: c,
    idx,
    numeric: getPokerRankNumeric(c.rank),
    suit: c.suit,
  }));

  // Sort descending by numeric rank
  indexed.sort((a, b) => b.numeric - a.numeric);

  const values = indexed.map(i => i.numeric);
  const suits = indexed.map(i => i.suit);

  // Check flush
  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  // Regular straight
  let isStraight = false;
  let straightHigh = 0;
  let straightIndices: number[] = [];

  const isRegularStraight =
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1;

  if (isRegularStraight) {
    isStraight = true;
    straightHigh = values[0];
    straightIndices = indexed.map(i => i.idx);
  } else if (
    values[0] === 14 && // Ace
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    // Ace-low straight (Wheel: 5-4-3-2-A)
    isStraight = true;
    straightHigh = 5;
    straightIndices = indexed.map(i => i.idx);
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  // Group by frequency
  const groupFrequencies = Object.entries(counts).map(([rankStr, count]) => ({
    rank: parseInt(rankStr, 10),
    count,
  }));
  // Sort by count descending, then rank descending
  groupFrequencies.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.rank - a.rank;
  });

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rank: PokerHandRank.ROYAL_FLUSH,
        nameTr: 'Royal Flush (Floş Royal)',
        primaryRankValue: 14,
        secondaryRankValue: 0,
        kickers: [],
        score: computeScore(PokerHandRank.ROYAL_FLUSH, 14, 0, []),
        winningIndices: indexed.map(i => i.idx),
        payoutMultiplier: 250,
      };
    }
    return {
      rank: PokerHandRank.STRAIGHT_FLUSH,
      nameTr: 'Straight Flush (Sıralı Floş)',
      primaryRankValue: straightHigh,
      secondaryRankValue: 0,
      kickers: [],
      score: computeScore(PokerHandRank.STRAIGHT_FLUSH, straightHigh, 0, []),
      winningIndices: straightIndices,
      payoutMultiplier: 50,
    };
  }

  // 2. Four of a Kind (Kare)
  if (groupFrequencies[0].count === 4) {
    const quadRank = groupFrequencies[0].rank;
    const kicker = groupFrequencies[1].rank;
    const winningIdxs = indexed.filter(i => i.numeric === quadRank).map(i => i.idx);
    return {
      rank: PokerHandRank.FOUR_OF_A_KIND,
      nameTr: 'Four of a Kind (Kare)',
      primaryRankValue: quadRank,
      secondaryRankValue: 0,
      kickers: [kicker],
      score: computeScore(PokerHandRank.FOUR_OF_A_KIND, quadRank, 0, [kicker]),
      winningIndices: winningIdxs,
      payoutMultiplier: 25,
    };
  }

  // 3. Full House (Ful)
  if (groupFrequencies[0].count === 3 && groupFrequencies[1].count === 2) {
    const tripRank = groupFrequencies[0].rank;
    const pairRank = groupFrequencies[1].rank;
    return {
      rank: PokerHandRank.FULL_HOUSE,
      nameTr: 'Full House (Ful)',
      primaryRankValue: tripRank,
      secondaryRankValue: pairRank,
      kickers: [],
      score: computeScore(PokerHandRank.FULL_HOUSE, tripRank, pairRank, []),
      winningIndices: indexed.map(i => i.idx),
      payoutMultiplier: 9,
    };
  }

  // 4. Flush (Renk)
  if (isFlush) {
    return {
      rank: PokerHandRank.FLUSH,
      nameTr: 'Flush (Renk)',
      primaryRankValue: values[0],
      secondaryRankValue: 0,
      kickers: values.slice(1),
      score: computeScore(PokerHandRank.FLUSH, values[0], 0, values.slice(1)),
      winningIndices: indexed.map(i => i.idx),
      payoutMultiplier: 6,
    };
  }

  // 5. Straight (Kent / Sıralı)
  if (isStraight) {
    return {
      rank: PokerHandRank.STRAIGHT,
      nameTr: 'Straight (Kent)',
      primaryRankValue: straightHigh,
      secondaryRankValue: 0,
      kickers: [],
      score: computeScore(PokerHandRank.STRAIGHT, straightHigh, 0, []),
      winningIndices: straightIndices,
      payoutMultiplier: 4,
    };
  }

  // 6. Three of a Kind (Set / Üçlü)
  if (groupFrequencies[0].count === 3) {
    const tripRank = groupFrequencies[0].rank;
    const kickers = indexed.filter(i => i.numeric !== tripRank).map(i => i.numeric);
    const winningIdxs = indexed.filter(i => i.numeric === tripRank).map(i => i.idx);
    return {
      rank: PokerHandRank.THREE_OF_A_KIND,
      nameTr: 'Three of a Kind (Üçlü)',
      primaryRankValue: tripRank,
      secondaryRankValue: 0,
      kickers,
      score: computeScore(PokerHandRank.THREE_OF_A_KIND, tripRank, 0, kickers),
      winningIndices: winningIdxs,
      payoutMultiplier: 3,
    };
  }

  // 7. Two Pair (Döper / İki Çift)
  if (groupFrequencies[0].count === 2 && groupFrequencies[1].count === 2) {
    const highPair = Math.max(groupFrequencies[0].rank, groupFrequencies[1].rank);
    const lowPair = Math.min(groupFrequencies[0].rank, groupFrequencies[1].rank);
    const kicker = groupFrequencies[2].rank;
    const winningIdxs = indexed
      .filter(i => i.numeric === highPair || i.numeric === lowPair)
      .map(i => i.idx);
    return {
      rank: PokerHandRank.TWO_PAIR,
      nameTr: 'Two Pair (Döper)',
      primaryRankValue: highPair,
      secondaryRankValue: lowPair,
      kickers: [kicker],
      score: computeScore(PokerHandRank.TWO_PAIR, highPair, lowPair, [kicker]),
      winningIndices: winningIdxs,
      payoutMultiplier: 2,
    };
  }

  // 8. One Pair (Per / Tek Çift)
  if (groupFrequencies[0].count === 2) {
    const pairRank = groupFrequencies[0].rank;
    const kickers = indexed.filter(i => i.numeric !== pairRank).map(i => i.numeric);
    const winningIdxs = indexed.filter(i => i.numeric === pairRank).map(i => i.idx);
    
    // In casino poker, a high pair (Jacks or Better) or any pair can qualify
    const payout = pairRank >= 11 ? 1 : 0.5; // High pair pays 1:1, low pair returns push/half or ante
    return {
      rank: PokerHandRank.ONE_PAIR,
      nameTr: `One Pair (${formatRankTr(pairRank)} Per)`,
      primaryRankValue: pairRank,
      secondaryRankValue: 0,
      kickers,
      score: computeScore(PokerHandRank.ONE_PAIR, pairRank, 0, kickers),
      winningIndices: winningIdxs,
      payoutMultiplier: payout,
    };
  }

  // 9. High Card (Yüksek Kart)
  const highRank = values[0];
  const kickers = values.slice(1);
  const highestCardIdx = indexed.find(i => i.numeric === highRank)?.idx ?? 0;
  return {
    rank: PokerHandRank.HIGH_CARD,
    nameTr: `High Card (${formatRankTr(highRank)} Yüksek)`,
    primaryRankValue: highRank,
    secondaryRankValue: 0,
    kickers,
    score: computeScore(PokerHandRank.HIGH_CARD, highRank, 0, kickers),
    winningIndices: [highestCardIdx],
    payoutMultiplier: 0,
  };
}

function computeScore(
  rank: PokerHandRank,
  primary: number,
  secondary: number,
  kickers: number[]
): number {
  let score = rank * 1_000_000_000;
  score += primary * 10_000_000;
  score += secondary * 100_000;
  
  let multiplier = 1000;
  for (const k of kickers) {
    score += k * multiplier;
    multiplier = Math.floor(multiplier / 10);
  }
  return score;
}

export function formatRankTr(val: number): string {
  switch (val) {
    case 14: return 'As';
    case 13: return 'Papaz (K)';
    case 12: return 'Kız (Q)';
    case 11: return 'Vale (J)';
    default: return val.toString();
  }
}

// Dealer AI for 5-Card Draw
export function decideDealerDiscards(dealerCards: Card[]): number[] {
  const evalResult = evaluate5CardHand(dealerCards);
  
  // 1. Pat Hand: Full house, flush, straight, 4 of a kind, royal/straight flush -> Hold all 5!
  if (
    evalResult.rank >= PokerHandRank.STRAIGHT
  ) {
    return []; // Discard none
  }

  // 2. Three of a kind -> hold trips, discard 2 kickers
  if (evalResult.rank === PokerHandRank.THREE_OF_A_KIND) {
    const discardIndices: number[] = [];
    dealerCards.forEach((c, idx) => {
      if (getPokerRankNumeric(c.rank) !== evalResult.primaryRankValue) {
        discardIndices.push(idx);
      }
    });
    return discardIndices;
  }

  // 3. Two Pair -> hold both pairs, discard 5th kicker
  if (evalResult.rank === PokerHandRank.TWO_PAIR) {
    const discardIndices: number[] = [];
    dealerCards.forEach((c, idx) => {
      const num = getPokerRankNumeric(c.rank);
      if (num !== evalResult.primaryRankValue && num !== evalResult.secondaryRankValue) {
        discardIndices.push(idx);
      }
    });
    return discardIndices;
  }

  // 4. One Pair -> hold pair, discard other 3
  if (evalResult.rank === PokerHandRank.ONE_PAIR) {
    const discardIndices: number[] = [];
    dealerCards.forEach((c, idx) => {
      if (getPokerRankNumeric(c.rank) !== evalResult.primaryRankValue) {
        discardIndices.push(idx);
      }
    });
    return discardIndices;
  }

  // 5. Check for 4 to a flush
  const suitCounts: Record<string, number[]> = {};
  dealerCards.forEach((c, idx) => {
    suitCounts[c.suit] = suitCounts[c.suit] || [];
    suitCounts[c.suit].push(idx);
  });
  for (const indices of Object.values(suitCounts)) {
    if (indices.length === 4) {
      // Discard the odd 1 card
      const oddIndex = [0, 1, 2, 3, 4].find(i => !indices.includes(i));
      if (oddIndex !== undefined) return [oddIndex];
    }
  }

  // 6. High Card: keep highest 1 or 2 cards (e.g. Ace or King), discard others
  const sorted = dealerCards
    .map((c, idx) => ({ idx, val: getPokerRankNumeric(c.rank) }))
    .sort((a, b) => b.val - a.val);

  if (sorted[0].val >= 13) {
    // Keep top card, discard other 4
    return sorted.slice(1).map(s => s.idx);
  }

  // Discard lowest 3, keep top 2
  return sorted.slice(2).map(s => s.idx);
}
