import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { Crown, Sparkles, RotateCcw, Check, Zap, Sliders, DollarSign, ArrowUpRight } from 'lucide-react';
import { CasinoAmountInput } from './CasinoNumpad';

export interface ChipInfo {
  value: number;
  label: string;
  color: string;
  border: string;
  accent: string;
  name: string;
  tier: 'standard' | 'highroller';
}

export const CHIP_DENOMINATIONS: ChipInfo[] = [
  // Standart Fişler ($5 - $5.000)
  { value: 5, label: '5', color: '#ef4444', border: '#b91c1c', accent: '#fee2e2', name: 'Kırmızı', tier: 'standard' },
  { value: 25, label: '25', color: '#16a34a', border: '#15803d', accent: '#dcfce7', name: 'Yeşil', tier: 'standard' },
  { value: 100, label: '100', color: '#2563eb', border: '#1d4ed8', accent: '#dbeafe', name: 'Mavi', tier: 'standard' },
  { value: 500, label: '500', color: '#9333ea', border: '#7e22ce', accent: '#f3e8ff', name: 'Mor', tier: 'standard' },
  { value: 1000, label: '1K', color: '#ea580c', border: '#c2410c', accent: '#ffedd5', name: 'Turuncu', tier: 'standard' },
  { value: 5000, label: '5K', color: '#eab308', border: '#ca8a04', accent: '#fef9c3', name: 'Altın VIP', tier: 'standard' },

  // VIP & High Roller Yüksek Fişler ($10.000 - $1.000.000)
  { value: 10000, label: '10K', color: '#0284c7', border: '#0369a1', accent: '#e0f2fe', name: 'Platin VIP', tier: 'highroller' },
  { value: 25000, label: '25K', color: '#059669', border: '#047857', accent: '#a7f3d0', name: 'Zümrüt VIP', tier: 'highroller' },
  { value: 50000, label: '50K', color: '#4f46e5', border: '#4338ca', accent: '#e0e7ff', name: 'Safir VIP', tier: 'highroller' },
  { value: 100000, label: '100K', color: '#18181b', border: '#f59e0b', accent: '#fef08a', name: 'Oniks Taç', tier: 'highroller' },
  { value: 500000, label: '500K', color: '#be123c', border: '#9f1239', accent: '#ffe4e6', name: 'Yakut Ruby', tier: 'highroller' },
  { value: 1000000, label: '1M', color: '#b45309', border: '#f59e0b', accent: '#fef3c7', name: 'Grand Royale', tier: 'highroller' },
  { value: 5000000, label: '5M', color: '#701a75', border: '#a21caf', accent: '#fdf4ff', name: 'Balina Mor', tier: 'highroller' },
  { value: 10000000, label: '10M', color: '#0f172a', border: '#e11d48', accent: '#ffe4e6', name: 'Kraliyet Elmas', tier: 'highroller' },
];

