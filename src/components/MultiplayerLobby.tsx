import React, { useState } from 'react';
import { TableSummary, isVipManager } from '../types';
import { sound } from '../utils/audio';
import {
  Crown,
  Users,
  Sparkles,
  ArrowRight,
  Plus,
  Radio,
  Flame,
  Shield,
  Key,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';
import { CasinoAmountInput } from './CasinoNumpad';

interface MultiplayerLobbyProps {
  tables: TableSummary[];
  playerName: string;
  bankroll: number;
  onJoinTable: (
    tableId: string,
    opts?: { name?: string; gameType?: 'blackjack' | 'poker'; minBet?: number; maxBet?: number }
  ) => void;
  onRefresh: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  tables,
  playerName,
  bankroll,
  onJoinTable,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'blackjack' | 'poker' | 'vip'>('all');
  const [customRoomCode, setCustomRoomCode] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Custom table creation form
  const [customName, setCustomName] = useState<string>(`${playerName}'in VIP Masası`);
  const [customGameType, setCustomGameType] = useState<'blackjack' | 'poker'>('blackjack');
  const [customMinBet, setCustomMinBet] = useState<number>(50);
  const [customMaxBet, setCustomMaxBet] = useState<number>(500000);

  const isPasha = isVipManager(playerName);

  const filteredTables = tables.filter((t) => {
    if (filter === 'blackjack') return t.gameType === 'blackjack';
    if (filter === 'poker') return t.gameType === 'poker';
    if (filter === 'vip') return t.isVipRoom;
    return true;
  });

  const handleJoinCustomRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customRoomCode.trim();
    if (!clean) return;
    sound.playChip();
    onJoinTable(clean);
  };

  const handleCreateCustomRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    sound.playChip();
    onJoinTable(roomId, {
      name: customName.trim() || 'Özel VIP Masası',
      gameType: customGameType,
      minBet: customMinBet,
      maxBet: customMaxBet,
    });
    setShowCreateModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Lobby Header Banner */}
      <div
        className="relative w-full rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #101720 0%, #061c13 50%, #030508 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 3px rgba(245,158,11,0.3)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Canlı Çok Oyunculu Masalar (Multiplayer)
            </div>
            <h1 className="font-serif-luxury font-black text-2xl sm:text-4xl text-white drop-shadow">
              Gerçek Oyuncularla Canlı Masalar
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Blackjack veya 5-Card Draw masalarında boş bir koltuğa oturun, diğer oyuncularla birlikte kurpiyere karşı oynayın ve canlı sohbette kutlama yapın.
            </p>
          </div>

          {/* Quick Stats & Custom Room Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowCreateModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-2 font-serif-luxury"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Yeni Özel Masa Aç
            </button>

            {/* Join by Code Form */}
            <form onSubmit={handleJoinCustomRoom} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Key className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value)}
                  placeholder="Masa Kodu Gir..."
                  className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-amber-200 text-xs focus:outline-none focus:border-amber-300 transition placeholder-slate-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={!customRoomCode.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs transition disabled:opacity-40"
              >
                Katıl
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Refresh Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-amber-500/30">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Tüm Masalar ({tables.length})
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter('blackjack');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'blackjack'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            ♠️ Blackjack (21)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter('poker');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'poker'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            🃏 Draw Poker
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setFilter('vip');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filter === 'vip'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                : 'text-amber-400 hover:text-amber-200'
            }`}
          >
            <Crown className="w-3 h-3" />
            VIP Masalar
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onRefresh();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          Masaları Yenile
        </button>
      </div>

      {/* Active Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table) => {
          const isFull = table.seatedCount >= table.maxSeats;

          return (
            <div
              key={table.tableId}
              className={`
                relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4
                bg-slate-950/90 hover:border-amber-400/80 shadow-xl
                ${table.isVipRoom ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-slate-800'}
              `}
            >
              <div>
                {/* Header: Title & Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-serif-luxury font-bold text-base text-white flex items-center gap-1.5">
                      {table.name}
                      {table.isVipRoom && <Crown className="w-4 h-4 text-amber-400" />}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      Oyun:{' '}
                      <strong className="text-amber-300">
                        {table.gameType === 'blackjack' ? 'Blackjack 21' : '5-Card Draw Poker'}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isFull
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}
                  >
                    {isFull ? 'Masa Dolu' : 'Boş Koltuk Var'}
                  </span>
                </div>

                {/* Table Info Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Koltuk Durumu:</span>
                    <span className="font-bold text-white flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      {table.seatedCount} / {table.maxSeats} Oturan
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">İzleyiciler:</span>
                    <span className="font-bold text-slate-300">
                      {table.playerCount} Çevrimiçi
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Asgari Bahis:</span>
                    <span className="font-bold text-amber-300 font-serif-luxury">
                      ${table.minBet.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Azami Bahis:</span>
                    <span className="font-bold text-amber-300 font-serif-luxury">
                      ${table.maxBet.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {table.tableId}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    sound.playChip();
                    onJoinTable(table.tableId);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition flex items-center gap-1.5"
                >
                  Masaya Katıl
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE CUSTOM TABLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-950 border border-amber-500/50 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
              <h3 className="font-serif-luxury font-bold text-lg text-amber-300 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Yeni Çok Oyunculu Masa Aç
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomRoom} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Masa Adı</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Oyun Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomGameType('blackjack')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      customGameType === 'blackjack'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    ♠️ Blackjack (21)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomGameType('poker')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      customGameType === 'poker'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    🃏 5-Card Draw Poker
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Min Bahis ($)</label>
                  <CasinoAmountInput
                    id="create-table-min-bet"
                    value={customMinBet}
                    onChange={(val) => setCustomMinBet(parseInt(val, 10) || 10)}
                    onApply={(amt) => setCustomMinBet(amt || 10)}
                    bankroll={10000000}
                    placeholder="10"
                    title="Minimum Bahis Limiti"
                    subtitle="Masanın en düşük fiş tutarını belirleyin"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Max Bahis ($)</label>
                  <CasinoAmountInput
                    id="create-table-max-bet"
                    value={customMaxBet}
                    onChange={(val) => setCustomMaxBet(parseInt(val, 10) || 100000)}
                    onApply={(amt) => setCustomMaxBet(amt || 100000)}
                    bankroll={10000000}
                    placeholder="100000"
                    title="Maksimum Bahis Limiti"
                    subtitle="Masanın en yüksek fiş tutarını belirleyin"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold uppercase tracking-wider shadow"
                >
                  Masayı Kur ve Otur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
