import React, { useState, useEffect } from 'react';
import { GameView, UserStats, GameHistoryEntry, isVipManager, VaultDebtInfo, createEmptyDebtInfo } from './types';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { BlackjackGame } from './components/BlackjackGame';
import { PokerGame } from './components/PokerGame';
import { SlotGame } from './components/SlotGame';
import { RouletteGame } from './components/RouletteGame';
import { BaccaratGame } from './components/BaccaratGame';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerTable } from './components/MultiplayerTable';
import { RulesModal } from './components/RulesModal';
import { VipVaultModal } from './components/VipVaultModal';
import { ProfileModal } from './components/ProfileModal';
import { sound } from './utils/audio';
import { useMultiplayer } from './utils/useMultiplayer';
import {
  calculateAccruedDebt,
  borrowFromVault,
  repayDebt,
  simulateAddDays
} from './utils/debtHelper';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('lobby');
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Player Name (Persisted in localStorage, defaults to 'PasHa' for VIP authority)
  const [playerName, setPlayerName] = useState<string>(() => {
    const saved = localStorage.getItem('casino_player_name');
    if (saved && saved.trim()) {
      return saved.trim();
    }
    return 'PasHa';
  });

  // Bankroll Management (Persisted in localStorage)
  const [bankroll, setBankroll] = useState<number>(() => {
    const saved = localStorage.getItem('casino_bankroll');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 2500; // Starting VIP balance
  });

  // User Statistics (Persisted in localStorage)
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('casino_stats');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      totalBets: 0,
      totalWon: 0,
      gamesPlayed: 0,
      bestWin: 0,
      blackjackWins: 0,
      pokerWins: 0,
      slotWins: 0,
      rouletteWins: 0,
    };
  });

  // Game History log for timeframe filtering (daily, weekly, monthly, yearly)
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>(() => {
    const saved = localStorage.getItem('casino_game_history');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Vault Debt & Daily Interest (Persisted in localStorage)
  const [debtInfo, setDebtInfo] = useState<VaultDebtInfo>(() => {
    const saved = localStorage.getItem('casino_vault_debt');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return calculateAccruedDebt(parsed);
        }
      } catch {
        // fallback
      }
    }
    return createEmptyDebtInfo();
  });

  // Multiplayer Hook Integration
  const multiplayer = useMultiplayer(playerName, bankroll, (payout) => {
    handleUpdateBankroll(payout);
  });

  // Save player name updates
  useEffect(() => {
    localStorage.setItem('casino_player_name', playerName);
  }, [playerName]);

  // Save bankroll updates
  useEffect(() => {
    localStorage.setItem('casino_bankroll', bankroll.toString());
  }, [bankroll]);

  // Save stats updates
  useEffect(() => {
    localStorage.setItem('casino_stats', JSON.stringify(stats));
  }, [stats]);

  // Save game history updates
  useEffect(() => {
    localStorage.setItem('casino_game_history', JSON.stringify(gameHistory));
  }, [gameHistory]);

  // Save vault debt updates
  useEffect(() => {
    localStorage.setItem('casino_vault_debt', JSON.stringify(debtInfo));
  }, [debtInfo]);

  // Periodically check and accrue daily interest
  useEffect(() => {
    const interval = setInterval(() => {
      setDebtInfo(prev => calculateAccruedDebt(prev));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleUpdateBankroll = (delta: number) => {
    setBankroll(prev => Math.max(0, prev + delta));
  };

  const handleSetBankroll = (newAmount: number) => {
    setBankroll(Math.max(0, newAmount));
  };

  const handleBorrowFromVault = (amount: number) => {
    setDebtInfo(prev => borrowFromVault(prev, amount));
    setBankroll(prev => prev + amount);
  };

  const handleRepayDebt = (amount: number) => {
    setDebtInfo(prev => {
      const { updatedDebt, actualRepaid } = repayDebt(prev, amount);
      setBankroll(b => Math.max(0, b - actualRepaid));
      return updatedDebt;
    });
  };

  const handleSimulateDay = () => {
    setDebtInfo(prev => simulateAddDays(prev, 1));
  };

  const handleResetDebt = () => {
    const forgiven: VaultDebtInfo = {
      ...createEmptyDebtInfo(),
      debtForgivenByPatron: true,
      forgivenAt: Date.now(),
    };
    setDebtInfo(forgiven);
    localStorage.setItem('casino_vault_debt', JSON.stringify(forgiven));
  };

  const handleReloadBankroll = () => {
    // Opens the VIP Vault modal so user can choose manual amount, borrow or see authorization
    setIsVaultOpen(true);
  };

  const handleUpdatePlayerName = (newName: string) => {
    const clean = newName.trim();
    if (clean) {
      setPlayerName(clean);
    }
  };

  const handleSwitchToPasha = () => {
    setPlayerName('PasHa');
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleRecordGameResult = (bet: number, won: number, game: 'blackjack' | 'poker' | 'slot' | 'roulette' | 'baccarat') => {
    const netWin = won - bet;
    const isWin = netWin > 0;

    // Record granular history event with current timestamp
    const newEntry: GameHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      game,
      bet,
      won,
      netWin,
    };
    setGameHistory(prev => [newEntry, ...prev.slice(0, 499)]);

    setStats(prev => {
      return {
        ...prev,
        totalBets: prev.totalBets + bet,
        totalWon: prev.totalWon + won,
        gamesPlayed: prev.gamesPlayed + 1,
        bestWin: Math.max(prev.bestWin, netWin),
        blackjackWins: game === 'blackjack' && isWin ? prev.blackjackWins + 1 : prev.blackjackWins,
        pokerWins: game === 'poker' && isWin ? prev.pokerWins + 1 : prev.pokerWins,
        slotWins: game === 'slot' && isWin ? prev.slotWins + 1 : prev.slotWins,
        rouletteWins: game === 'roulette' && isWin ? (prev.rouletteWins || 0) + 1 : (prev.rouletteWins || 0),
        baccaratWins: game === 'baccarat' && isWin ? (prev.baccaratWins || 0) + 1 : (prev.baccaratWins || 0),
      };
    });
  };

  const handleResetStats = () => {
    // Only authorized for PasHa
    if (!isVipManager(playerName)) {
      return;
    }
    sound.playChip();
    const cleanStats: UserStats = {
      totalBets: 0,
      totalWon: 0,
      gamesPlayed: 0,
      bestWin: 0,
      blackjackWins: 0,
      pokerWins: 0,
      slotWins: 0,
      rouletteWins: 0,
    };
    setStats(cleanStats);
    setGameHistory([]);
    localStorage.setItem('casino_stats', JSON.stringify(cleanStats));
    localStorage.setItem('casino_game_history', JSON.stringify([]));
  };

  return (
    <div className="min-h-screen bg-[#070a0d] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top VIP Navigation Bar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        bankroll={bankroll}
        onReloadBankroll={handleReloadBankroll}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        playerName={playerName}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        debtInfo={debtInfo}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col items-center">
        {currentView === 'lobby' && (
          <Lobby
            onSelectGame={setCurrentView}
            bankroll={bankroll}
            onReloadBankroll={handleReloadBankroll}
            onOpenVault={() => setIsVaultOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            playerName={playerName}
            stats={stats}
            history={gameHistory}
            onResetStats={handleResetStats}
            debtInfo={debtInfo}
          />
        )}

        {currentView === 'blackjack' && (
          <BlackjackGame
            bankroll={bankroll}
            onUpdateBankroll={handleUpdateBankroll}
            onRecordGameResult={handleRecordGameResult}
            onSwitchToMultiplayer={() => {
              setCurrentView('multiplayer');
              multiplayer.joinTable('bj-vip-1');
            }}
          />
        )}

        {currentView === 'poker' && (
          <PokerGame
            bankroll={bankroll}
            onUpdateBankroll={handleUpdateBankroll}
            onRecordGameResult={handleRecordGameResult}
            onSwitchToMultiplayer={() => {
              setCurrentView('multiplayer');
              multiplayer.joinTable('poker-vip-1');
            }}
          />
        )}

        {currentView === 'slot' && (
          <SlotGame
            bankroll={bankroll}
            onUpdateBankroll={handleUpdateBankroll}
            onRecordGameResult={handleRecordGameResult}
          />
        )}

        {currentView === 'roulette' && (
          <RouletteGame
            bankroll={bankroll}
            onUpdateBankroll={handleUpdateBankroll}
            onRecordGameResult={handleRecordGameResult}
          />
        )}

        {currentView === 'baccarat' && (
          <BaccaratGame
            bankroll={bankroll}
            onUpdateBankroll={handleUpdateBankroll}
            onRecordGameResult={handleRecordGameResult}
            playerName={playerName}
            onOpenVault={() => setIsVaultOpen(true)}
          />
        )}

        {currentView === 'multiplayer' && (
          multiplayer.currentTable ? (
            <MultiplayerTable
              tableState={multiplayer.currentTable}
              playerId={multiplayer.playerId}
              playerName={playerName}
              bankroll={bankroll}
              chatMessages={multiplayer.chatMessages}
              errorNotice={multiplayer.errorNotice}
              onSitDown={multiplayer.sitDown}
              onStandUp={multiplayer.standUp}
              onPlaceBet={(amount) => {
                // Deduct from bankroll when placing bet
                const currentBet = multiplayer.mySeat ? multiplayer.mySeat.bet : 0;
                const diff = amount - currentBet;
                if (diff <= bankroll) {
                  handleUpdateBankroll(-diff);
                  multiplayer.placeBet(amount);
                }
              }}
              onClearBet={() => {
                if (multiplayer.mySeat && multiplayer.mySeat.bet > 0) {
                  handleUpdateBankroll(multiplayer.mySeat.bet);
                  multiplayer.clearBet();
                }
              }}
              onStartDeal={multiplayer.startDeal}
              onHit={multiplayer.hit}
              onStand={multiplayer.stand}
              onDouble={() => {
                if (multiplayer.mySeat && bankroll >= multiplayer.mySeat.bet) {
                  handleUpdateBankroll(-multiplayer.mySeat.bet);
                  multiplayer.doubleDown();
                }
              }}
              onPokerToggleHold={multiplayer.pokerToggleHold}
              onPokerDraw={multiplayer.pokerDraw}
              onSendChat={multiplayer.sendChat}
              onLeaveTable={multiplayer.leaveTable}
            />
          ) : (
            <MultiplayerLobby
              tables={multiplayer.tableList}
              playerName={playerName}
              bankroll={bankroll}
              onJoinTable={multiplayer.joinTable}
              onRefresh={multiplayer.refreshTableList}
            />
          )
        )}
      </main>

      {/* VIP Vault Management Modal (Manual Amount Selection & PasHa Authorization & Member Debt System) */}
      <VipVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        bankroll={bankroll}
        onUpdateBankroll={handleUpdateBankroll}
        onSetBankroll={handleSetBankroll}
        playerName={playerName}
        onSwitchToPasha={handleSwitchToPasha}
        onOpenProfile={() => setIsProfileOpen(true)}
        debtInfo={debtInfo}
        onBorrow={handleBorrowFromVault}
        onRepay={handleRepayDebt}
        onSimulateDay={handleSimulateDay}
        onResetDebt={handleResetDebt}
      />

      {/* Player Profile & Name Change Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        playerName={playerName}
        onUpdatePlayerName={handleUpdatePlayerName}
        onOpenVaultModal={() => setIsVaultOpen(true)}
        onResetStats={handleResetStats}
      />

      {/* Rules & Payout Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Subtle Footer Bar */}
      <footer className="w-full border-t border-amber-500/10 py-3 text-center text-xs text-slate-500">
        Grand Royale VIP Casino • Profesyonel Oyun Mekanikleri & Canlı Çok Oyunculu Masa Deneyimi
      </footer>
    </div>
  );
}


