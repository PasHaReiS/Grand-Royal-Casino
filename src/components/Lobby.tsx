import React from 'react';
import { GameView, UserStats, GameHistoryEntry, isVipManager } from '../types';
import { sound } from '../utils/audio';
import { Crown, Sparkles, ArrowRight, Zap, User, Lock, Edit3, Users, Radio } from 'lucide-react';
import { StatisticsPanel } from './StatisticsPanel';

interface LobbyProps {
  onSelectGame: (view: GameView) => void;
  bankroll: number;
  onReloadBankroll: () => void;
  onOpenVault: () => void;
  onOpenProfile: () => void;
  playerName: string;
  stats: UserStats;
  history: GameHistoryEntry[];
  onResetStats?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onSelectGame,
  bankroll,
  onReloadBankroll,
  onOpenVault,
  onOpenProfile,
  playerName,
  stats,
  history,
  onResetStats,
}) => {
  const isPasha = isVipManager(playerName);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 pb-10">
      {/* Luxury Grand Welcome Hero Banner */}
      <div 
        className="relative w-full rounded-3xl p-6 sm:p-10 border border-amber-500/40 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #101720 0%, #090e14 60%, #030508 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 3px rgba(245,158,11,0.3)',
        }}
      >
        {/* Subtle Background Lattice & Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Özel VIP Casino Salonu
              </div>

              {/* Player Status Tag */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenProfile();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition hover:scale-105 active:scale-95 ${
                  isPasha
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/40'
                }`}
              >
                {isPasha ? (
                  <Crown className="w-3 h-3 text-amber-400" />
                ) : (
                  <User className="w-3 h-3 text-slate-400" />
                )}
                <span>{playerName}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({isPasha ? 'VIP Müdür' : 'İsim Değiştir'})
                </span>
                <Edit3 className="w-3 h-3 opacity-60 ml-0.5" />
              </button>
            </div>

            <h1 className="font-serif-luxury font-black text-2xl sm:text-4xl text-amber-100 tracking-wide leading-tight">
              GRAND ROYALE CASINO & SALON
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Kusursuz kurallarla donatılmış lüks oyun masaları. Split ve Double Down destekli 
              <strong className="text-amber-300"> Blackjack</strong>, el üstünlükleri tam çalışan 
              <strong className="text-amber-300"> 5-Card Draw Poker</strong> ve matematiksel hizalamalı 
              <strong className="text-amber-300"> Royal Slot Makinesi</strong> sizi bekliyor.
            </p>
          </div>

          {/* Quick VIP Bankroll Box */}
          <div className="w-full md:w-auto flex-shrink-0 bg-slate-900/90 border border-amber-500/40 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col gap-3 min-w-[260px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">VIP Kasa</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                isPasha 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isPasha ? 'PasHa Yetkili' : 'PasHa Korumalı'}
              </span>
            </div>
            <div className="font-serif-luxury font-black text-2xl sm:text-3xl text-amber-200">
              ${bankroll.toLocaleString('tr-TR')}
            </div>

            {/* Main Action: Open VIP Vault Modal (Manual Amount Selection & Authorization) */}
            <button
              onClick={() => {
                sound.playChip();
                onOpenVault();
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-serif-luxury font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition flex items-center justify-center gap-1.5 ${
                isPasha
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isPasha ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-slate-950" />
                  VIP Kasa Takviyesi (Manuel Seç)
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  VIP Kasa Takviyesi (PasHa Yetkili)
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Yönetici: <strong className="text-amber-300">PasHa</strong></span>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenProfile();
                }}
                className="text-amber-400 hover:text-amber-200 underline"
              >
                İsim Değiştir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE MULTIPLAYER CASINO FEATURE BANNER */}
      <div
        onClick={() => {
          sound.playClick();
          onSelectGame('multiplayer');
        }}
        className="group relative w-full rounded-3xl p-6 sm:p-7 border-2 border-amber-500/50 hover:border-amber-400 transition-all duration-300 shadow-2xl hover:-translate-y-1 cursor-pointer overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #091a13 0%, #03100a 60%, #020704 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), inset 0 1px 2px rgba(245,158,11,0.4)',
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                CANLI ÇOK OYUNCULU MOD
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                Ortak Masalar
              </span>
            </div>
            <h3 className="font-serif-luxury font-black text-xl sm:text-2xl text-white group-hover:text-amber-300 transition">
              Gerçek Zamanlı Canlı Casino Masaları
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tek başına oynamaktan sıkıldınız mı? Diğer oyuncuların oturduğu Blackjack ve Poker masalarına katılın, aynı kurpiyere karşı hamle yapın, sohbet edin veya kendi özel VIP odanızı kurun!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[11px] text-slate-400">Canlı Bağlantı</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Çoklu Oyuncu Aktif
              </span>
            </div>
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-slate-950 font-serif-luxury font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
            >
              <span>Canlı Masalara Git</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Selection Cards (The 3 Main Modülleri) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-luxury font-bold text-lg sm:text-xl text-amber-300 tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Öne Çıkan Casino Oyunları
          </h2>
          <span className="text-xs text-slate-400">4 Farklı Oyun Modülü</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Blackjack */}
          <div 
            onClick={() => {
              sound.playClick();
              onSelectGame('blackjack');
            }}
            className="group relative rounded-2xl p-6 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
            <div className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-lg">
                ♠️
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Kusursuz Kurallar</span>
                <h3 className="font-serif-luxury font-black text-xl text-slate-100 group-hover:text-amber-300 transition">
                  Blackjack (21)
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Split (Kart Ayırma) ile iki ayrı el oynama, Double Down ile bahsi ikiye katlama, 
                otomatik As hesaplaması ve 3:2 Doğal Blackjack ödemesi.
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/30">Split Aktif</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/30">Double Down</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">3:2 Ödeme</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>Masaya Otur</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: 5-Card Draw Poker */}
          <div 
            onClick={() => {
              sound.playClick();
              onSelectGame('poker');
            }}
            className="group relative rounded-2xl p-6 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
            <div className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-red-950 border border-amber-400/40 flex items-center justify-center text-2xl shadow-lg">
                🃏
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Gerçek El Üstünlükleri</span>
                <h3 className="font-serif-luxury font-black text-xl text-slate-100 group-hover:text-amber-300 transition">
                  5-Card Draw Poker
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Oyuncu ve Krupiye elleri net hiyerarşiyle ayrılmıştır. İstenilen kartları TUT (Hold) 
                ederek değiştirme, Krupiye yapay zekası ve Royal Flush'a kadar bonus çarpanlar.
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">Hold/Draw</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">250x Royal Flush</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">Showdown</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>Masaya Otur</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: Royal Slots */}
          <div 
            onClick={() => {
              sound.playClick();
              onSelectGame('slot');
            }}
            className="group relative rounded-2xl p-6 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition" />
            <div className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 via-amber-600 to-purple-900 border border-amber-400/40 flex items-center justify-center text-2xl shadow-lg">
                🎰
              </div>
              <div>
                <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Kusursuz Makara Hizalaması</span>
                <h3 className="font-serif-luxury font-black text-xl text-slate-100 group-hover:text-amber-300 transition">
                  Royal Jackpot Slots
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Yarıda kesilme veya kaybolma problemi çözülmüş matematiksel makara mekanizması. 
                5 aktif kazanç çizgisi, Wild Yıldız simgeleri ve 100x Taç Jackpot!
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                <span className="px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-600/30">Overflow Korumalı</span>
                <span className="px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-600/30">5 Kazanç Çizgisi</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-600/30">Wild Semboller</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>Makaraları Çevir</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: European Roulette */}
          <div 
            onClick={() => {
              sound.playClick();
              onSelectGame('roulette');
            }}
            className="group relative rounded-2xl p-6 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
            <div className="space-y-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-emerald-950 border border-amber-400/40 flex items-center justify-center text-2xl shadow-lg">
                🎡
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Ahşap & Altın Avrupa Çarkı</span>
                <h3 className="font-serif-luxury font-black text-xl text-slate-100 group-hover:text-amber-300 transition">
                  Grand Royale Rulet
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                37 cepli Avrupa çarkı, ahşap/altın detaylı lüks gövde, dinamik top fiziği ve mobilde akıcı Avrupa bahis masası.
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/30">35:1 Tek Sayı</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/30">Özel Fransız</span>
                <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-600/30">Kırmızı/Siyah</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>Çarkı Döndür</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* Live VIP Player Statistics Dashboard with Time Filters & PasHa Reset */}
      <StatisticsPanel 
        stats={stats} 
        history={history} 
        playerName={playerName}
        onResetStats={onResetStats}
      />
    </div>
  );
};
