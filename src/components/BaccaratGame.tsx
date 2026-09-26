import React, { useState, useEffect } from 'react';
import { BaccaratBet, BaccaratBetType, DiceHistoryItem, DiceRollResult } from '../types';
import { ManualDiceThrower } from './ManualDiceThrower';
import { BaccaratTable } from './BaccaratTable';
import { ChipSelector, CHIP_DENOMINATIONS } from './ChipSelector';
import { CasinoAmountInput } from './CasinoNumpad';
import {
  BACCARAT_BET_CONFIG,
  evaluateBaccaratAndDiceRoll,
  BaccaratCalculationResult,
  getDiceCallout,
} from '../utils/baccaratRules';
import { sound } from '../utils/audio';
import { Real3DDice, getFaceRotationsForValue } from './Real3DDice';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  History,
  TrendingUp,
  X,
  BookOpen,
  Volume2,
  Hand,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface BaccaratGameProps {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onRecordGameResult: (bet: number, won: number, game: 'blackjack' | 'poker' | 'slot' | 'roulette' | 'baccarat') => void;
  playerName: string;
  onOpenVault: () => void;
}

export const BaccaratGame: React.FC<BaccaratGameProps> = ({
  bankroll,
  onUpdateBankroll,
  onRecordGameResult,
  playerName,
  onOpenVault,
}) => {
  const [bets, setBets] = useState<BaccaratBet[]>([]);
  const [previousBets, setPreviousBets] = useState<BaccaratBet[]>([]);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [currentPoint, setCurrentPoint] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<BaccaratCalculationResult | null>(null);
  const [lastRoll, setLastRoll] = useState<{ die1: number; die2: number; total: number; callout: string } | null>(null);
  const [showCustomAmountModal, setShowCustomAmountModal] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  // Roll history (Persisted in localStorage)
  const [history, setHistory] = useState<DiceHistoryItem[]>(() => {
    const saved = localStorage.getItem('casino_baccarat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      { id: 'h-1', die1: 3, die2: 4, total: 7, point: null, timestamp: Date.now() - 300000, statusText: 'Doğal 7 (Natural)' },
      { id: 'h-2', die1: 5, die2: 6, total: 11, point: null, timestamp: Date.now() - 200000, statusText: 'Yo 11 (Kazanç)' },
      { id: 'h-3', die1: 4, die2: 4, total: 8, point: 8, timestamp: Date.now() - 100000, statusText: 'Sayı 8 (Point ON)' },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('casino_baccarat_history', JSON.stringify(history.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [history]);

  // Total current bet on the table
  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  // Handle placing a chip on a bet zone
  const handlePlaceBet = (type: BaccaratBetType) => {
    if (isRolling) return;

    if (bankroll < selectedChip) {
      sound.playLose();
      alert(`Yetersiz bakiye! Masaya koymak için en az $${selectedChip.toLocaleString('tr-TR')} gereklidir.`);
      return;
    }

    onUpdateBankroll(-selectedChip);

    setBets((prev) => {
      const existingIdx = prev.findIndex((b) => b.type === type);
      const config = BACCARAT_BET_CONFIG[type];
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: updated[existingIdx].amount + selectedChip,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type,
          amount: selectedChip,
          label: config.label,
          payoutMultiplier: config.multiplier,
        },
      ];
    });
  };

  // Handle removing a chip (right-click or context menu)
  const handleRemoveBet = (type: BaccaratBetType) => {
    if (isRolling) return;
    const existing = bets.find((b) => b.type === type);
    if (!existing) return;

    const refund = Math.min(selectedChip, existing.amount);
    onUpdateBankroll(refund);

    setBets((prev) => {
      return prev
        .map((b) => {
          if (b.type === type) {
            return { ...b, amount: b.amount - refund };
          }
          return b;
        })
        .filter((b) => b.amount > 0);
    });
  };

  // Clear all bets
  const handleClearBets = () => {
    if (isRolling || bets.length === 0) return;
    sound.playChip();
    onUpdateBankroll(totalBetAmount);
    setPreviousBets(bets);
    setBets([]);
  };

  // Rebet previous bets
  const handleRebet = () => {
    if (isRolling || previousBets.length === 0) return;
    const prevTotal = previousBets.reduce((sum, b) => sum + b.amount, 0);
    if (bankroll < prevTotal) {
      alert(`Önceki bahsi tekrarlamak için yetersiz bakiye! ($${prevTotal.toLocaleString('tr-TR')} gerekli)`);
      return;
    }
    sound.playChip();
    onUpdateBankroll(-prevTotal);
    setBets(previousBets);
  };

  // Double active bets
  const handleDoubleBets = () => {
    if (isRolling || bets.length === 0) return;
    if (bankroll < totalBetAmount) {
      alert(`Bahisleri ikiye katlamak için yetersiz bakiye! ($${totalBetAmount.toLocaleString('tr-TR')} gerekli)`);
      return;
    }
    sound.playChip();
    onUpdateBankroll(-totalBetAmount);
    setBets((prev) => prev.map((b) => ({ ...b, amount: b.amount * 2 })));
  };

  // Triggered when ManualDiceThrower settles the dice
  const handleRollComplete = (die1: number, die2: number) => {
    const total = die1 + die2;
    const callout = getDiceCallout(die1, die2);

    setLastRoll({ die1, die2, total, callout });

    // Evaluate payouts
    const calc = evaluateBaccaratAndDiceRoll(bets, die1, die2, currentPoint);
    setOutcome(calc);
    setCurrentPoint(calc.newPoint);

    // If money won
    if (calc.totalWon > 0) {
      onUpdateBankroll(calc.totalWon);
      sound.playWin();
    } else if (totalBetAmount > 0) {
      sound.playLose();
    }

    // Record stats
    if (totalBetAmount > 0) {
      onRecordGameResult(totalBetAmount, calc.totalWon, 'baccarat');
    }

    // Save previous bets for rebet
    if (bets.length > 0) {
      setPreviousBets(bets);
    }

    // Retained bets stay on table (e.g. Pass Line when point active)
    setBets(calc.retainedBets);

    // Add to history
    const historyItem: DiceHistoryItem = {
      id: `hist-${Date.now()}`,
      die1,
      die2,
      total,
      point: calc.newPoint,
      timestamp: Date.now(),
      statusText: calc.announcement,
    };
    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
  };

  // Frequency statistics for 2-12
  const statsMap: Record<number, number> = {};
  for (let i = 2; i <= 12; i++) statsMap[i] = 0;
  history.forEach((h) => {
    statsMap[h.total] = (statsMap[h.total] || 0) + 1;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Game Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-amber-500/40 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-amber-600 to-amber-900 border-2 border-amber-400/50 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                CANLI ZAR ODASI
              </span>
              <span className="text-xs text-amber-400 font-serif-luxury font-bold">
                Masa: VIP Grand Royale
              </span>
            </div>
            <h1 className="font-serif-luxury font-black text-xl sm:text-2xl text-slate-100 tracking-wide">
              BACARAT & CASINO BARBUT ZAR MASASI
            </h1>
          </div>
        </div>

        {/* Top Controls: Rules, Stats & Bankroll */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Zar Kuralları</span>
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              showStats
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Zar İstatistikleri</span>
          </button>

          <div className="bg-slate-950 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2">
            <span className="text-xs text-slate-400">Masadaki Bahis:</span>
            <span className="font-serif-luxury font-black text-amber-300 text-sm">
              ${totalBetAmount.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      {/* FREQUENCY STATISTICS DRAWER */}
      {showStats && (
        <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif-luxury font-bold text-sm text-amber-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Zar Frekans Dağılımı (Son {history.length} Atış)
            </span>
            <button
              onClick={() => setShowStats(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-11 gap-1.5 text-center">
            {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => {
              const count = statsMap[num] || 0;
              const pct = history.length > 0 ? Math.round((count / history.length) * 100) : 0;
              return (
                <div key={num} className="flex flex-col items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">%{pct}</span>
                  <div className="w-full bg-slate-800 rounded-full h-12 flex items-end justify-center p-0.5 my-1">
                    <div
                      className={`w-full rounded-full transition-all duration-300 ${
                        num === 7 ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                      style={{ height: `${Math.max(10, Math.min(100, pct * 3))}%` }}
                    />
                  </div>
                  <span className={`font-black text-xs ${num === 7 ? 'text-red-400' : 'text-amber-200'}`}>
                    {num}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">{count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECENT ROLL TICKER */}
      <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/30 px-4 py-2.5 rounded-2xl overflow-x-auto shadow-inner">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold flex-shrink-0">
          <History className="w-3.5 h-3.5" />
          <span>Son Zarlar:</span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
          {history.slice(0, 10).map((h) => {
            const rot1 = getFaceRotationsForValue(h.die1);
            const rot2 = getFaceRotationsForValue(h.die2);
            return (
              <div
                key={h.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm border ${
                  h.total === 7
                    ? 'bg-red-950/90 border-red-500/60 text-red-300'
                    : h.total === 11 || h.die1 === h.die2
                    ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Real3DDice
                    value={h.die1}
                    size={18}
                    rotX={rot1.rotX}
                    rotY={rot1.rotY}
                    rotZ={rot1.rotZ}
                    showShadow={false}
                  />
                  <Real3DDice
                    value={h.die2}
                    size={18}
                    rotX={rot2.rotX}
                    rotY={rot2.rotY}
                    rotZ={rot2.rotZ}
                    showShadow={false}
                  />
                </div>
                <span className="font-serif-luxury font-black text-sm text-amber-300">= {h.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE ANNOUNCEMENT / WIN BANNER */}
      {outcome && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl transition-all ${
            outcome.totalWon > 0
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-slate-900/90 border-amber-500/40 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {lastRoll ? (
              <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-amber-500/30 flex-shrink-0 shadow">
                <Real3DDice
                  value={lastRoll.die1}
                  size={24}
                  rotX={getFaceRotationsForValue(lastRoll.die1).rotX}
                  rotY={getFaceRotationsForValue(lastRoll.die1).rotY}
                  rotZ={0}
                  showShadow={false}
                />
                <Real3DDice
                  value={lastRoll.die2}
                  size={24}
                  rotX={getFaceRotationsForValue(lastRoll.die2).rotX}
                  rotY={getFaceRotationsForValue(lastRoll.die2).rotY}
                  rotZ={0}
                  showShadow={false}
                />
              </div>
            ) : outcome.totalWon > 0 ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 flex-shrink-0">
                <Trophy className="w-5 h-5 animate-bounce" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-luxury font-black text-sm sm:text-base text-amber-300">
                  {lastRoll?.callout}
                </span>
                {currentPoint && (
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    Point: {currentPoint}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{outcome.announcement}</p>
            </div>
          </div>

          {outcome.totalWon > 0 && (
            <div className="flex flex-col text-right sm:items-end">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Toplam Kazanç</span>
              <span className="font-serif-luxury font-black text-xl text-emerald-300">
                +${outcome.totalWon.toLocaleString('tr-TR')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 1. MANUEL ELLE ZAR ATMA FIRLATMA ALANI (MANUAL DICE THROWER) */}
      <ManualDiceThrower
        onRollComplete={handleRollComplete}
        isRolling={isRolling}
        setIsRolling={setIsRolling}
        currentPoint={currentPoint}
      />

      {/* 2. CHIP SELECTOR & BET ACTION CONTROLS */}
      <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Chip Selection Bar */}
          <ChipSelector
            selectedChip={selectedChip}
            onSelectChip={setSelectedChip}
            currentBet={totalBetAmount}
            bankroll={bankroll}
            onAddBet={(_amount) => {
              handlePlaceBet('pass_line');
            }}
            onClearBet={handleClearBets}
            onAllIn={() => {
              if (bankroll > 0 && !isRolling) {
                const remaining = bankroll;
                onUpdateBankroll(-remaining);
                const config = BACCARAT_BET_CONFIG['pass_line'];
                setBets((prev) => [
                  ...prev,
                  {
                    id: `bet-${Date.now()}`,
                    type: 'pass_line',
                    amount: remaining,
                    label: config.label,
                    payoutMultiplier: config.multiplier,
                  },
                ]);
              }
            }}
          />

          {/* Quick Bet Modifiers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleClearBets}
              disabled={isRolling || bets.length === 0}
              className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bahisleri Temizle</span>
            </button>

            <button
              onClick={handleRebet}
              disabled={isRolling || previousBets.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Aynı Bahsi Koy</span>
            </button>

            <button
              onClick={handleDoubleBets}
              disabled={isRolling || bets.length === 0}
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Bahisleri 2x Katla</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. GERÇEK BACCARAT & BARBUT MASASI (BETTING FELT) */}
      <BaccaratTable
        bets={bets}
        onPlaceBet={handlePlaceBet}
        onRemoveBet={handleRemoveBet}
        selectedChip={selectedChip}
        currentPoint={currentPoint}
        disabled={isRolling}
      />

      {/* RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury font-black text-lg text-amber-200">
                  BACARAT & BARBUT ZAR ATMA KURALLARI
                </h3>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
                <h4 className="font-serif-luxury font-bold text-amber-300 uppercase mb-1">
                  1. Manuel Elle Zar Atma
                </h4>
                <p>
                  Masadaki yeşil çuha üzerinde farenizi veya parmağınızı zarlara basılı tutarak
                  istediğiniz hız ve açıyla ileri doğru fırlatın. Zarlar elmas kauçuk kenara çarparak
                  gerçek fizik kurallarıyla yuvarlanır ve durur.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-serif-luxury font-bold text-amber-300 uppercase">
                  2. Pas Hattı (Pass Line) ve Sayı Kuralları
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>İlk Atış (Come-out):</strong> 7 veya 11 gelirse doğrudan 1:1 KAZANIR.</li>
                  <li><strong>Craps:</strong> 2, 3 veya 12 gelirse Pas Hattı KAYBEDER.</li>
                  <li><strong>Sayı (Point):</strong> 4, 5, 6, 8, 9 veya 10 gelirse masa sayısı (Point) olur.</li>
                  <li><strong>Sayı Turu:</strong> 7 gelmeden önce aynı sayı tekrar atılırsa 1:1 KAZANIR. 7 gelirse (Seven Out) kaybeder.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-serif-luxury font-bold text-amber-300 uppercase">
                  3. Baccarat Zar Düellosu (Punto vs Banco)
                </h4>
                <p>
                  1. Zar Oyuncuyu (Punto), 2. Zar Kasayı (Banco) temsil eder. Hangi zar daha büyük gelirse o taraf 1:1 kazanır.
                  İki zar eşit gelirse (Çift Zar) <strong>Beraberlik (Tie) 8:1</strong> devasa ödeme yapar!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-serif-luxury font-bold text-amber-300 uppercase">
                  4. Barbut Çiftleri & Yüksek Çarpanlar
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Hep Yek (1-1):</strong> 30:1 Ödeme</li>
                  <li><strong>Düşeş (6-6):</strong> 30:1 Ödeme</li>
                  <li><strong>Yo (11):</strong> 15:1 Ödeme</li>
                  <li><strong>Hardways (2-2, 3-3, 4-4, 5-5):</strong> 9:1 Ödeme</li>
                  <li><strong>Kırmızı 7 (Any Seven):</strong> 4:1 Ödeme</li>
                  <li><strong>Alan Bahsi (Field 2, 3, 4, 9, 10, 11, 12):</strong> 2 için 2:1, 12 için 3:1 öder!</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRules(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif-luxury font-black text-xs uppercase"
              >
                Anladım, Masaya Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