interface ChipSelectorProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  currentBet: number;
  maxBet?: number;
  minBet?: number;
  bankroll: number;
  onAddBet: (amount: number) => void;
  onSetBet?: (exactAmount: number) => void;
  onClearBet: () => void;
  onAllIn: () => void;
  disabled?: boolean;
  betLabel?: string;
}

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  selectedChip,
  onSelectChip,
  currentBet,
  maxBet,
  minBet,
  bankroll,
  onAddBet,
  onSetBet,
  onClearBet,
  onAllIn,
  disabled = false,
  betLabel,
}) => {
  // Tab for filtering chips: 'all' | 'standard' | 'highroller'
  const [chipFilter, setChipFilter] = useState<'all' | 'standard' | 'highroller'>('all');
  
  // Manual bet input state
  const [manualInput, setManualInput] = useState<string>(currentBet > 0 ? currentBet.toString() : '');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Sync manual input when currentBet changes from external chip clicks (only if user isn't currently typing)
  useEffect(() => {
    if (!isInputFocused) {
      setManualInput(currentBet > 0 ? currentBet.toString() : '');
    }
  }, [currentBet, isInputFocused]);

  const displayedChips = CHIP_DENOMINATIONS.filter((chip) => {
    if (chipFilter === 'standard') return chip.tier === 'standard';
    if (chipFilter === 'highroller') return chip.tier === 'highroller';
    return true;
  });

  const maxAllowed = maxBet && maxBet > 0 ? Math.min(bankroll, maxBet) : bankroll;

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setManualInput(val);
  };

  const handleApplyManualBet = () => {
    sound.playChip();
    const parsed = parseInt(manualInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      if (onSetBet) {
        onSetBet(0);
      } else {
        onClearBet();
      }
      setManualInput('');
      return;
    }

    const clamped = Math.min(maxAllowed, parsed);
    if (onSetBet) {
      onSetBet(clamped);
    } else {
      onClearBet();
      onAddBet(clamped);
    }
    setManualInput(clamped.toString());
  };

  const handleQuickAdd = (amount: number) => {
    sound.playChip();
    if (onSetBet) {
      const next = Math.min(maxAllowed, currentBet + amount);
      onSetBet(next);
      setManualInput(next.toString());
    } else {
      const addAmt = Math.min(amount, Math.max(0, maxAllowed - currentBet));
      onAddBet(addAmt);
    }
  };

  const handleHalfBet = () => {
    if (currentBet > 0) {
      sound.playChip();
      const half = Math.max(minBet || 1, Math.floor(currentBet / 2));
      if (onSetBet) {
        onSetBet(half);
      } else {
        onClearBet();
        onAddBet(half);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3.5">
      {/* Chip Filter Tiers Header */}
      <div className="w-full flex items-center justify-between gap-2 px-1 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-amber-500/30">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setChipFilter('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              chipFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Tüm Fişler (12)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setChipFilter('standard');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              chipFilter === 'standard'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Standart ($5-$5K)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setChipFilter('highroller');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              chipFilter === 'highroller'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                : 'text-amber-400 hover:text-amber-200'
            }`}
          >
            <Crown className="w-3 h-3" />
            High Roller ($10K-$1M)
          </button>
        </div>

        {/* Direct Manual Bet Input Quick Bar with Casino Numpad */}
        <div className="flex items-center gap-1.5">
          <CasinoAmountInput
            id="manual-chip-amount-input"
            disabled={disabled}
            value={manualInput}
            onChange={(val) => setManualInput(val)}
            onApply={(amt) => {
              if (onSetBet) {
                onSetBet(amt);
              } else {
                onClearBet();
                if (amt > 0) onAddBet(amt);
              }
              setManualInput(amt > 0 ? amt.toString() : '');
            }}
            bankroll={bankroll}
            placeholder="Manuel Fiş Tutarı"
            className="w-36 sm:w-48"
            title="Manuel Fiş / Bahis Tutarı"
            subtitle="Numpad ile tutarı belirleyin veya doğrudan tuşlayın"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={handleApplyManualBet}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition disabled:opacity-40"
          >
            Uygula
          </button>
        </div>
      </div>

      {/* 3D Interactive Chips Grid / Row */}
      <div className="w-full flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-1 max-h-[160px] overflow-y-auto py-1 scrollbar-thin">
        {displayedChips.map((chip) => {
          const isSelected = selectedChip === chip.value;
          const canAfford = bankroll >= chip.value;

          return (
            <button
              key={chip.value}
              type="button"
              disabled={disabled || !canAfford}
              onClick={() => {
                sound.playChip();
                onSelectChip(chip.value);
                if (bankroll >= chip.value) {
                  onAddBet(chip.value);
                }
              }}
              className={`
                relative w-12 h-12 sm:w-14 sm:h-14 rounded-full select-none cursor-pointer flex-shrink-0
                transition-all duration-150 transform active:scale-95
                ${isSelected ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900 -translate-y-1.5' : ''}
                ${!canAfford || disabled ? 'opacity-35 grayscale cursor-not-allowed' : 'hover:-translate-y-1'}
              `}
              title={`${chip.name}: +$${chip.value.toLocaleString('tr-TR')}`}
            >
              {/* High Roller Crown Glow Indicator */}
              {chip.tier === 'highroller' && (
                <span className="absolute -top-1 -right-1 z-20 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[9px] shadow-sm font-black border border-slate-900">
                  ★
                </span>
              )}

              {/* 3D Chip Rim with notches and Brass Medallion */}
              <div
                className="w-full h-full rounded-full flex items-center justify-center chip-3d relative overflow-hidden"
                style={{
                  backgroundColor: chip.color,
                  boxShadow: `
                    0 8px 16px rgba(0,0,0,0.85),
                    0 2px 4px rgba(0,0,0,0.9),
                    inset 0 3px 4px rgba(255,255,255,0.55),
                    inset 0 -4px 6px rgba(0,0,0,0.8)
                  `,
                }}
              >
                {/* Dual-color perimeter rim notches */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `3.5px dashed ${chip.accent}`,
                    opacity: 0.85,
                  }}
                />

                {/* Outer Brass Fillet Ring */}
                <div className="absolute inset-1 rounded-full border border-amber-300/40 pointer-events-none" />

                {/* Inner Brass Inset Medallion */}
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center shadow-inner relative z-10"
                  style={{
                    background: chip.tier === 'highroller'
                      ? 'radial-gradient(circle at 35% 30%, #3a2e12 0%, #161205 70%, #080602 100%)'
                      : 'radial-gradient(circle at 35% 30%, #1c2430 0%, #0b0f14 70%, #050709 100%)',
                    border: '1.5px solid #e5c158',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9), 0 1px 3px rgba(212,175,55,0.4)',
                  }}
                >
                  <span className="font-serif-luxury font-black text-[11px] sm:text-xs text-amber-200 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {chip.label}
                  </span>
                </div>

                {/* Glass sheen highlight slice across top */}
                <div 
                  className="absolute -top-1 left-1 right-1 h-1/2 rounded-t-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Increment Badges & Action Controls */}
      {!disabled && (
        <div className="w-full flex flex-col items-center gap-2.5">
          {/* Quick Increment Shortcut Pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-amber-400/80 font-bold mr-1 hidden sm:inline uppercase tracking-wider">
              Hızlı Fiş Ekle:
            </span>
            {[
              { label: '+100', val: 100 },
              { label: '+1K', val: 1000 },
              { label: '+10K', val: 10000 },
              { label: '+50K', val: 50000 },
              { label: '+100K', val: 100000 },
              { label: '+500K', val: 500000 },
            ].map(pill => (
              <button
                key={pill.label}
                type="button"
                disabled={bankroll < (currentBet + pill.val)}
                onClick={() => handleQuickAdd(pill.val)}
                className="px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-amber-300 hover:text-amber-100 border border-amber-500/40 text-[11px] font-serif-luxury font-bold transition disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Core Action Controls: Clear, 1/2, 2x, All-in */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClearBet();
                setManualInput('');
              }}
              disabled={currentBet === 0}
              className="px-3.5 py-2 rounded-xl gold-btn transition disabled:opacity-30 disabled:cursor-not-allowed font-serif-luxury font-bold shadow"
            >
              Bahsi Sıfırla
            </button>

            <button
              type="button"
              onClick={handleHalfBet}
              disabled={currentBet <= 1}
              className="px-3.5 py-2 rounded-xl gold-btn transition disabled:opacity-30 disabled:cursor-not-allowed font-serif-luxury font-bold shadow"
            >
              ½ Yarım
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (currentBet > 0 && bankroll >= currentBet) {
                  sound.playChip();
                  onAddBet(currentBet); // Doubles the bet
                }
              }}
              disabled={currentBet === 0 || bankroll < currentBet}
              className="px-3.5 py-2 rounded-xl gold-btn transition disabled:opacity-30 disabled:cursor-not-allowed font-serif-luxury font-bold shadow"
            >
              2x Katla
            </button>

            <button
              type="button"
              onClick={() => {
                if (bankroll > 0) {
                  sound.playChip();
                  if (onSetBet) {
                    onSetBet(maxAllowed);
                  } else {
                    onAllIn();
                  }
                  setManualInput(maxAllowed.toString());
                }
              }}
              disabled={bankroll === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 via-rose-800 to-red-950 text-amber-100 border-2 border-red-500 hover:border-amber-400 hover:brightness-110 transition disabled:opacity-30 disabled:cursor-not-allowed font-serif-luxury font-black shadow-[0_0_15px_rgba(225,29,72,0.5)] active:scale-95 uppercase tracking-wider"
            >
              {maxBet && maxBet > 0 && maxBet < bankroll ? (
                <>Max Bahis (${maxAllowed.toLocaleString('tr-TR')})</>
              ) : (
                <>All-In (${maxAllowed.toLocaleString('tr-TR')})</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
