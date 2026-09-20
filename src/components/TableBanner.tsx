import React from 'react';
import { TableTier, formatLimitText } from '../utils/tableTiers';
import { sound } from '../utils/audio';
import { Crown, Sparkles, Layers, Sliders, ChevronDown } from 'lucide-react';

interface TableBannerProps {
  currentTier: TableTier;
  onOpenSelector: () => void;
  gameName: string;
}

export const TableBanner: React.FC<TableBannerProps> = ({
  currentTier,
  onOpenSelector,
  gameName,
}) => {
  return (
    <div
      className="w-full max-w-5xl mx-auto mb-3 rounded-2xl px-4 py-2.5 bg-slate-950/80 border border-amber-500/30 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
      style={{
        boxShadow: '0 8px 25px rgba(0,0,0,0.6), inset 0 1px 2px rgba(245,158,11,0.2)',
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${
              currentTier.color === 'emerald'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                : currentTier.color === 'blue'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                : currentTier.color === 'purple'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                : currentTier.color === 'amber'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-rose-500/20 border-rose-500/60 text-rose-300'
            }`}
          >
            {currentTier.badge}
          </span>
          <h2 className="font-serif-luxury font-bold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
            {currentTier.name}
          </h2>
        </div>

        <span className="hidden sm:inline text-slate-600">•</span>

        {/* Limit badge */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-amber-300">
          <span className="text-slate-400 font-normal">Limitler:</span>
          <span>{formatLimitText(currentTier.minBet, currentTier.maxBet)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          sound.playClick();
          onOpenSelector();
        }}
        className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow"
      >
        <Sliders className="w-3.5 h-3.5 text-amber-400" />
        <span>Masa Değiştir (Alternatifler)</span>
        <ChevronDown className="w-3.5 h-3.5 text-amber-400 opacity-80" />
      </button>
    </div>
  );
};
