import React, { useState, useEffect } from 'react';
import { RouletteBet, RouletteHistoryItem } from '../types';
import { RouletteWheel } from './RouletteWheel';
import { RouletteTable } from './RouletteTable';
import { ChipSelector, CHIP_DENOMINATIONS } from './ChipSelector';
import { CasinoAmountInput } from './CasinoNumpad';
import {
  ROULETTE_SEQUENCE,
  getNumberColor,
  calculateRoulettePayout,
  RoulettePayoutResult,
} from '../utils/rouletteRules';
import { sound } from '../utils/audio';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  History,
  Zap,
  Flame,
  Snowflake,
  TrendingUp,
  X,
  Volume2,
} from 'lucide-react';

interface RouletteGameProps {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onRecordGameResult: (bet: number, won: number, game: 'blackjack' | 'poker' | 'slot' | 'roulette') => void;
}

export const RouletteGame: React.FC<RouletteGameProps> = ({
  bankroll,
  onUpdateBankroll,
  onRecordGameResult,
}) => {
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [previousBets, setPreviousBets] = useState<RouletteBet[]>([]);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<RoulettePayoutResult | null>(null);
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  // History of winning numbers (Persisted in localStorage)
  const [history, setHistory] = useState<RouletteHistoryItem[]>(() => {
    const saved = localStorage.getItem('casino_roulette_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default initial seed numbers
    return [
      { id: 'h-1', number: 26, color: 'black', timestamp: Date.now() - 600000 },
      { id: 'h-2', number: 32, color: 'red', timestamp: Date.now() - 500000 },
      { id: 'h-3', number: 15, color: 'black', timestamp: Date.now() - 400000 },
      { id: 'h-4', number: 0, color: 'green', timestamp: Date.now() - 300000 },
      { id: 'h-5', number: 7, color: 'red', timestamp: Date.now() - 200000 },
      { id: 'h-6', number: 18, color: 'red', timestamp: Date.now() - 100000 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('casino_roulette_history', JSON.stringify(history.slice(0, 30)));
  }, [history]);

  const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  // Add / Place a bet on the board
  const handlePlaceBet = (
    type: RouletteBet['type'],
    numbers: number[],
    label: string,
    payoutMultiplier: number
  ) => {
    if (isSpinning) return;
    if (bankroll < selectedChip) {
      sound.playLose();
      return;
    }

    // Deduct chip from bankroll
    onUpdateBankroll(-selectedChip);

    setBets((prev) => {
      // Check if matching bet already exists
      const sortedNew = [...numbers].sort().join(',');
      const existingIdx = prev.findIndex(
        (b) => b.type === type && [...b.numbers].sort().join(',') === sortedNew
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: updated[existingIdx].amount + selectedChip,
        };
        return updated;
      } else {
        const newBet: RouletteBet = {
          id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type,
          amount: selectedChip,
          numbers,
          label,
          payoutMultiplier,
        };
        return [...prev, newBet];
      }
    });

    setOutcome(null);
  };

  // Clear all bets
  const handleClearBets = () => {
    if (isSpinning || bets.length === 0) return;
    sound.playChip();
    onUpdateBankroll(totalBetAmount);
    setBets([]);
  };

  // Undo last bet
  const handleUndoLastBet = () => {
    if (isSpinning || bets.length === 0) return;
    sound.playChip();
    const lastBet = bets[bets.length - 1];
    onUpdateBankroll(lastBet.amount);
    setBets((prev) => prev.slice(0, prev.length - 1));
  };

  // Double all active bets
  const handleDoubleBets = () => {
    if (isSpinning || bets.length === 0) return;
    if (bankroll < totalBetAmount) return; // Not enough balance
    sound.playChip();
    onUpdateBankroll(-totalBetAmount);
    setBets((prev) =>
      prev.map((b) => ({
        ...b,
        amount: b.amount * 2,
      }))
    );
  };

  // Rebet previous round's bets
  const handleRebet = () => {
    if (isSpinning || previousBets.length === 0) return;
    const prevTotal = previousBets.reduce((sum, b) => sum + b.amount, 0);
    if (bankroll < prevTotal) return;

    sound.playChip();
    // If any active bets exist, refund them first
    if (totalBetAmount > 0) {
      onUpdateBankroll(totalBetAmount);
    }
    onUpdateBankroll(-prevTotal);
    setBets([...previousBets]);
    setOutcome(null);
  };

  // Spin the wheel!
  const handleSpin = () => {
    if (isSpinning || bets.length === 0) return;

    // Pick random European pocket (0 to 36)
    const targetNum = Math.floor(Math.random() * 37);

    // Save previous bets for rebet
    setPreviousBets([...bets]);
    setWinningNumber(targetNum);
    setIsSpinning(true);
    setOutcome(null);
  };

  // Callback when wheel animation concludes
  const handleSpinComplete = () => {
    setIsSpinning(false);
    if (winningNumber === null) return;

    // Calculate payouts
    const res = calculateRoulettePayout(bets, winningNumber);
    setOutcome(res);

    // Credit winnings to player
    if (res.totalWon > 0) {
      onUpdateBankroll(res.totalWon);
      if (res.netWin > res.totalStaked * 5) {
        sound.playJackpot();
      } else {
        sound.playWin();
      }
    } else {
      sound.playLose();
    }

    // Record stats
    onRecordGameResult(res.totalStaked, res.totalWon, 'roulette');

    // Add to history
    const historyEntry: RouletteHistoryItem = {
      id: `h-${Date.now()}`,
      number: winningNumber,
      color: getNumberColor(winningNumber),
      timestamp: Date.now(),
    };
    setHistory((prev) => [historyEntry, ...prev.slice(0, 39)]);

    // Clear board bets for next round
    setBets([]);
  };

  // Calculate statistics (Red%, Black%, Green%, Hot/Cold numbers)
  const redCount = history.filter((h) => h.color === 'red').length;
  const blackCount = history.filter((h) => h.color === 'black').length;
  const greenCount = history.filter((h) => h.color === 'green').length;
  const totalHistory = Math.max(1, history.length);

  const numFrequency: Record<number, number> = {};
  history.forEach((h) => {
    numFrequency[h.number] = (numFrequency[h.number] || 0) + 1;
  });

  const sortedNumbers = Object.entries(numFrequency)
    .map(([n, count]) => ({ num: parseInt(n, 10), count }))
    .sort((a, b) => b.count - a.count);

  const hotNumbers = sortedNumbers.slice(0, 4).map((item) => item.num);
  const coldNumbers = ROULETTE_SEQUENCE.filter((n) => !sortedNumbers.find((sn) => sn.num === n)).slice(0, 4);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 pb-12">
      {/* HEADER BAR & STATUS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-800 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl font-bold">
              🎡
            </div>
          </div>
          <div>
            <h2 className="font-serif-luxury font-black text-lg sm:text-xl text-amber-200 tracking-wide flex items-center gap-2">
              Avrupa Ruleti
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                37 Sayı (Tek 0)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ahşap & Altın Detaylı Çark • Gerçek Fiziksel Top Hareketi
            </p>
          </div>
        </div>

        {/* Action Toggles: Stats & Turbo Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setShowStats(!showStats);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              showStats
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-900 border-amber-500/30 text-amber-300 hover:border-amber-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>İstatistikler & Sıcak Sayılar</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setIsTurbo(!isTurbo);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              isTurbo
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-black shadow'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-300'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isTurbo ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>{isTurbo ? 'Hızlı Çevirme (Turbo)' : 'Normal Hız'}</span>
          </button>
        </div>
      </div>

      {/* STATISTICS PANEL (Collapsible) */}
      {showStats && (
        <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-serif-luxury font-bold text-sm text-amber-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Rulet İstatistik & Dağılım Analizi
            </h4>
            <button
              onClick={() => setShowStats(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Red / Black / Green ratio bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-slate-400 font-semibold">Renk Dağılımı</div>
              <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${(redCount / totalHistory) * 100}%` }}
                  className="bg-red-600 h-full transition-all"
                  title={`Kırmızı: %${Math.round((redCount / totalHistory) * 100)}`}
                />
                <div
                  style={{ width: `${(greenCount / totalHistory) * 100}%` }}
                  className="bg-emerald-600 h-full transition-all"
                  title={`Yeşil: %${Math.round((greenCount / totalHistory) * 100)}`}
                />
                <div
                  style={{ width: `${(blackCount / totalHistory) * 100}%` }}
                  className="bg-slate-700 h-full transition-all"
                  title={`Siyah: %${Math.round((blackCount / totalHistory) * 100)}`}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-red-400">Kırmızı: %{Math.round((redCount / totalHistory) * 100)}</span>
                <span className="text-emerald-400">0 Yeşil: {greenCount}</span>
                <span className="text-slate-300">Siyah: %{Math.round((blackCount / totalHistory) * 100)}</span>
              </div>
            </div>

            {/* Hot Numbers */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-amber-300 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Sıcak Sayılar (En Çok Gelenler)
              </div>
              <div className="flex items-center gap-2">
                {hotNumbers.length > 0 ? (
                  hotNumbers.map((num) => (
                    <span
                      key={num}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow ${
                        getNumberColor(num) === 'red'
                          ? 'bg-red-600'
                          : getNumberColor(num) === 'green'
                          ? 'bg-emerald-600'
                          : 'bg-slate-800'
                      }`}
                    >
                      {num}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">Henüz yeterli veri yok</span>
                )}
              </div>
            </div>

            {/* Cold Numbers */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-sky-300 font-semibold flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                Soğuk Sayılar (Beklenenler)
              </div>
              <div className="flex items-center gap-2">
                {coldNumbers.map((num) => (
                  <span
                    key={num}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow ${
                      getNumberColor(num) === 'red'
                        ? 'bg-red-600'
                        : getNumberColor(num) === 'green'
                        ? 'bg-emerald-600'
                        : 'bg-slate-800'
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECENT NUMBERS SCROLLER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-3 bg-slate-950/90 rounded-xl border border-amber-500/20 scrollbar-none">
        <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400/80 whitespace-nowrap mr-1">
          Son Numaralar:
        </span>
        <div className="flex items-center gap-1.5">
          {history.slice(0, 14).map((item, idx) => (
            <span
              key={item.id}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow transition-all ${
                idx === 0 ? 'ring-2 ring-amber-400 scale-110 font-black' : 'opacity-85'
              } ${
                item.color === 'red'
                  ? 'bg-red-600'
                  : item.color === 'green'
                  ? 'bg-emerald-600'
                  : 'bg-slate-900 border border-slate-700'
              }`}
            >
              {item.number}
            </span>
          ))}
        </div>
      </div>

      {/* MAIN ROULETTE STAGE: WHEEL (LEFT/TOP) & STATUS BOARD (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* WHEEL DISPLAY (5 Cols on large screen) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl wood-rim-mahogany border-2 border-amber-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <RouletteWheel
            isSpinning={isSpinning}
            winningNumber={winningNumber}
            onSpinComplete={handleSpinComplete}
            spinDuration={isTurbo ? 2200 : 4800}
          />
        </div>

        {/* OUTCOME & ACTIVE BET SUMMARY (7 Cols on large screen) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* WIN / RESULT BANNER */}
          {outcome ? (
            <div
              className={`p-5 rounded-2xl border-2 shadow-2xl flex flex-col gap-3 animate-in zoom-in-95 duration-200 ${
                outcome.totalWon > 0
                  ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {outcome.totalWon > 0 ? '🎉' : '❌'}
                  </span>
                  <div>
                    <h3 className="font-serif-luxury font-black text-lg sm:text-xl text-white">
                      {outcome.totalWon > 0
                        ? `KAZANDINIZ! +$${outcome.totalWon.toLocaleString('tr-TR')}`
                        : 'Bu Tur Kazanç Yok'}
                    </h3>
                    <div className="text-xs text-slate-300">
                      Gelen Sayı: <strong className="text-amber-300">{winningNumber}</strong> (
                      {getNumberColor(winningNumber!) === 'red'
                        ? 'Kırmızı'
                        : getNumberColor(winningNumber!) === 'green'
                        ? 'Yeşil'
                        : 'Siyah'}
                      )
                    </div>
                  </div>
                </div>

                {outcome.totalWon > 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-serif-luxury font-black text-sm shadow">
                    Net: +${outcome.netWin.toLocaleString('tr-TR')}
                  </span>
                )}
              </div>

              {/* Winning bets list */}
              {outcome.winningBets.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
                  {outcome.winningBets.map((wb, wIdx) => (
                    <span
                      key={wIdx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 text-xs font-bold"
                    >
                      {wb.label} ({wb.multiplier}x): +${wb.winAmount.toLocaleString('tr-TR')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20 shadow flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Masa Durumu
                </div>
                <div className="font-serif-luxury font-black text-lg text-slate-100">
                  {isSpinning ? (
                    <span className="text-amber-300 animate-pulse flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Top Çarkta Dönüyor...
                    </span>
                  ) : bets.length > 0 ? (
                    <span>Bahisler Açık • Çarkı Çevirebilirsiniz</span>
                  ) : (
                    <span className="text-slate-400">Lütfen tablodan bahsinizi seçin</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Toplam Bahis</span>
                <span className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-300">
                  ${totalBetAmount.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          )}

          {/* ACTIVE BETS LIST (Pills) */}
          {bets.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>Aktif Bahisler ({bets.length})</span>
                <span>${totalBetAmount.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bets.map((b) => (
                  <span
                    key={b.id}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>{b.label}</span>
                    <strong className="text-amber-400">${b.amount.toLocaleString('tr-TR')}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* MAIN ACTION BUTTONS: SPIN, CLEAR, REBET, DOUBLE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* CLEAR BETS */}
            <button
              onClick={handleClearBets}
              disabled={isSpinning || bets.length === 0}
              className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
            >
              <span>Temizle</span>
            </button>

            {/* UNDO */}
            <button
              onClick={handleUndoLastBet}
              disabled={isSpinning || bets.length === 0}
              className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Geri Al</span>
            </button>

            {/* REBET / DOUBLE */}
            {bets.length > 0 ? (
              <button
                onClick={handleDoubleBets}
                disabled={isSpinning || bankroll < totalBetAmount}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                2x Katla
              </button>
            ) : (
              <button
                onClick={handleRebet}
                disabled={isSpinning || previousBets.length === 0}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                Tekrar Bahis
              </button>
            )}

            {/* SPIN BUTTON */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || bets.length === 0}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isSpinning ? 'Dönüyor...' : 'ÇEVİR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ROULETTE FELT BETTING TABLE WITH MAHOGANY RIM & LEATHER ARMREST */}
      <div className="w-full wood-rim-mahogany rounded-[32px] p-2 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
        <div className="w-full leather-armrest rounded-[24px] p-2 sm:p-3">
          <div className="w-full casino-felt rounded-[18px] p-2 sm:p-4 shadow-inner overflow-hidden">
            <RouletteTable
              bets={bets}
              onPlaceBet={handlePlaceBet}
              winningNumber={winningNumber}
              disabled={isSpinning}
            />
          </div>
        </div>
      </div>

      {/* CHIP SELECTOR FOOTER WITH 3D CHIP VISUALS */}
      <div className="w-full bg-slate-950/95 border-2 border-amber-500/40 p-4 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-serif-luxury font-bold text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-amber-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span>3D Bahis Fişi Seçimi</span>
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <CasinoAmountInput
                id="roulette-custom-chip-input"
                value={selectedChip}
                onChange={(val) => {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0) setSelectedChip(num);
                }}
                onApply={(num) => {
                  if (num > 0) setSelectedChip(num);
                }}
                bankroll={bankroll}
                placeholder="Özel Fiş Tutarı"
                className="w-36 sm:w-44"
                title="Rulet Özel Fiş Tutarı"
                subtitle="Masaya koymak istediğiniz özel fiş miktarını tuşlayın"
              />
            </div>
          </div>
          <span className="text-slate-300">
            Kasa Bakiyesi: <strong className="text-amber-300 font-serif-luxury text-sm">${bankroll.toLocaleString('tr-TR')}</strong>
          </span>
        </div>

        <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap pt-1">
          {CHIP_DENOMINATIONS.map((chip) => {
            const isSelected = selectedChip === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => {
                  sound.playChip();
                  setSelectedChip(chip.value);
                }}
                className={`relative group rounded-full transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
                  isSelected ? 'scale-115 ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-950 z-10' : 'hover:scale-105'
                }`}
              >
                <div
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-serif-luxury font-black text-xs sm:text-sm text-white relative select-none"
                  style={{
                    backgroundColor: chip.color,
                    boxShadow: isSelected
                      ? '0 6px 14px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.7)'
                      : '0 4px 8px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.6)',
                    border: `3px dashed ${chip.border}`,
                  }}
                >
                  {/* Inner brass medallion */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-950/70 border border-amber-300/60 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-amber-200">
                    {chip.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
