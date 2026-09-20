import React, { useState } from 'react';
import { RouletteBet } from '../types';
import {
  getNumberColor,
  COLUMN_1_NUMBERS,
  COLUMN_2_NUMBERS,
  COLUMN_3_NUMBERS,
  DOZEN_1_NUMBERS,
  DOZEN_2_NUMBERS,
  DOZEN_3_NUMBERS,
  FRENCH_BETS,
} from '../utils/rouletteRules';
import { sound } from '../utils/audio';
import { Sparkles, Shield, Compass } from 'lucide-react';

interface RouletteTableProps {
  bets: RouletteBet[];
  onPlaceBet: (type: RouletteBet['type'], numbers: number[], label: string, multiplier: number) => void;
  winningNumber: number | null;
  disabled?: boolean;
}

export const RouletteTable: React.FC<RouletteTableProps> = ({
  bets,
  onPlaceBet,
  winningNumber,
  disabled = false,
}) => {
  const [hoveredNumbers, setHoveredNumbers] = useState<number[]>([]);
  const [activeViewMode, setActiveViewMode] = useState<'board' | 'french'>('board');

  // Sum bets on a specific straight number
  const getStraightBetAmount = (num: number): number => {
    return bets
      .filter((b) => b.type === 'straight' && b.numbers.includes(num))
      .reduce((sum, b) => sum + b.amount, 0);
  };

  // Sum bets on a specific bet type
  const getBetAmountByType = (type: RouletteBet['type'], checkNums?: number[]): number => {
    return bets
      .filter((b) => {
        if (b.type !== type) return false;
        if (checkNums && checkNums.length > 0) {
          return JSON.stringify(b.numbers.sort()) === JSON.stringify(checkNums.sort());
        }
        return true;
      })
      .reduce((sum, b) => sum + b.amount, 0);
  };

  // Helper to place bets with sound
  const handleBetClick = (
    type: RouletteBet['type'],
    numbers: number[],
    label: string,
    multiplier: number
  ) => {
    if (disabled) return;
    sound.playChip();
    onPlaceBet(type, numbers, label, multiplier);
  };

  // Rows of numbers
  // Row 3: 3, 6, 9 ... 36
  const row3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  // Row 2: 2, 5, 8 ... 35
  const row2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  // Row 1: 1, 4, 7 ... 34
  const row1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

  // Helper to format chip badge
  const renderChipBadge = (amount: number) => {
    if (amount <= 0) return null;
    let text = `$${amount}`;
    if (amount >= 1000000) text = `$${(amount / 1000000).toFixed(0)}M`;
    else if (amount >= 1000) text = `$${(amount / 1000).toFixed(0)}K`;

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] flex items-center justify-center border-2 border-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_8px_rgba(245,158,11,0.6)] animate-in zoom-in-50 duration-150">
          {text}
        </div>
      </div>
    );
  };

  // Authentic Brass Casino Dolly marker placed on winning number
  const renderDollyMarker = () => (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center animate-in zoom-in-75 duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]">
      {/* Crystal glass finial top */}
      <div className="w-2.5 h-2.5 rounded-full bg-cyan-100 border border-white shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
      {/* Brass neck */}
      <div className="w-3 h-1.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 rounded-t-sm -mt-0.5" />
      {/* Sculpted brass column */}
      <div className="w-4 h-5 rounded-[2px] bg-gradient-to-r from-amber-600 via-amber-200 to-amber-700 border border-amber-300/80 shadow-inner flex items-center justify-center">
        <div className="w-2.5 h-0.5 bg-amber-900/60 rounded-full" />
      </div>
      {/* Heavy brass foot base */}
      <div className="w-6 h-2 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-900 border border-amber-400 shadow-[0_2px_4px_rgba(0,0,0,0.9)] -mt-0.5" />
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Table Sub-Nav for Mobile & Quick Special Bets */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-amber-500/30 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveViewMode('board');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeViewMode === 'board'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                : 'text-slate-300 hover:text-amber-300'
            }`}
          >
            Avrupa Rulet Masası
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveViewMode('french');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeViewMode === 'french'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                : 'text-slate-300 hover:text-amber-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Özel Fransız Bahisleri
          </button>
        </div>

        <div className="text-[11px] text-amber-400/80 font-medium hidden sm:block">
          💡 İpucu: Herhangi bir bahis alanına tıklayarak fiş yerleştirebilirsiniz.
        </div>
      </div>

      {activeViewMode === 'french' ? (
        /* FRENCH CALL BETS SPECIAL VIEW */
        <div className="w-full p-4 sm:p-6 rounded-2xl bg-[#0b1b14] border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h4 className="font-serif-luxury font-bold text-base sm:text-lg text-amber-300">
              Fransız Anons Bahisleri (Call / Announced Bets)
            </h4>
          </div>
          <p className="text-xs text-slate-300">
            Çark üzerindeki ardışık sektör dilimlerini tek tıkla toplu olarak oynamanızı sağlayan lüks VIP bahis kombinasyonları:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {Object.entries(FRENCH_BETS).map(([key, fBet]) => {
              const currentStaked = bets
                .filter((b) => b.label === fBet.name)
                .reduce((s, b) => s + b.amount, 0);

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredNumbers(fBet.numbers)}
                  onMouseLeave={() => setHoveredNumbers([])}
                  onClick={() => handleBetClick('straight', fBet.numbers, fBet.name, 36)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    currentStaked > 0
                      ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-slate-900/80 border-amber-500/30 hover:border-amber-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-serif-luxury font-bold text-sm sm:text-base text-amber-200">
                        {fBet.name}
                      </h5>
                      <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                        {fBet.description}
                      </span>
                    </div>
                    {currentStaked > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs shadow">
                        ${currentStaked.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {fBet.numbers.map((num) => (
                      <span
                        key={num}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white ${
                          num === 0
                            ? 'bg-emerald-600'
                            : getNumberColor(num) === 'red'
                            ? 'bg-red-600'
                            : 'bg-slate-800'
                        }`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MAIN EUROPEAN ROULETTE TABLE BOARD */
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-500/30">
          <div
            className="min-w-[760px] p-4 sm:p-5 rounded-2xl border-4 border-amber-600/50 shadow-2xl relative"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #0d281a 0%, #061910 80%, #030d08 100%)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.8)',
            }}
          >
            {/* Subtle table gold felt branding text */}
            <div className="absolute top-2 right-4 text-[11px] font-serif-luxury font-bold tracking-widest text-amber-500/30 pointer-events-none uppercase">
              Grand Royale European Roulette • 37 Pockets
            </div>

            <div className="flex gap-1.5 pt-4">
              {/* ZERO (0) VERTICAL CELL */}
              <div
                onClick={() => handleBetClick('straight', [0], 'Sayı: 0 (Yeşil)', 36)}
                onMouseEnter={() => setHoveredNumbers([0])}
                onMouseLeave={() => setHoveredNumbers([])}
                className={`relative w-16 sm:w-20 rounded-l-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  winningNumber === 0
                    ? 'border-amber-300 bg-emerald-500 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.9)] z-20 ring-2 ring-amber-300'
                    : hoveredNumbers.includes(0)
                    ? 'border-amber-300 bg-emerald-700/80 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'border-amber-500/40 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:border-amber-400'
                }`}
              >
                <span className="font-serif-luxury font-black text-2xl sm:text-3xl drop-shadow">0</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-200 mt-1">Sıfır</span>
                {winningNumber === 0 ? renderDollyMarker() : renderChipBadge(getStraightBetAmount(0))}
              </div>

              {/* MAIN NUMBERS GRID (3 Rows x 12 Columns) + Column Bets */}
              <div className="flex-1 flex flex-col gap-1.5">
                {/* ROW 3 (3, 6, 9 ... 36) + Column 3 */}
                <div className="flex gap-1.5">
                  {row3.map((num) => {
                    const color = getNumberColor(num);
                    const isRed = color === 'red';
                    const isWinning = winningNumber === num;
                    const isHovered = hoveredNumbers.includes(num);
                    const chipAmt = getStraightBetAmount(num);

                    return (
                      <div
                        key={num}
                        onClick={() => handleBetClick('straight', [num], `Sayı: ${num}`, 36)}
                        onMouseEnter={() => setHoveredNumbers([num])}
                        onMouseLeave={() => setHoveredNumbers([])}
                        className={`relative flex-1 h-12 sm:h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isWinning
                            ? 'border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black shadow-[0_0_25px_rgba(251,191,36,1)] z-20 ring-2 ring-amber-200'
                            : isHovered
                            ? 'border-amber-300 bg-amber-500/30 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : isRed
                            ? 'border-red-900/80 bg-red-700/90 hover:bg-red-600 text-white hover:border-amber-400'
                            : 'border-slate-800 bg-slate-950/90 hover:bg-slate-900 text-slate-100 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-serif-luxury font-black text-base sm:text-lg">{num}</span>
                        {isWinning ? renderDollyMarker() : renderChipBadge(chipAmt)}
                      </div>
                    );
                  })}

                  {/* COLUMN 3 (2 to 1) */}
                  <div
                    onClick={() => handleBetClick('column', COLUMN_3_NUMBERS, '3. Kolon (2:1)', 3)}
                    onMouseEnter={() => setHoveredNumbers(COLUMN_3_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative w-16 sm:w-20 rounded-r-lg border-2 border-amber-500/40 bg-slate-900/90 hover:bg-slate-800 hover:border-amber-300 text-amber-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                  >
                    <span>2 : 1</span>
                    {renderChipBadge(getBetAmountByType('column', COLUMN_3_NUMBERS))}
                  </div>
                </div>

                {/* ROW 2 (2, 5, 8 ... 35) + Column 2 */}
                <div className="flex gap-1.5">
                  {row2.map((num) => {
                    const color = getNumberColor(num);
                    const isRed = color === 'red';
                    const isWinning = winningNumber === num;
                    const isHovered = hoveredNumbers.includes(num);
                    const chipAmt = getStraightBetAmount(num);

                    return (
                      <div
                        key={num}
                        onClick={() => handleBetClick('straight', [num], `Sayı: ${num}`, 36)}
                        onMouseEnter={() => setHoveredNumbers([num])}
                        onMouseLeave={() => setHoveredNumbers([])}
                        className={`relative flex-1 h-12 sm:h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isWinning
                            ? 'border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black shadow-[0_0_25px_rgba(251,191,36,1)] z-20 ring-2 ring-amber-200'
                            : isHovered
                            ? 'border-amber-300 bg-amber-500/30 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : isRed
                            ? 'border-red-900/80 bg-red-700/90 hover:bg-red-600 text-white hover:border-amber-400'
                            : 'border-slate-800 bg-slate-950/90 hover:bg-slate-900 text-slate-100 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-serif-luxury font-black text-base sm:text-lg">{num}</span>
                        {isWinning ? renderDollyMarker() : renderChipBadge(chipAmt)}
                      </div>
                    );
                  })}

                  {/* COLUMN 2 (2 to 1) */}
                  <div
                    onClick={() => handleBetClick('column', COLUMN_2_NUMBERS, '2. Kolon (2:1)', 3)}
                    onMouseEnter={() => setHoveredNumbers(COLUMN_2_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative w-16 sm:w-20 rounded-r-lg border-2 border-amber-500/40 bg-slate-900/90 hover:bg-slate-800 hover:border-amber-300 text-amber-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                  >
                    <span>2 : 1</span>
                    {renderChipBadge(getBetAmountByType('column', COLUMN_2_NUMBERS))}
                  </div>
                </div>

                {/* ROW 1 (1, 4, 7 ... 34) + Column 1 */}
                <div className="flex gap-1.5">
                  {row1.map((num) => {
                    const color = getNumberColor(num);
                    const isRed = color === 'red';
                    const isWinning = winningNumber === num;
                    const isHovered = hoveredNumbers.includes(num);
                    const chipAmt = getStraightBetAmount(num);

                    return (
                      <div
                        key={num}
                        onClick={() => handleBetClick('straight', [num], `Sayı: ${num}`, 36)}
                        onMouseEnter={() => setHoveredNumbers([num])}
                        onMouseLeave={() => setHoveredNumbers([])}
                        className={`relative flex-1 h-12 sm:h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isWinning
                            ? 'border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 font-black shadow-[0_0_25px_rgba(251,191,36,1)] z-20 ring-2 ring-amber-200'
                            : isHovered
                            ? 'border-amber-300 bg-amber-500/30 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : isRed
                            ? 'border-red-900/80 bg-red-700/90 hover:bg-red-600 text-white hover:border-amber-400'
                            : 'border-slate-800 bg-slate-950/90 hover:bg-slate-900 text-slate-100 hover:border-amber-400'
                        }`}
                      >
                        <span className="font-serif-luxury font-black text-base sm:text-lg">{num}</span>
                        {isWinning ? renderDollyMarker() : renderChipBadge(chipAmt)}
                      </div>
                    );
                  })}

                  {/* COLUMN 1 (2 to 1) */}
                  <div
                    onClick={() => handleBetClick('column', COLUMN_1_NUMBERS, '1. Kolon (2:1)', 3)}
                    onMouseEnter={() => setHoveredNumbers(COLUMN_1_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative w-16 sm:w-20 rounded-r-lg border-2 border-amber-500/40 bg-slate-900/90 hover:bg-slate-800 hover:border-amber-300 text-amber-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                  >
                    <span>2 : 1</span>
                    {renderChipBadge(getBetAmountByType('column', COLUMN_1_NUMBERS))}
                  </div>
                </div>

                {/* DOZENS ROW (1st 12, 2nd 12, 3rd 12) */}
                <div className="flex gap-1.5 pt-1">
                  <div
                    onClick={() => handleBetClick('dozen', DOZEN_1_NUMBERS, '1. Düzine (1-12)', 3)}
                    onMouseEnter={() => setHoveredNumbers(DOZEN_1_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>1. Düzine (1 - 12)</span>
                    {renderChipBadge(getBetAmountByType('dozen', DOZEN_1_NUMBERS))}
                  </div>
                  <div
                    onClick={() => handleBetClick('dozen', DOZEN_2_NUMBERS, '2. Düzine (13-24)', 3)}
                    onMouseEnter={() => setHoveredNumbers(DOZEN_2_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>2. Düzine (13 - 24)</span>
                    {renderChipBadge(getBetAmountByType('dozen', DOZEN_2_NUMBERS))}
                  </div>
                  <div
                    onClick={() => handleBetClick('dozen', DOZEN_3_NUMBERS, '3. Düzine (25-36)', 3)}
                    onMouseEnter={() => setHoveredNumbers(DOZEN_3_NUMBERS)}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>3. Düzine (25 - 36)</span>
                    {renderChipBadge(getBetAmountByType('dozen', DOZEN_3_NUMBERS))}
                  </div>
                </div>

                {/* OUTSIDE BETS ROW (1-18, EVEN, RED, BLACK, ODD, 19-36) */}
                <div className="flex gap-1.5 pt-0.5">
                  {/* 1 - 18 (Low) */}
                  <div
                    onClick={() => {
                      const nums = Array.from({ length: 18 }, (_, i) => i + 1);
                      handleBetClick('low', nums, '1 - 18 (Düşük)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers(Array.from({ length: 18 }, (_, i) => i + 1))}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>1 - 18</span>
                    {renderChipBadge(getBetAmountByType('low'))}
                  </div>

                  {/* EVEN (Çift) */}
                  <div
                    onClick={() => {
                      const nums = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 0);
                      handleBetClick('even', nums, 'Çift (Even)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers(Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 0))}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>Çift (Even)</span>
                    {renderChipBadge(getBetAmountByType('even'))}
                  </div>

                  {/* RED (Kırmızı) */}
                  <div
                    onClick={() => {
                      const nums = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                      handleBetClick('red', nums, 'Kırmızı (Red)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-red-500/60 bg-red-700/90 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider text-center cursor-pointer transition shadow"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full border border-white" />
                      <span>Kırmızı</span>
                    </div>
                    {renderChipBadge(getBetAmountByType('red'))}
                  </div>

                  {/* BLACK (Siyah) */}
                  <div
                    onClick={() => {
                      const nums = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
                      handleBetClick('black', nums, 'Siyah (Black)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35])}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-slate-700 bg-slate-950/95 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider text-center cursor-pointer transition shadow"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 bg-slate-800 rounded-full border border-slate-500" />
                      <span>Siyah</span>
                    </div>
                    {renderChipBadge(getBetAmountByType('black'))}
                  </div>

                  {/* ODD (Tek) */}
                  <div
                    onClick={() => {
                      const nums = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 !== 0);
                      handleBetClick('odd', nums, 'Tek (Odd)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers(Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 !== 0))}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>Tek (Odd)</span>
                    {renderChipBadge(getBetAmountByType('odd'))}
                  </div>

                  {/* 19 - 36 (High) */}
                  <div
                    onClick={() => {
                      const nums = Array.from({ length: 18 }, (_, i) => i + 19);
                      handleBetClick('high', nums, '19 - 36 (Yüksek)', 2);
                    }}
                    onMouseEnter={() => setHoveredNumbers(Array.from({ length: 18 }, (_, i) => i + 19))}
                    onMouseLeave={() => setHoveredNumbers([])}
                    className="relative flex-1 py-2.5 rounded-lg border-2 border-amber-500/30 bg-slate-900/90 hover:bg-slate-850 hover:border-amber-400 text-slate-200 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition"
                  >
                    <span>19 - 36</span>
                    {renderChipBadge(getBetAmountByType('high'))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
