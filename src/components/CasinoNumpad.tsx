import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Delete,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Coins,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../utils/audio';

export interface CasinoNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialValue?: number | string;
  bankroll?: number;
  minAmount?: number;
  maxAmount?: number;
  onConfirm: (amount: number) => void;
  quickAddValues?: number[];
}

export const CasinoNumpadModal: React.FC<CasinoNumpadModalProps> = ({
  isOpen,
  onClose,
  title = 'Manuel Fiş Tutarı',
  subtitle = 'Bahis veya fiş miktarını tuşlayın',
  initialValue = '',
  bankroll = 10000000,
  minAmount = 1,
  maxAmount = 10000000,
  onConfirm,
  quickAddValues = [100, 500, 1000, 5000, 25000, 100000],
}) => {
  const [valStr, setValStr] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const initNum = typeof initialValue === 'number' ? initialValue : parseInt(initialValue as string, 10);
      setValStr(!isNaN(initNum) && initNum > 0 ? initNum.toString() : '');
    }
  }, [isOpen, initialValue]);

  const currentNumericValue = parseInt(valStr, 10) || 0;
  const effectiveMax = Math.min(bankroll, maxAmount);
  const exceedsBankroll = currentNumericValue > bankroll;

  // Listen to physical keyboard when numpad is open
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Numbers
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, valStr, bankroll, maxAmount, minAmount]);

  const handleDigit = (digit: string) => {
    sound.playChip();
    setValStr((prev) => {
      if (prev === '0' || prev === '') {
        return digit === '0' || digit === '00' || digit === '000' ? '' : digit;
      }
      const next = prev + digit;
      // Prevent overflow over $100 Billion
      if (next.length > 11) return prev;
      return next;
    });
  };

  const handleBackspace = () => {
    sound.playClick();
    setValStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleClear = () => {
    sound.playClick();
    setValStr('');
  };

  const handleQuickAdd = (amount: number) => {
    sound.playChip();
    setValStr((prev) => {
      const current = parseInt(prev, 10) || 0;
      const next = Math.min(effectiveMax, current + amount);
      return next > 0 ? next.toString() : '';
    });
  };

  const handleHalf = () => {
    sound.playChip();
    const current = parseInt(valStr, 10) || 0;
    if (current > 1) {
      const half = Math.max(1, Math.floor(current / 2));
      setValStr(half.toString());
    }
  };

  const handleDouble = () => {
    sound.playChip();
    const current = parseInt(valStr, 10) || 0;
    if (current > 0) {
      const doubled = Math.min(effectiveMax, current * 2);
      setValStr(doubled.toString());
    } else {
      setValStr('100');
    }
  };

  const handleAllIn = () => {
    sound.playChip();
    if (effectiveMax > 0) {
      setValStr(effectiveMax.toString());
    }
  };

  const handleConfirm = () => {
    sound.playChip();
    const parsed = parseInt(valStr, 10) || 0;
    const clamped = Math.max(0, Math.min(effectiveMax, parsed));
    onConfirm(clamped);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-4 sm:p-5 flex flex-col gap-3.5 relative overflow-hidden"
          >
            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-base text-amber-200 tracking-wide">
                    {title}
                  </h3>
                  <p className="text-[11px] text-slate-400">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Display Screen (Gold LED Style) */}
            <div className="p-3.5 rounded-2xl bg-black/90 border-2 border-amber-500/50 shadow-inner flex flex-col items-end justify-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  Kasa: ${bankroll.toLocaleString('tr-TR')}
                </span>
                {exceedsBankroll && (
                  <span className="text-red-400 font-bold animate-pulse">
                    Bakiye yetersiz!
                  </span>
                )}
              </div>

              <div className="w-full flex items-baseline justify-between overflow-x-auto scrollbar-none py-1">
                <span className="text-amber-500 font-serif-luxury font-black text-2xl sm:text-3xl select-none mr-2">
                  $
                </span>
                <span
                  className={`font-serif-luxury font-black text-3xl sm:text-4xl tracking-wider select-all transition-colors ${
                    exceedsBankroll ? 'text-red-400' : 'text-amber-100'
                  }`}
                >
                  {valStr ? parseInt(valStr, 10).toLocaleString('tr-TR') : '0'}
                </span>
              </div>
            </div>

            {/* Quick Multiplier & Value Bar */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={handleHalf}
                className="py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm"
              >
                ½ Yarım
              </button>
              <button
                type="button"
                onClick={handleDouble}
                className="py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm"
              >
                2x Katla
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="py-1.5 px-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm"
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={handleAllIn}
                className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-serif-luxury font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_0_10px_rgba(225,29,72,0.4)]"
              >
                All-In
              </button>
            </div>

            {/* Quick Chips Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickAddValues.map((qVal) => (
                <button
                  key={qVal}
                  type="button"
                  onClick={() => handleQuickAdd(qVal)}
                  disabled={bankroll < qVal}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-bold text-[11px] whitespace-nowrap transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  +${qVal >= 1000 ? `${qVal / 1000}K` : qVal}
                </button>
              ))}
            </div>

            {/* NUMPAD KEYPAD (3x4 Layout) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1', val: '1' },
                { label: '2', val: '2' },
                { label: '3', val: '3' },
                { label: '4', val: '4' },
                { label: '5', val: '5' },
                { label: '6', val: '6' },
                { label: '7', val: '7' },
                { label: '8', val: '8' },
                { label: '9', val: '9' },
                { label: '00', val: '00' },
                { label: '0', val: '0' },
                { label: '000', val: '000' },
              ].map((k) => (
                <button
                  key={k.label}
                  type="button"
                  onClick={() => handleDigit(k.val)}
                  className="py-3 sm:py-3.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-amber-500/20 hover:to-amber-500/30 border border-slate-700 hover:border-amber-400 text-amber-100 font-serif-luxury font-bold text-xl sm:text-2xl shadow active:scale-95 transition select-none flex items-center justify-center"
                >
                  {k.label}
                </button>
              ))}
            </div>

            {/* Bottom Row: Backspace & Confirm */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center font-bold transition active:scale-95"
                title="Geri Sil"
              >
                <Delete className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif-luxury font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Uygula (${valStr ? parseInt(valStr, 10).toLocaleString('tr-TR') : '0'})</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export interface CasinoAmountInputProps {
  value: string | number;
  onChange: (val: string) => void;
  onApply?: (num: number) => void;
  bankroll?: number;
  minAmount?: number;
  maxAmount?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  subtitle?: string;
}

export const CasinoAmountInput: React.FC<CasinoAmountInputProps> = ({
  value,
  onChange,
  onApply,
  bankroll = 10000000,
  minAmount = 1,
  maxAmount = 10000000,
  placeholder = 'Manuel Tutar Yaz',
  disabled = false,
  className = '',
  id,
  title = 'Manuel Fiş Tutarı',
  subtitle = 'Bahis veya fiş miktarını tuşlayın',
}) => {
  const [isNumpadOpen, setIsNumpadOpen] = useState<boolean>(false);

  const rawStringValue = value !== undefined && value !== null ? value.toString() : '';

  // Intercept keyboard typing: ONLY digits 0-9 and control keys allowed!
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Functional keys: allow Backspace, Delete, Tab, Arrow keys, Enter, Esc, Ctrl+A/C/V
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
    ) {
      if (e.key === 'Enter') {
        const num = parseInt(rawStringValue, 10) || 0;
        if (onApply) onApply(num);
        (e.target as HTMLInputElement).blur();
      }
      return;
    }

    // Strictly BLOCK any non-digit character
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly) {
      onChange(digitsOnly);
      if (onApply) onApply(parseInt(digitsOnly, 10) || 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits);
  };

  const handleNumpadConfirm = (amount: number) => {
    onChange(amount > 0 ? amount.toString() : '');
    if (onApply) {
      onApply(amount);
    }
  };

  return (
    <>
      <div className={`relative flex items-center ${className}`}>
        <span className="absolute left-2.5 text-amber-400 font-bold text-xs pointer-events-none select-none">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          disabled={disabled}
          value={rawStringValue}
          onFocus={() => {
            setIsNumpadOpen(true);
          }}
          onClick={() => {
            setIsNumpadOpen(true);
          }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full pl-6 pr-8 py-1.5 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-200 font-serif-luxury font-bold text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-400 transition disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            sound.playClick();
            setIsNumpadOpen(true);
          }}
          title="Numpad ile Yaz"
          className="absolute right-1.5 p-1 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20 transition"
        >
          <Calculator className="w-3.5 h-3.5" />
        </button>
      </div>

      <CasinoNumpadModal
        isOpen={isNumpadOpen}
        onClose={() => setIsNumpadOpen(false)}
        title={title}
        subtitle={subtitle}
        initialValue={rawStringValue}
        bankroll={bankroll}
        minAmount={minAmount}
        maxAmount={maxAmount}
        onConfirm={handleNumpadConfirm}
      />
    </>
  );
};
