import React from 'react';
import { Card } from '../types';
import { SUIT_SYMBOLS } from '../utils/cards';

interface CardViewProps {
  card: Card;
  isWinning?: boolean;
  isHeld?: boolean;
  onClick?: () => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isWinning = false,
  isHeld = false,
  onClick,
  interactive = false,
  size = 'md',
  label,
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  const sizeClasses = {
    sm: 'w-14 h-20 text-xs',
    md: 'w-20 h-28 sm:w-24 sm:h-34 text-sm',
    lg: 'w-24 h-36 sm:w-28 sm:h-40 text-base',
  }[size];

  if (!card.isFaceUp) {
    // Luxury Card Back with gold filigree pattern
    return (
      <div
        className={`${sizeClasses} relative rounded-xl transition-all duration-300 select-none shadow-2xl flex-shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '2px solid #b48c36',
          boxShadow: '0 8px 16px rgba(0,0,0,0.7), inset 0 0 10px rgba(180, 140, 54, 0.4)',
        }}
      >
        <div className="absolute inset-1.5 rounded-lg border border-amber-600/40 flex items-center justify-center overflow-hidden bg-slate-900/60">
          {/* Ornamental lattice / diamond pattern */}
          <div
            className="w-full h-full opacity-25"
            style={{
              backgroundImage: `radial-gradient(#d4af37 1px, transparent 1px), radial-gradient(#d4af37 1px, #0b1320 1px)`,
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 6px 6px',
            }}
          />
          <div className="absolute w-8 h-8 rounded-full border border-amber-400/60 flex items-center justify-center bg-black/40 shadow-inner">
            <span className="text-amber-400 font-serif-luxury font-bold text-xs">GR</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`
        ${sizeClasses} relative rounded-xl select-none transition-all duration-300 flex-shrink-0
        ${interactive ? 'cursor-pointer hover:-translate-y-2' : ''}
        ${isHeld ? 'ring-4 ring-amber-400 -translate-y-2.5 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : ''}
        ${isWinning ? 'ring-4 ring-emerald-400 animate-pulse shadow-[0_0_22px_rgba(52,211,153,0.7)]' : ''}
      `}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)',
        border: isHeld ? '2px solid #f59e0b' : isWinning ? '2px solid #10b981' : '1px solid #cbd5e1',
        boxShadow: '0 10px 20px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.9)',
      }}
    >
      {/* Top Left Rank & Suit */}
      <div className={`absolute top-1.5 left-2 flex flex-col items-center leading-tight ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif-luxury tracking-tighter text-sm sm:text-base">{card.rank}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{symbol}</span>
      </div>

      {/* Center Display / Royal Insignia */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {['J', 'Q', 'K', 'A'].includes(card.rank) ? (
          <div className="flex flex-col items-center justify-center opacity-85">
            <span className={`text-2xl sm:text-3xl font-serif-luxury font-black ${isRed ? 'text-rose-600/90' : 'text-slate-800'}`}>
              {card.rank}
            </span>
            <span className={`text-base sm:text-lg ${isRed ? 'text-rose-600' : 'text-slate-800'}`}>
              {symbol}
            </span>
          </div>
        ) : (
          <span className={`text-2xl sm:text-3xl ${isRed ? 'text-rose-600/90' : 'text-slate-900/90'}`}>
            {symbol}
          </span>
        )}
      </div>

      {/* Bottom Right Inverted Rank & Suit */}
      <div className={`absolute bottom-1.5 right-2 flex flex-col items-center leading-tight rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif-luxury tracking-tighter text-sm sm:text-base">{card.rank}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{symbol}</span>
      </div>

      {/* Hold / Selection Badge for 5-Card Draw */}
      {isHeld && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-lg border border-amber-200 uppercase tracking-wider whitespace-nowrap">
          TUTULDU
        </div>
      )}

      {/* Optional Custom Label (e.g. Bust / Blackjack) */}
      {label && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border border-amber-500/50 shadow whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
};
