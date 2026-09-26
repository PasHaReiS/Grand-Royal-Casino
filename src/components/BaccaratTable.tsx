import React from 'react';
import { BaccaratBet, BaccaratBetType } from '../types';
import { sound } from '../utils/audio';
import { BACCARAT_BET_CONFIG } from '../utils/baccaratRules';
import { Crown, Sparkles, Shield, User } from 'lucide-react';
import { Real3DDice, getFaceRotationsForValue } from './Real3DDice';

interface BaccaratTableProps {
  bets: BaccaratBet[];
  onPlaceBet: (type: BaccaratBetType) => void;
  onRemoveBet: (type: BaccaratBetType) => void;
  selectedChip: number;
  currentPoint: number | null;
  disabled?: boolean;
}

export const BaccaratTable: React.FC<BaccaratTableProps> = ({
  bets,
  onPlaceBet,
  onRemoveBet,
  selectedChip,
  currentPoint,
  disabled = false,
}) => {
  // Helper to sum amounts placed on a specific bet type
  const getBetAmount = (type: BaccaratBetType): number => {
    return bets.filter((b) => b.type === type).reduce((sum, b) => sum + b.amount, 0);
  };

  const handleCellClick = (type: BaccaratBetType, e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    sound.playChip();
    onPlaceBet(type);
  };

  const handleCellContextMenu = (type: BaccaratBetType, e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    sound.playChip();
    onRemoveBet(type);
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#07381d] via-[#052c16] to-[#031d0e] rounded-3xl p-4 sm:p-6 border-4 border-amber-600/40 shadow-2xl space-y-4 select-none">
      {/* Table Felt Header Banner */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif-luxury font-black text-sm sm:text-base text-amber-200 tracking-wider uppercase">
              BACCARAT & CASINO BARBUT ZAR MASASI
            </h3>
            <p className="text-[11px] text-amber-400/80">
              Bahis koymak için masaya tıklayın • Sağ tık ile bahsi eksiltin
            </p>
          </div>
        </div>

        {/* Selected chip prompt */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] text-slate-300">Aktif Çip:</span>
          <span className="font-serif-luxury font-black text-amber-300 text-xs sm:text-sm">
            ${selectedChip.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      {/* SECTION 1: BACCARAT PUNTO BANCO ZAR BAHİSLERİ (OYUNCU vs KASA) */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Baccarat Zar Düellosu (Zar 1: Oyuncu vs Zar 2: Kasa)</span>
        </span>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* PLAYER (OYUNCU) */}
          <BettingZone
            title="OYUNCU (PUNTO)"
            subtitle="1. Zar Yüksek Gelir"
            payout="1:1"
            amount={getBetAmount('player')}
            onClick={(e) => handleCellClick('player', e)}
            onContextMenu={(e) => handleCellContextMenu('player', e)}
            colorTheme="blue"
            icon={<User className="w-4 h-4 text-blue-400" />}
          />

          {/* TIE (BERABERLİK) */}
          <BettingZone
            title="BERABERLİK (TIE)"
            subtitle="Çift Zar / Eşitlik"
            payout="8:1"
            amount={getBetAmount('tie')}
            onClick={(e) => handleCellClick('tie', e)}
            onContextMenu={(e) => handleCellContextMenu('tie', e)}
            colorTheme="gold"
            icon={<Crown className="w-4 h-4 text-amber-400" />}
          />

          {/* BANKER (KASA) */}
          <BettingZone
            title="KASA (BANCO)"
            subtitle="2. Zar Yüksek Gelir"
            payout="1:1"
            amount={getBetAmount('banker')}
            onClick={(e) => handleCellClick('banker', e)}
            onContextMenu={(e) => handleCellContextMenu('banker', e)}
            colorTheme="red"
            icon={<Shield className="w-4 h-4 text-red-400" />}
          />
        </div>
      </div>

      {/* SECTION 2: SAYI BAHİSLERİ (PLACE BETS - 4, 5, 6, 8, 9, 10) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <span>Sayı Bahisleri (Place Bets) & Masa Sayısı</span>
          </span>
          {currentPoint && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
              Aktif Sayı: {currentPoint}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(
            [
              { num: 4, type: 'place_4', payout: '9:5' },
              { num: 5, type: 'place_5', payout: '7:5' },
              { num: 6, type: 'place_6', payout: '7:6' },
              { num: 8, type: 'place_8', payout: '7:6' },
              { num: 9, type: 'place_9', payout: '7:5' },
              { num: 10, type: 'place_10', payout: '9:5' },
            ] as const
          ).map((item) => {
            const isPointOnThis = currentPoint === item.num;
            return (
              <button
                key={item.type}
                onClick={(e) => handleCellClick(item.type, e)}
                onContextMenu={(e) => handleCellContextMenu(item.type, e)}
                className={`relative rounded-xl p-2.5 sm:p-3 border text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-between min-h-[75px] ${
                  isPointOnThis
                    ? 'bg-amber-900/60 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-amber-300'
                    : 'bg-emerald-950/70 border-emerald-600/40 hover:border-amber-400 hover:bg-emerald-900/60'
                }`}
              >
                {/* Point ON Puck */}
                {isPointOnThis && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                    ON
                  </span>
                )}

                <span className="font-serif-luxury font-black text-xl sm:text-2xl text-amber-100">
                  {item.num}
                </span>
                <span className="text-[10px] text-amber-400 font-bold">{item.payout}</span>

                {getBetAmount(item.type) > 0 && (
                  <ChipDisplay amount={getBetAmount(item.type)} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PAS HATTI (PASS LINE) & PAS GEÇME (DON'T PASS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <BettingZone
          title="PAS HATTI (PASS LINE)"
          subtitle="7 / 11 Doğal Kazanır • 2, 3, 12 Kaybeder • Sayı Vurursa Alır"
          payout="1:1"
          amount={getBetAmount('pass_line')}
          onClick={(e) => handleCellClick('pass_line', e)}
          onContextMenu={(e) => handleCellContextMenu('pass_line', e)}
          colorTheme="emerald"
        />

        <BettingZone
          title="PAS GEÇME (DON'T PASS)"
          subtitle="2 / 3 Kazanır • 12 Berabere • 7 Veya Sayıdan Önce Gelirse Alır"
          payout="1:1"
          amount={getBetAmount('dont_pass')}
          onClick={(e) => handleCellClick('dont_pass', e)}
          onContextMenu={(e) => handleCellContextMenu('dont_pass', e)}
          colorTheme="slate"
        />
      </div>

      {/* SECTION 4: ALAN BAHSI (FIELD BET) */}
      <div>
        <button
          onClick={(e) => handleCellClick('field', e)}
          onContextMenu={(e) => handleCellContextMenu('field', e)}
          className="relative w-full rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-amber-950/60 via-emerald-950/80 to-amber-950/60 border-2 border-amber-500/50 hover:border-amber-300 transition-all active:scale-98 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex flex-col text-left">
            <span className="font-serif-luxury font-black text-base sm:text-lg text-amber-200 uppercase tracking-wider">
              ALAN BAHSI (FIELD BET)
            </span>
            <span className="text-xs text-slate-300">
              2, 3, 4, 9, 10, 11, 12 Gelirse Kazanır (2 Çift: 2:1 • 12 Çift: 3:1 • Diğerleri 1:1)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {[2, 3, 4, 9, 10, 11, 12].map((n) => (
              <span
                key={n}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  n === 2 || n === 12
                    ? 'bg-amber-400 text-slate-950 font-black shadow ring-1 ring-amber-200'
                    : 'bg-slate-900 border border-amber-500/40 text-amber-200'
                }`}
              >
                {n}
              </span>
            ))}
          </div>

          {getBetAmount('field') > 0 && <ChipDisplay amount={getBetAmount('field')} />}
        </button>
      </div>

      {/* SECTION 5: BARBUT ÇİFTLERİ (HARDWAYS) & ÖZEL ZARLAR */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90">
          Barbut Çiftleri (Hardways) & Yüksek Çarpanlı Zarlar
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {/* 1-1 Snake Eyes */}
          <MiniPropZone
            title="HEP YEK (1-1)"
            payout="30:1"
            amount={getBetAmount('snake_eyes')}
            onClick={(e) => handleCellClick('snake_eyes', e)}
            onContextMenu={(e) => handleCellContextMenu('snake_eyes', e)}
            die1={1}
            die2={1}
          />

          {/* 6-6 Boxcars */}
          <MiniPropZone
            title="DÜŞEŞ (6-6)"
            payout="30:1"
            amount={getBetAmount('boxcars')}
            onClick={(e) => handleCellClick('boxcars', e)}
            onContextMenu={(e) => handleCellContextMenu('boxcars', e)}
            die1={6}
            die2={6}
          />

          {/* 2-2 Hard 4 */}
          <MiniPropZone
            title="DÖRT CİHAR (2-2)"
            payout="9:1"
            amount={getBetAmount('hard_4')}
            onClick={(e) => handleCellClick('hard_4', e)}
            onContextMenu={(e) => handleCellContextMenu('hard_4', e)}
            die1={2}
            die2={2}
          />

          {/* 3-3 Hard 6 */}
          <MiniPropZone
            title="DÜ SE (3-3)"
            payout="9:1"
            amount={getBetAmount('hard_6')}
            onClick={(e) => handleCellClick('hard_6', e)}
            onContextMenu={(e) => handleCellContextMenu('hard_6', e)}
            die1={3}
            die2={3}
          />

          {/* 4-4 Hard 8 */}
          <MiniPropZone
            title="DÖRT DÖRT (4-4)"
            payout="9:1"
            amount={getBetAmount('hard_8')}
            onClick={(e) => handleCellClick('hard_8', e)}
            onContextMenu={(e) => handleCellContextMenu('hard_8', e)}
            die1={4}
            die2={4}
          />

          {/* 5-5 Hard 10 */}
          <MiniPropZone
            title="DÜ BEŞ (5-5)"
            payout="9:1"
            amount={getBetAmount('hard_10')}
            onClick={(e) => handleCellClick('hard_10', e)}
            onContextMenu={(e) => handleCellContextMenu('hard_10', e)}
            die1={5}
            die2={5}
          />
        </div>
      </div>

      {/* SECTION 6: TEK ATIŞ PROPOSITION BAHİSLERİ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <BettingZone
          title="KIRMIZI 7 (ANY SEVEN)"
          subtitle="Tek atışta 7 gelirse"
          payout="4:1"
          amount={getBetAmount('any_seven')}
          onClick={(e) => handleCellClick('any_seven', e)}
          onContextMenu={(e) => handleCellContextMenu('any_seven', e)}
          colorTheme="red"
        />

        <BettingZone
          title="CRAPS (2, 3 VEYA 12)"
          subtitle="Tek atışta Craps gelirse"
          payout="7:1"
          amount={getBetAmount('any_craps')}
          onClick={(e) => handleCellClick('any_craps', e)}
          onContextMenu={(e) => handleCellContextMenu('any_craps', e)}
          colorTheme="slate"
        />

        <BettingZone
          title="YO 11 (ELEVEN)"
          subtitle="Tek atışta 11 gelirse"
          payout="15:1"
          amount={getBetAmount('yo_eleven')}
          onClick={(e) => handleCellClick('yo_eleven', e)}
          onContextMenu={(e) => handleCellContextMenu('yo_eleven', e)}
          colorTheme="gold"
        />
      </div>
    </div>
  );
};

// Sub-component: Clean Interactive Betting Zone
interface BettingZoneProps {
  title: string;
  subtitle: string;
  payout: string;
  amount: number;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  colorTheme?: 'blue' | 'red' | 'gold' | 'emerald' | 'slate';
  icon?: React.ReactNode;
}

const BettingZone: React.FC<BettingZoneProps> = ({
  title,
  subtitle,
  payout,
  amount,
  onClick,
  onContextMenu,
  colorTheme = 'emerald',
  icon,
}) => {
  const themeStyles = {
    blue: 'border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/50 hover:border-blue-400',
    red: 'border-red-500/40 bg-red-950/40 hover:bg-red-900/50 hover:border-red-400',
    gold: 'border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50 hover:border-amber-300',
    emerald: 'border-emerald-600/40 bg-emerald-950/50 hover:bg-emerald-900/60 hover:border-emerald-400',
    slate: 'border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-500',
  }[colorTheme];

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`relative w-full rounded-2xl p-3 sm:p-4 border text-left transition-all duration-150 active:scale-98 flex flex-col justify-between min-h-[85px] shadow ${themeStyles}`}
    >
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-serif-luxury font-black text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-950/90 text-amber-300 text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
          {payout}
        </span>
      </div>

      <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-2">{subtitle}</p>

      {amount > 0 && <ChipDisplay amount={amount} />}
    </button>
  );
};

// Sub-component: Mini Prop / Hardway button
interface MiniPropZoneProps {
  title: string;
  payout: string;
  amount: number;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  die1: number;
  die2: number;
}

const MiniPropZone: React.FC<MiniPropZoneProps> = ({
  title,
  payout,
  amount,
  onClick,
  onContextMenu,
  die1,
  die2,
}) => {
  const rot1 = getFaceRotationsForValue(die1);
  const rot2 = getFaceRotationsForValue(die2);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="relative rounded-xl p-2.5 bg-slate-900/70 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-800/80 transition-all active:scale-95 flex flex-col items-center justify-between text-center min-h-[92px] shadow"
    >
      <div className="flex items-center justify-center gap-1.5 py-1">
        <Real3DDice
          value={die1}
          size={22}
          rotX={rot1.rotX}
          rotY={rot1.rotY}
          rotZ={rot1.rotZ}
          showShadow={false}
        />
        <Real3DDice
          value={die2}
          size={22}
          rotX={rot2.rotX}
          rotY={rot2.rotY}
          rotZ={rot2.rotZ}
          showShadow={false}
        />
      </div>
      <span className="text-[11px] font-serif-luxury font-bold text-slate-200 uppercase mt-1 leading-tight">
        {title}
      </span>
      <span className="text-[10px] font-black text-amber-300 mt-0.5">{payout}</span>

      {amount > 0 && <ChipDisplay amount={amount} />}
    </button>
  );
};

// Visual Chip overlay inside bet area
const ChipDisplay: React.FC<{ amount: number }> = ({ amount }) => {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)] font-serif-luxury font-black text-[11px] border border-amber-200">
      <span className="text-[10px]">$</span>
      <span>{amount >= 1_000_000 ? `${amount / 1_000_000}M` : amount >= 1_000 ? `${amount / 1_000}K` : amount}</span>
    </div>
  );
};
