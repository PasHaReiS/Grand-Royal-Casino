import React from 'react';
import { Crown, Volume2, VolumeX, BookOpen, PlusCircle, User, Edit3, ShieldAlert, Users, Radio } from 'lucide-react';
import { GameView, isVipManager } from '../types';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentView: GameView;
  onSelectView: (view: GameView) => void;
  bankroll: number;
  onReloadBankroll: () => void;
  onOpenVault: () => void;
  onOpenRules: () => void;
  onOpenProfile: () => void;
  playerName: string;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  bankroll,
  onReloadBankroll,
  onOpenVault,
  onOpenRules,
  onOpenProfile,
  playerName,
  isMuted,
  onToggleSound,
}) => {
  const isPasha = isVipManager(playerName);
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div 
          onClick={() => {
            sound.playClick();
            onSelectView('lobby');
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:scale-105 transition">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
          </div>
          <div>
            <div className="font-serif-luxury font-black text-sm sm:text-lg tracking-wider text-amber-300 drop-shadow">
              GRAND ROYALE
            </div>
            <div className="text-[9px] sm:text-[11px] font-semibold text-amber-500/80 uppercase tracking-widest -mt-0.5">
              Lüks Casino Kulübü
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-amber-500/20 shadow-inner">
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('lobby');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'lobby'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            Lobi & İstatistik
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('blackjack');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'blackjack'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            ♠️ Blackjack (21)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('poker');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'poker'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            🃏 5-Card Draw Poker
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('slot');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'slot'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            🎰 Royal Slots
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('roulette');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'roulette'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            🎡 Rulet
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSelectView('multiplayer');
            }}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentView === 'multiplayer'
                ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-500/30'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Canlı Masalar</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        </nav>

        {/* Right Section: Player Profile, Balance & VIP Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Player Name & Profile Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenProfile();
            }}
            title="Oyuncu Adını Değiştir & Profil"
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border transition group active:scale-95 ${
              isPasha
                ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500/50 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isPasha ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {isPasha ? (
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left max-w-[90px] sm:max-w-[130px] truncate">
              <span className="text-[9px] uppercase font-bold tracking-wider leading-none text-amber-400/90">
                {isPasha ? 'VIP Müdür' : 'Oyuncu'}
              </span>
              <span className="font-serif-luxury font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-300 truncate">
                {playerName}
              </span>
            </div>
            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition ml-0.5 opacity-70 group-hover:opacity-100 hidden sm:block" />
          </button>

          {/* Balance Badge & VIP Vault Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-amber-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-inner">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border border-amber-200 flex items-center justify-center shadow">
              <span className="text-[10px] font-black text-slate-950">$</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-amber-400/80 uppercase font-semibold leading-none">VIP Kasa</span>
              <span className="font-serif-luxury font-bold text-xs sm:text-base text-amber-200 tracking-tight leading-tight">
                ${bankroll.toLocaleString('tr-TR')}
              </span>
            </div>

            {/* VIP Reload / Vault Button (Opens Manual Amount & Manager Modal) */}
            <button
              onClick={() => {
                sound.playChip();
                onOpenVault();
              }}
              title={isPasha ? 'VIP Kasa Takviyesi (Manuel Rakam Seç)' : "VIP Kasa (Yalnızca PasHa Yönetebilir)"}
              className={`ml-0.5 sm:ml-1 p-1 rounded-md transition active:scale-95 flex items-center ${
                isPasha
                  ? 'text-amber-400 hover:text-amber-100 hover:bg-amber-500/30'
                  : 'text-amber-500/60 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 sm:w-4 sm:h-4 text-amber-400" />
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition shadow"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Rules & Paytable */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            title="Oyun Kuralları & Kazanç Oranları"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition shadow"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-amber-500/20 bg-slate-950/95 py-2 px-1 text-xs">
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('lobby');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'lobby' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          Lobi
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('blackjack');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'blackjack' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          ♠️ 21
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('poker');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'poker' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          🃏 Poker
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('slot');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'slot' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          🎰 Slot
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('roulette');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'roulette' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          🎡 Rulet
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onSelectView('multiplayer');
          }}
          className={`flex-1 py-1 text-center font-medium ${
            currentView === 'multiplayer' ? 'text-emerald-400 font-bold' : 'text-amber-400'
          }`}
        >
          🌐 Canlı
        </button>
      </div>
    </header>
  );
};
