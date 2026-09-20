import { GameHistoryEntry, StatTimeFilter, FilteredStats, UserStats } from '../types';

export const getTimeFilterCutoff = (filter: StatTimeFilter): number => {
  const now = Date.now();
  switch (filter) {
    case 'daily': {
      // Start of current day (midnight)
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    case 'weekly': {
      // Last 7 days
      return now - 7 * 24 * 60 * 60 * 1000;
    }
    case 'monthly': {
      // Last 30 days
      return now - 30 * 24 * 60 * 60 * 1000;
    }
    case 'yearly': {
      // Last 365 days
      return now - 365 * 24 * 60 * 60 * 1000;
    }
    case 'all':
    default:
      return 0;
  }
};

export const filterHistory = (
  history: GameHistoryEntry[],
  filter: StatTimeFilter
): GameHistoryEntry[] => {
  const cutoff = getTimeFilterCutoff(filter);
  return history.filter(item => item.timestamp >= cutoff);
};

export const computeFilteredStats = (
  history: GameHistoryEntry[],
  filter: StatTimeFilter,
  fallbackBaseStats?: UserStats
): FilteredStats => {
  const filtered = filterHistory(history, filter);

  // If filtered has entries, compute strictly from history
  if (filtered.length > 0) {
    let totalBets = 0;
    let totalWon = 0;
    let bestWin = 0;
    let winCount = 0;

    const gameStats = {
      blackjack: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
      poker: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
      slot: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
      roulette: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
    };

    for (const item of filtered) {
      totalBets += item.bet;
      totalWon += item.won;
      if (item.netWin > bestWin) {
        bestWin = item.netWin;
      }
      if (item.netWin > 0) {
        winCount++;
      }

      const g = gameStats[item.game];
      if (g) {
        g.played++;
        g.bets += item.bet;
        g.payouts += item.won;
        if (item.netWin > 0) {
          g.won++;
        }
      }
    }

    // Compute win rates
    for (const key of ['blackjack', 'poker', 'slot', 'roulette'] as const) {
      const g = gameStats[key];
      g.winRate = g.played > 0 ? Math.round((g.won / g.played) * 100) : 0;
    }

    const gamesPlayed = filtered.length;
    const winRate = gamesPlayed > 0 ? Math.round((winCount / gamesPlayed) * 100) : 0;

    return {
      gamesPlayed,
      totalBets,
      totalWon,
      netProfit: totalWon - totalBets,
      bestWin,
      winCount,
      winRate,
      ...gameStats,
    };
  }

  // If history is empty for this filter, but fallbackBaseStats exists:
  if (fallbackBaseStats && fallbackBaseStats.gamesPlayed > 0) {
    // Distribute proportionally for different filters if history wasn't tracked yet
    const ratio = filter === 'daily' ? 0.35 : filter === 'weekly' ? 0.65 : filter === 'monthly' ? 0.85 : 1.0;
    const gamesPlayed = Math.max(filter === 'daily' ? 1 : 0, Math.round(fallbackBaseStats.gamesPlayed * ratio));
    const totalBets = Math.round(fallbackBaseStats.totalBets * ratio);
    const totalWon = Math.round(fallbackBaseStats.totalWon * ratio);
    const bestWin = fallbackBaseStats.bestWin;
    const bjWon = Math.round(fallbackBaseStats.blackjackWins * ratio);
    const pkWon = Math.round(fallbackBaseStats.pokerWins * ratio);
    const slWon = Math.round(fallbackBaseStats.slotWins * ratio);
    const rlWon = Math.round((fallbackBaseStats.rouletteWins || 0) * ratio);
    const totalWins = bjWon + pkWon + slWon + rlWon;
    const winRate = gamesPlayed > 0 ? Math.min(100, Math.round((totalWins / gamesPlayed) * 100)) : 0;

    return {
      gamesPlayed,
      totalBets,
      totalWon,
      netProfit: totalWon - totalBets,
      bestWin,
      winCount: totalWins,
      winRate,
      blackjack: {
        played: Math.max(bjWon, Math.round(gamesPlayed * 0.3)),
        won: bjWon,
        bets: Math.round(totalBets * 0.3),
        payouts: Math.round(totalWon * 0.3),
        winRate: Math.round(gamesPlayed * 0.3) > 0 ? Math.round((bjWon / (gamesPlayed * 0.3)) * 100) : 0,
      },
      poker: {
        played: Math.max(pkWon, Math.round(gamesPlayed * 0.25)),
        won: pkWon,
        bets: Math.round(totalBets * 0.25),
        payouts: Math.round(totalWon * 0.25),
        winRate: Math.round(gamesPlayed * 0.25) > 0 ? Math.round((pkWon / (gamesPlayed * 0.25)) * 100) : 0,
      },
      slot: {
        played: Math.max(slWon, Math.round(gamesPlayed * 0.25)),
        won: slWon,
        bets: Math.round(totalBets * 0.25),
        payouts: Math.round(totalWon * 0.25),
        winRate: Math.round(gamesPlayed * 0.25) > 0 ? Math.round((slWon / (gamesPlayed * 0.25)) * 100) : 0,
      },
      roulette: {
        played: Math.max(rlWon, Math.round(gamesPlayed * 0.2)),
        won: rlWon,
        bets: Math.round(totalBets * 0.2),
        payouts: Math.round(totalWon * 0.2),
        winRate: Math.round(gamesPlayed * 0.2) > 0 ? Math.round((rlWon / (gamesPlayed * 0.2)) * 100) : 0,
      },
    };
  }

  // Default empty stats
  return {
    gamesPlayed: 0,
    totalBets: 0,
    totalWon: 0,
    netProfit: 0,
    bestWin: 0,
    winCount: 0,
    winRate: 0,
    blackjack: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
    poker: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
    slot: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
    roulette: { played: 0, won: 0, bets: 0, payouts: 0, winRate: 0 },
  };
};

/**
 * Formats currency values cleanly and compactly if needed to ensure they always fit within boxes
 */
export const formatCurrency = (val: number): string => {
  if (Math.abs(val) >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Mr`;
  }
  if (Math.abs(val) >= 10_000_000) {
    return `$${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')} M`;
  }
  return `$${val.toLocaleString('tr-TR')}`;
};
