import React, { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Coins, 
  Flame, 
  Calendar, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  RotateCcw,
  Lock,
  Crown,
  AlertTriangle,
  Check
} from 'lucide-react';
import { StatTimeFilter, GameHistoryEntry, UserStats, isVipManager } from '../types';
import { computeFilteredStats, formatCurrency } from '../utils/statsHelper';
import { sound } from '../utils/audio';

interface StatisticsPanelProps {
  stats: UserStats;
  history: GameHistoryEntry[];
  playerName?: string;
  onResetStats?: () => void;
}

interface FilterOption {
  id: StatTimeFilter;
  label: string;
  shortLabel: string;
  description: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'daily', label: 'Günlük', shortLabel: '24S', description: 'Bugün / Son 24 Saat' },
  { id: 'weekly', label: 'Haftalık', shortLabel: '7G', description: 'Son 7 Gün' },
  { id: 'monthly', label: 'Aylık', shortLabel: '30G', description: 'Son 30 Gün' },
  { id: 'yearly', label: 'Yıllık', shortLabel: '365G', description: 'Son 365 Gün / Bu Yıl' },
  { id: 'all', label: 'Tüm Zamanlar', shortLabel: 'Tümü', description: 'Tüm Oyun Geçmişi' },
];

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ 
  stats, 
  history,
  playerName = '',
  onResetStats 
}) => {
  const [selectedFilter, setSelectedFilter] = useState<StatTimeFilter>('daily');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const isPasha = isVipManager(playerName);

  const filteredStats = computeFilteredStats(history, selectedFilter, stats);
  const isProfitable = filteredStats.netProfit >= 0;

  const currentFilterMeta = FILTER_OPTIONS.find(f => f.id === selectedFilter) || FILTER_OPTIONS[0];

  const handleConfirmReset = () => {
    if (!isPasha || !onResetStats) return;
    sound.playChip();
    onResetStats();
    setShowConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
    }, 2500);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Bar with Title & Time Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif-luxury font-bold text-base sm:text-lg text-amber-200 tracking-wide truncate">
                VIP Oyuncu Performans Paneli
              </h2>
              {isPasha && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  <Crown className="w-3 h-3 text-amber-400" />
                  PasHa Yetkisi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Zaman aralığı: <span className="text-amber-300 font-medium">{currentFilterMeta.description}</span>
            </p>
          </div>
        </div>

        {/* Right Section: PasHa Reset Action & Time Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* PasHa Exclusive Reset Button / Non-Pasha Locked Badge */}
          {isPasha ? (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowConfirmReset(true);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-serif-luxury font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-rose-100 transition active:scale-95 shadow flex items-center gap-1.5 whitespace-nowrap"
              title="PasHa Yetkisi: Tüm istatistikleri ve oyun geçmişini sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Sıfırla</span>
            </button>
          ) : (
            <div 
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-500 select-none"
              title="İstatistik sıfırlama yetkisi VIP kuralları gereği yalnızca 'PasHa' kullanıcısına aittir"
            >
              <Lock className="w-3 h-3 text-slate-600" />
              <span>Sıfırlama: PasHa</span>
            </div>
          )}

          {/* Time Filter Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-amber-500/30 shadow-inner overflow-x-auto">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedFilter(filter.id);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-serif-luxury font-bold transition-all whitespace-nowrap text-center ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                  }`}
                  title={filter.description}
                >
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Success Notification after Reset */}
      {resetSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Tüm istatistikler ve oyun geçmişi PasHa yetkisiyle başarıyla sıfırlandı.</span>
        </div>
      )}

      {/* PasHa Reset Confirmation Modal Banner */}
      {showConfirmReset && isPasha && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-950 to-rose-950/90 border-2 border-rose-500/60 shadow-[0_10px_30px_rgba(225,29,72,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="font-serif-luxury font-bold text-sm text-rose-200">
                İstatistikleri ve Geçmişi Sıfırlamak İstiyor Musunuz?
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Bu işlem <strong className="text-amber-300">PasHa</strong> yetkisiyle tüm oyun verilerini, toplam bahisleri ve galibiyet kayıtlarını temizleyecektir.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowConfirmReset(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-serif-luxury font-bold uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Evet, Sıfırla</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Key Metric Cards (Designed with responsive scaling to guarantee numbers NEVER overflow boxes) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Toplam Oyun */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">Toplam Oyun</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl text-slate-100 truncate font-mono">
              {filteredStats.gamesPlayed.toLocaleString('tr-TR')}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              {filteredStats.winCount} galibiyet
            </span>
          </div>
        </div>

        {/* Card 2: Toplam Bahis */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">Toplam Bahis</span>
            <Coins className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div 
              className="font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl text-amber-300 truncate font-mono"
              title={`$${filteredStats.totalBets.toLocaleString('tr-TR')}`}
            >
              {formatCurrency(filteredStats.totalBets)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              Masaya yatırılan
            </span>
          </div>
        </div>

        {/* Card 3: Toplam Kazanılan */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">Toplam Kazanç</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div 
              className="font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl text-emerald-400 truncate font-mono"
              title={`$${filteredStats.totalWon.toLocaleString('tr-TR')}`}
            >
              {formatCurrency(filteredStats.totalWon)}
            </div>
            <span className="text-[10px] text-emerald-500/80 block truncate">
              Toplam geri dönüş
            </span>
          </div>
        </div>

        {/* Card 4: Net Kâr / Zarar */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">Net Kâr / Zarar</span>
            {isProfitable ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            )}
          </div>
          <div className="min-w-0">
            <div 
              className={`font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl truncate font-mono ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={`$${filteredStats.netProfit.toLocaleString('tr-TR')}`}
            >
              {isProfitable ? '+' : ''}{formatCurrency(filteredStats.netProfit)}
            </div>
            <span className={`text-[10px] block truncate font-medium ${isProfitable ? 'text-emerald-500/90' : 'text-rose-500/90'}`}>
              {isProfitable ? 'Kârda' : 'Zararda'}
            </span>
          </div>
        </div>

        {/* Card 5: Kazanma Oranı */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">Kazanma Oranı</span>
            <Percent className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl text-yellow-300 truncate font-mono">
              %{filteredStats.winRate}
            </div>
            {/* Tiny Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, filteredStats.winRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 6: En Yüksek Tekil Kazanç */}
        <div className="min-w-0 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider truncate">En İyi Kazanç</span>
            <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          </div>
          <div className="min-w-0">
            <div 
              className="font-serif-luxury font-bold text-lg sm:text-xl lg:text-2xl text-amber-300 truncate font-mono"
              title={`$${filteredStats.bestWin.toLocaleString('tr-TR')}`}
            >
              {formatCurrency(filteredStats.bestWin)}
            </div>
            <span className="text-[10px] text-amber-500/80 block truncate">
              Tek elde rekor
            </span>
          </div>
        </div>
      </div>

      {/* Game Breakdown Section (4 Discrete Casino Games: Blackjack, Poker, Slot, Rulet) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Oyun Bazlı İstatistikler ({currentFilterMeta.label})</span>
          <span className="text-[11px] text-amber-400/80">Detaylı Dağılım</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Blackjack */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-md flex items-center justify-between gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-lg flex-shrink-0">
                ♠️
              </div>
              <div className="min-w-0">
                <span className="font-serif-luxury font-bold text-xs text-slate-200 block truncate">
                  Blackjack (21)
                </span>
                <span className="text-[11px] text-slate-400 block truncate font-mono">
                  {filteredStats.blackjack.won} Galibiyet / {filteredStats.blackjack.played} El
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-serif-luxury font-black text-xs sm:text-sm text-emerald-400 font-mono block">
                %{filteredStats.blackjack.winRate}
              </span>
              <span className="text-[10px] text-slate-500 block">Kazanma</span>
            </div>
          </div>

          {/* 5-Card Draw Poker */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-md flex items-center justify-between gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-lg flex-shrink-0">
                🃏
              </div>
              <div className="min-w-0">
                <span className="font-serif-luxury font-bold text-xs text-slate-200 block truncate">
                  Draw Poker
                </span>
                <span className="text-[11px] text-slate-400 block truncate font-mono">
                  {filteredStats.poker.won} Galibiyet / {filteredStats.poker.played} El
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-serif-luxury font-black text-xs sm:text-sm text-amber-300 font-mono block">
                %{filteredStats.poker.winRate}
              </span>
              <span className="text-[10px] text-slate-500 block">Kazanma</span>
            </div>
          </div>

          {/* Royal Slots */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-md flex items-center justify-between gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-lg flex-shrink-0">
                🎰
              </div>
              <div className="min-w-0">
                <span className="font-serif-luxury font-bold text-xs text-slate-200 block truncate">
                  Royal Slots
                </span>
                <span className="text-[11px] text-slate-400 block truncate font-mono">
                  {filteredStats.slot.won} Vurgun / {filteredStats.slot.played} Spin
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-serif-luxury font-black text-xs sm:text-sm text-yellow-300 font-mono block">
                %{filteredStats.slot.winRate}
              </span>
              <span className="text-[10px] text-slate-500 block">Kazanma</span>
            </div>
          </div>

          {/* Grand Royale Rulet */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-md flex items-center justify-between gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-500/30 flex items-center justify-center text-lg flex-shrink-0">
                🎡
              </div>
              <div className="min-w-0">
                <span className="font-serif-luxury font-bold text-xs text-slate-200 block truncate">
                  Avrupa Ruleti
                </span>
                <span className="text-[11px] text-slate-400 block truncate font-mono">
                  {filteredStats.roulette.won} İsabetsel / {filteredStats.roulette.played} Çevirme
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-serif-luxury font-black text-xs sm:text-sm text-emerald-400 font-mono block">
                %{filteredStats.roulette.winRate}
              </span>
              <span className="text-[10px] text-slate-500 block">Kazanma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
