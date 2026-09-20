import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SlotSymbolDef, Payline } from '../types';
import { SLOT_SYMBOLS, PAYLINES, generateReelStrip } from '../utils/slotConfig';
import { ChipSelector } from './ChipSelector';
import { sound } from '../utils/audio';
import { Sparkles, Trophy, Flame, Play, Square } from 'lucide-react';

const ITEM_HEIGHT = 104; // Mathematical exact pixel height per symbol row
const NUM_VISIBLE_ROWS = 3;
const VIEWPORT_HEIGHT = ITEM_HEIGHT * NUM_VISIBLE_ROWS; // 312px

interface SlotGameProps {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onRecordGameResult: (bet: number, won: number, game: 'slot') => void;
}

export const SlotGame: React.FC<SlotGameProps> = ({
  bankroll,
  onUpdateBankroll,
  onRecordGameResult,
}) => {
  const [betPerLine, setBetPerLine] = useState<number>(10);
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const activePaylinesCount = 5; // All 5 lines active for maximum excitement
  const totalBet = betPerLine * activePaylinesCount;

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [autoSpinCount, setAutoSpinCount] = useState<number>(0);

  // Each reel strip
  const [reelStrips] = useState<SlotSymbolDef[][]>(() => [
    generateReelStrip(),
    generateReelStrip(),
    generateReelStrip(),
  ]);

  // Exact integer landing indices for each reel [reel0, reel1, reel2]
  const [stopIndices, setStopIndices] = useState<[number, number, number]>([3, 5, 7]);
  const [reelTransitions, setReelTransitions] = useState<[string, string, string]>([
    'none',
    'none',
    'none',
  ]);

  // Winning results state
  const [winningPaylines, setWinningPaylines] = useState<{
    payline: Payline;
    symbol: SlotSymbolDef;
    multiplier: number;
    winAmount: number;
  }[]>([]);
  const [roundWinAmount, setRoundWinAmount] = useState<number>(0);
  const [winTitle, setWinTitle] = useState<string>('');

  const autoSpinRef = useRef<boolean>(false);
  autoSpinRef.current = isAutoSpin;

  // Sound ticking interval ref
  const tickIntervalRef = useRef<number | null>(null);

  // Start Spin Action
  const handleSpin = () => {
    if (isSpinning || totalBet <= 0 || totalBet > bankroll) return;

    sound.playChip();
    onUpdateBankroll(-totalBet);
    setIsSpinning(true);
    setWinningPaylines([]);
    setRoundWinAmount(0);
    setWinTitle('');

    // Generate random target stopping index for each reel
    // Minimum offset ~25 to ensure multiple complete rotations before landing
    const maxIdx = reelStrips[0].length - 4;
    const target0 = Math.floor(Math.random() * (maxIdx - 15)) + 12;
    const target1 = Math.floor(Math.random() * (maxIdx - 15)) + 12;
    const target2 = Math.floor(Math.random() * (maxIdx - 15)) + 12;

    // Start reel tick audio loop
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = window.setInterval(() => {
      sound.playReelTick();
    }, 90);

    // Trigger smooth CSS transitions with staggered timing for reels 1, 2, 3
    setReelTransitions([
      'transform 1.4s cubic-bezier(0.12, 0.8, 0.25, 1)',
      'transform 1.8s cubic-bezier(0.12, 0.8, 0.25, 1)',
      'transform 2.2s cubic-bezier(0.12, 0.8, 0.25, 1)',
    ]);
    setStopIndices([target0, target1, target2]);

    // Reel 0 Lock
    setTimeout(() => {
      sound.playReelStop();
    }, 1400);

    // Reel 1 Lock
    setTimeout(() => {
      sound.playReelStop();
    }, 1800);

    // Reel 2 Lock & Evaluation
    setTimeout(() => {
      sound.playReelStop();
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      evaluateSpinOutcome(target0, target1, target2);
    }, 2250);
  };

  // Evaluate the 3x3 slot matrix on the 5 paylines
  const evaluateSpinOutcome = (r0: number, r1: number, r2: number) => {
    // Visible 3x3 matrix: rows 0 (top), 1 (center), 2 (bottom)
    const matrix: SlotSymbolDef[][] = [
      [reelStrips[0][r0], reelStrips[0][r0 + 1], reelStrips[0][r0 + 2]], // Reel 0
      [reelStrips[1][r1], reelStrips[1][r1 + 1], reelStrips[1][r1 + 2]], // Reel 1
      [reelStrips[2][r2], reelStrips[2][r2 + 1], reelStrips[2][r2 + 2]], // Reel 2
    ];

    const wins: {
      payline: Payline;
      symbol: SlotSymbolDef;
      multiplier: number;
      winAmount: number;
    }[] = [];

    let totalPayout = 0;

    // Check each active payline
    PAYLINES.slice(0, activePaylinesCount).forEach((line) => {
      const sym0 = matrix[line.coords[0][0]][line.coords[0][1]];
      const sym1 = matrix[line.coords[1][0]][line.coords[1][1]];
      const sym2 = matrix[line.coords[2][0]][line.coords[2][1]];

      // Determine matching symbol considering Wilds
      let baseSym = sym0;
      if (baseSym.isWild) {
        baseSym = !sym1.isWild ? sym1 : sym2;
      }

      const match0 = sym0.id === baseSym.id || sym0.isWild;
      const match1 = sym1.id === baseSym.id || sym1.isWild;
      const match2 = sym2.id === baseSym.id || sym2.isWild;

      if (match0 && match1 && match2) {
        // 3 of a kind on payline!
        const multiplier = baseSym.multiplier3;
        const lineWin = betPerLine * multiplier;
        totalPayout += lineWin;
        wins.push({
          payline: line,
          symbol: baseSym,
          multiplier,
          winAmount: lineWin,
        });
      } else if (match0 && match1 && baseSym.multiplier2) {
        // 2 top-tier symbols on first 2 reels
        const multiplier = baseSym.multiplier2;
        const lineWin = betPerLine * multiplier;
        totalPayout += lineWin;
        wins.push({
          payline: line,
          symbol: baseSym,
          multiplier,
          winAmount: lineWin,
        });
      }
    });

    setWinningPaylines(wins);
    setRoundWinAmount(totalPayout);

    if (totalPayout > 0) {
      onUpdateBankroll(totalPayout);
      const isJackpot = wins.some(w => w.multiplier >= 50);

      if (isJackpot) {
        sound.playJackpot();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setWinTitle(`BÜYÜK İKRAMİYE! (JACKPOT: +$${totalPayout})`);
      } else {
        sound.playWin();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setWinTitle(`KAZANDINIZ! (+${Math.floor(totalPayout / totalBet)}x: +$${totalPayout})`);
      }
    } else {
      setWinTitle('');
    }

    onRecordGameResult(totalBet, totalPayout, 'slot');
    setIsSpinning(false);

    // Auto-spin next trigger
    if (autoSpinRef.current) {
      setTimeout(() => {
        if (autoSpinRef.current && bankroll >= totalBet) {
          handleSpin();
        } else {
          setIsAutoSpin(false);
        }
      }, 1500);
    }
  };

  // Cleanup tick on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Slot Machine Luxury Realistic Cabinet Container with Side Pull Arm */}
      <div className="relative w-full flex items-center justify-center">
        {/* Main Physical Cabinet Body */}
        <div 
          className="relative w-full max-w-2xl rounded-[32px] p-5 sm:p-7 border-4 border-[#d4af37] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #2b1408 0%, #150904 20%, #10141a 45%, #080c11 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.95), inset 0 3px 6px rgba(255,225,140,0.4), inset 0 -6px 12px rgba(0,0,0,0.95)',
          }}
        >
          {/* Corner Chrome Rivets */}
          <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-600 border border-slate-900 shadow-sm" />
          <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-600 border border-slate-900 shadow-sm" />
          <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-600 border border-slate-900 shadow-sm" />
          <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 to-slate-600 border border-slate-900 shadow-sm" />

          {/* Top Marquee Signboard with Vintage Casino Bulbs */}
          <div className="relative mb-5 p-3 rounded-2xl bg-gradient-to-b from-amber-950 via-slate-950 to-amber-950 border-2 border-amber-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
            {/* Flashing Vintage Perimeter Bulbs */}
            <div className="flex items-center justify-between px-2 mb-1 pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]" />
              <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_6px_#facc15]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_6px_#facc15]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl animate-bounce drop-shadow">🎰</span>
                <div>
                  <h2 className="font-serif-luxury font-black text-lg sm:text-2xl gold-gradient-text tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    ROYAL 777 CASINO
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-amber-400/90 font-serif-luxury font-bold tracking-wider">
                    <span>5 HATLI KLASİK MEKANİK KABİN</span>
                    <span>•</span>
                    <span className="text-emerald-400">JACKPOT: 100x</span>
                  </div>
                </div>
              </div>

              {/* High-End Win Display Screen */}
              <div className="flex flex-col items-end bg-slate-950 px-3.5 py-1.5 rounded-xl border-2 border-amber-400/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="text-[9px] font-serif-luxury font-black text-amber-400 tracking-wider uppercase">
                  Toplam Kazanç
                </span>
                <span className="font-serif-luxury font-black text-base sm:text-xl text-amber-300 font-mono">
                  ${roundWinAmount.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </div>

          {/* The 3-Reel Mechanical Drum Window with Heavy Gold Bezel Frame */}
          <div className="relative mx-auto max-w-lg p-3 rounded-3xl bg-gradient-to-b from-[#f3d077] via-[#9e7118] to-[#463105] shadow-[0_0_35px_rgba(212,175,55,0.4)] border-2 border-[#fff3b0]">
            {/* Inner Dark Matte Bezel Frame */}
            <div className="relative rounded-2xl p-1.5 bg-slate-950 border-2 border-amber-500/80 shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
              {/* Payline Markers on Left and Right */}
              <div className="absolute -left-3.5 top-0 bottom-0 flex flex-col justify-around py-3 z-30 pointer-events-none">
                {PAYLINES.map((pl) => (
                  <div
                    key={pl.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] text-slate-950 shadow-md border border-white/80"
                    style={{ backgroundColor: pl.color }}
                    title={pl.name}
                  >
                    {pl.id}
                  </div>
                ))}
              </div>
              <div className="absolute -right-3.5 top-0 bottom-0 flex flex-col justify-around py-3 z-30 pointer-events-none">
                {PAYLINES.map((pl) => (
                  <div
                    key={pl.id}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] text-slate-950 shadow-md border border-white/80"
                    style={{ backgroundColor: pl.color }}
                  >
                    {pl.id}
                  </div>
                ))}
              </div>

              {/* Center Payline Visual Laser Guideline */}
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none border-y border-amber-400/40 bg-amber-400/5"
                style={{
                  top: `${ITEM_HEIGHT}px`,
                  height: `${ITEM_HEIGHT}px`,
                }}
              />

              {/* Viewport with OVERFLOW HIDDEN to ensure symbols NEVER cut off */}
              <div
                className="relative w-full overflow-hidden rounded-xl bg-slate-900 grid grid-cols-3 divide-x-2 divide-amber-600/40"
                style={{ height: `${VIEWPORT_HEIGHT}px` }}
              >
                {/* Convex Curved Glass Reflection Vignette */}
                <div className="absolute inset-0 z-20 slot-viewport-vignette pointer-events-none" />
                <div 
                  className="absolute inset-0 z-20 pointer-events-none opacity-20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 100%)',
                  }}
                />

                {/* 3 Drum Reels */}
                {[0, 1, 2].map((reelIndex) => {
                  const strip = reelStrips[reelIndex];
                  const stopIdx = stopIndices[reelIndex];
                  const transitionStyle = reelTransitions[reelIndex];

                  return (
                    <div key={reelIndex} className="relative w-full h-full overflow-hidden">
                      <div
                        className="w-full flex flex-col"
                        style={{
                          transform: `translateY(-${stopIdx * ITEM_HEIGHT}px)`,
                          transition: transitionStyle,
                          willChange: 'transform',
                        }}
                      >
                        {strip.map((sym, idx) => {
                          const isWinner =
                            !isSpinning &&
                            winningPaylines.some((win) => {
                              return win.payline.coords.some(
                                ([r, row]) => r === reelIndex && stopIdx + row === idx
                              );
                            });

                          return (
                            <div
                              key={idx}
                              className={`
                                w-full flex flex-col items-center justify-center select-none transition-colors
                                ${isWinner ? 'bg-amber-400/25 ring-2 ring-amber-400 ring-inset rounded-xl' : ''}
                              `}
                              style={{ height: `${ITEM_HEIGHT}px` }}
                            >
                              <span 
                                className={`text-4xl sm:text-5xl transition-transform ${
                                  isWinner ? 'scale-115 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,1)]' : ''
                                }`}
                              >
                                {sym.icon}
                              </span>
                              <span
                                className="font-serif-luxury font-black text-[10px] sm:text-xs mt-1 drop-shadow"
                                style={{ color: sym.color }}
                              >
                                {sym.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Win Banner */}
          <div className="mt-4 min-h-[44px] flex items-center justify-center">
            {winTitle ? (
              <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-pulse flex items-center gap-2 border border-white">
                <Trophy className="w-5 h-5 text-slate-950" />
                {winTitle}
              </div>
            ) : (
              <div className="text-xs text-amber-300/70 font-serif-luxury font-bold italic">
                {isSpinning ? 'Makaralar dönüyor...' : 'Kazanmak için kolu çekin veya çevir butonuna basın!'}
              </div>
            )}
          </div>

          {/* Bottom Coin Tray & Hopper Slot Detailing */}
          <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-xs text-amber-400/80 font-serif-luxury font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mekanik Kasa Hazır</span>
            </div>
            {/* Metallic Coin Slot */}
            <div className="h-4 w-28 bg-slate-950 rounded-full border border-amber-400/60 shadow-inner flex items-center justify-center">
              <span className="h-1 w-16 bg-amber-400/40 rounded-full block" />
            </div>
            <div>
              <span>Jeton Değeri: ${betPerLine}</span>
            </div>
          </div>
        </div>

        {/* Physical 3D Slot Machine Pull Arm / Lever (Visible on desktop & tablets) */}
        <div 
          className="hidden md:flex flex-col items-center -ml-2 cursor-pointer group select-none z-30"
          onClick={() => {
            if (!isSpinning) handleSpin();
          }}
          title="Kolu Çekerek Çevir!"
        >
          {/* Lever Base Pivot */}
          <div className="w-6 h-12 rounded-r-xl bg-gradient-to-r from-slate-700 to-slate-900 border-2 border-amber-400 shadow-xl flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow" />
          </div>

          {/* Chrome Arm Shaft */}
          <div 
            className={`w-3.5 bg-gradient-to-r from-slate-200 via-white to-slate-400 border border-slate-700 shadow-lg origin-bottom transition-all duration-300 ${
              isSpinning ? 'h-28 rotate-45 translate-y-6' : 'h-36 group-hover:h-32 group-active:h-24'
            }`}
            style={{ borderRadius: '4px' }}
          >
            {/* Glossy Red/Gold Knob Ball */}
            <div 
              className={`w-10 h-10 -ml-3.5 -mt-5 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-red-950 border-2 border-amber-300 shadow-[0_6px_16px_rgba(225,29,72,0.8)] transition-transform ${
                isSpinning ? 'scale-90' : 'group-hover:scale-110'
              }`}
            >
              <span className="absolute top-1.5 left-2 w-3 h-3 rounded-full bg-white/60 pointer-events-none blur-[0.5px]" />
            </div>
          </div>
          <span className="text-[10px] font-serif-luxury font-black text-amber-300 uppercase tracking-widest mt-2 drop-shadow">
            Kolu Çek
          </span>
        </div>
      </div>

      {/* Slot Machine Bet & Spin Console */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-xl flex flex-col gap-4">
        {/* Bet Config & Info */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hat Bahsi:</span>
            <span className="font-serif-luxury font-bold text-amber-300 text-base">
              ${betPerLine.toLocaleString('tr-TR')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Aktif Hatlar:</span>
            <span className="font-bold text-slate-200">5 Hat</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40">
            <span className="text-slate-400 uppercase font-semibold text-[11px]">Toplam Çevirme Bahsi:</span>
            <span className="font-serif-luxury font-black text-amber-300 text-base">
              ${totalBet.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* 3D Chip Selector for Line Bet */}
        <ChipSelector
          selectedChip={selectedChip}
          onSelectChip={(val) => {
            setSelectedChip(val);
            setBetPerLine(val);
          }}
          currentBet={totalBet}
          bankroll={bankroll}
          onAddBet={(val) => {
            const nextLineBet = betPerLine + val;
            if (nextLineBet * activePaylinesCount <= bankroll) {
              setBetPerLine(nextLineBet);
            }
          }}
          onSetBet={(val) => {
            const calculatedLineBet = Math.max(1, Math.floor(val / activePaylinesCount));
            if (calculatedLineBet * activePaylinesCount <= bankroll) {
              setBetPerLine(calculatedLineBet);
            } else {
              const maxLineBet = Math.max(1, Math.floor(bankroll / activePaylinesCount));
              setBetPerLine(maxLineBet);
            }
          }}
          onClearBet={() => setBetPerLine(5)}
          onAllIn={() => {
            const maxPerLine = Math.max(5, Math.floor(bankroll / activePaylinesCount));
            setBetPerLine(maxPerLine);
          }}
          disabled={isSpinning}
        />

        {/* Spin & Auto-Spin Action Buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap pt-2">
          {/* Main Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || totalBet <= 0 || totalBet > bankroll}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-base sm:text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            {isSpinning ? 'Dönüyor...' : 'Çevir (Spin)'}
          </button>

          {/* Auto Spin Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              if (isAutoSpin) {
                setIsAutoSpin(false);
              } else {
                setIsAutoSpin(true);
                if (!isSpinning) handleSpin();
              }
            }}
            disabled={totalBet > bankroll}
            className={`px-5 py-3 rounded-xl font-serif-luxury font-bold text-xs uppercase tracking-wider border transition flex items-center gap-1.5 ${
              isAutoSpin
                ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
            }`}
          >
            {isAutoSpin ? (
              <>
                <Square className="w-3.5 h-3.5" /> Oto Çevirmeyi Durdur
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Otomatik Çevir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
