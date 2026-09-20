import React, { useState } from 'react';
import { CardView } from './CardView';
import { ChipSelector } from './ChipSelector';
import {
  MultiplayerTableState,
  MultiplayerSeat,
  ChatMessage,
  isVipManager,
} from '../types';
import { sound } from '../utils/audio';
import {
  Crown,
  Users,
  MessageSquare,
  Volume2,
  Copy,
  Check,
  ArrowLeft,
  Clock,
  Sparkles,
  Send,
  HelpCircle,
  LogOut,
  Flame,
  Shield,
} from 'lucide-react';

interface MultiplayerTableProps {
  tableState: MultiplayerTableState;
  playerId: string;
  playerName: string;
  bankroll: number;
  chatMessages: ChatMessage[];
  errorNotice: string | null;
  onSitDown: (seatIndex: number) => void;
  onStandUp: () => void;
  onPlaceBet: (amount: number) => void;
  onClearBet: () => void;
  onStartDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onPokerToggleHold: (cardIndex: number) => void;
  onPokerDraw: () => void;
  onSendChat: (text: string, type?: 'chat' | 'reaction') => void;
  onLeaveTable: () => void;
}

export const MultiplayerTable: React.FC<MultiplayerTableProps> = ({
  tableState,
  playerId,
  playerName,
  bankroll,
  chatMessages,
  errorNotice,
  onSitDown,
  onStandUp,
  onPlaceBet,
  onClearBet,
  onStartDeal,
  onHit,
  onStand,
  onDouble,
  onPokerToggleHold,
  onPokerDraw,
  onSendChat,
  onLeaveTable,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedChipValue, setSelectedChipValue] = useState<number>(100);

  const mySeat: MultiplayerSeat | null =
    tableState.seats.find((s) => s && s.player && s.player.id === playerId) || null;

  const isMyTurn =
    tableState.phase === 'player_turns' &&
    tableState.activeSeatIndex !== null &&
    mySeat !== null &&
    tableState.activeSeatIndex === mySeat.seatIndex;

  const canAffordDouble = mySeat ? bankroll >= mySeat.bet : false;

  const handleCopyTableCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(tableState.tableId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput);
    setChatInput('');
  };

  const quickReactions = [
    { label: '👑 Bol Şans!', text: '👑 Masaya bol şans dilerim!' },
    { label: '🔥 Harika El!', text: '🔥 Muazzam bir el geldi!' },
    { label: '👏 Tebrikler!', text: '👏 Harika oyun, tebrikler!' },
    { label: '💰 Vurgun!', text: '💰 Kasayı vurduk!' },
    { label: '😎 PasHa Farkı', text: '😎 PasHa VIP masasında farkımız!' },
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col gap-4 pb-12">
      {/* Top Header: Table Info, Room ID & Actions */}
      <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-xl flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeaveTable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            Lobiye Dön
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-luxury font-bold text-amber-300 text-base sm:text-lg flex items-center gap-2">
                {tableState.name}
                {tableState.isVipRoom && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans font-bold">
                    VIP
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Masa Limiti: ${tableState.minBet.toLocaleString('tr-TR')} - ${tableState.maxBet.toLocaleString('tr-TR')}</span>
              <span>•</span>
              <span>Tur #{tableState.roundNumber}</span>
              <span>•</span>
              <span className="capitalize font-semibold text-amber-400/90">
                {tableState.gameType === 'blackjack' ? 'Blackjack 21' : '5-Card Draw Poker'}
              </span>
            </div>
          </div>
        </div>

        {/* Room Code & Invite */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Masa Kodu:</span>
            <span className="font-mono font-bold text-amber-300">{tableState.tableId}</span>
            <button
              type="button"
              onClick={handleCopyTableCode}
              title="Masa Kodunu Kopyala"
              className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-200 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isChatOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canlı Sohbet</span>
          </button>
        </div>
      </div>

      {/* Error / Alert banner */}
      {errorNotice && (
        <div className="w-full bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs sm:text-sm font-semibold p-3 rounded-xl shadow flex items-center justify-between">
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Table Layout */}
      <div className="relative w-full flex flex-col lg:flex-row gap-4 items-start">
        {/* Felt Casino Table Felt Area */}
        <div
          className="relative flex-1 w-full rounded-3xl p-4 sm:p-6 border-4 border-amber-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden min-h-[580px] flex flex-col justify-between"
          style={{
            background: 'radial-gradient(ellipse at center, #0a4d2e 0%, #06341f 65%, #031c10 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8), 0 20px 50px rgba(0,0,0,0.9)',
          }}
        >
          {/* Table Felt Decorative Arc & Text */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-25">
            <div className="w-[500px] sm:w-[700px] h-[300px] border-2 border-dashed border-amber-300/40 rounded-t-full" />
            <div className="font-serif-luxury text-amber-200 font-black text-xl sm:text-3xl uppercase tracking-[0.3em] mt-4 select-none">
              GRAND ROYALE • VIP SALON
            </div>
            <div className="text-[10px] sm:text-xs text-amber-300/80 uppercase font-sans tracking-widest mt-1">
              Blackjack 3:2 Öder • Kurpiyer 17'de Kalır • Sigorta 2:1
            </div>
          </div>

          {/* DEALER SECTION (TOP) */}
          <div className="relative z-10 w-full flex flex-col items-center gap-2">
            {/* Dealer Badge & Status */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-1 rounded-full border border-amber-500/40 shadow">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-serif-luxury font-bold text-xs sm:text-sm text-amber-300">
                KURPİYER {tableState.isVipRoom ? 'PASHA' : 'ROYALE'}
              </span>
              {tableState.dealerScore > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                  {tableState.dealerScore}
                </span>
              )}
            </div>

            {/* Dealer Cards */}
            <div className="min-h-[110px] flex items-center justify-center gap-2">
              {tableState.dealerCards.length > 0 ? (
                tableState.dealerCards.map((card, idx) => (
                  <CardView key={card.id || idx} card={card} />
                ))
              ) : (
                <div className="w-20 h-28 border-2 border-dashed border-amber-400/30 rounded-xl flex items-center justify-center text-amber-300/40 text-xs font-serif-luxury font-semibold">
                  Deste
                </div>
              )}
            </div>

            {/* Table Phase Status Bar */}
            <div className="flex items-center gap-2 bg-slate-950/90 px-3.5 py-1 rounded-full border border-amber-500/30 text-xs font-semibold text-amber-300 shadow">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {tableState.phase === 'waiting_bets' && 'Bahisler Alınıyor • Bahsinizi belirleyin'}
                {tableState.phase === 'dealing' && 'Kartlar Dağıtılıyor...'}
                {tableState.phase === 'player_turns' && (
                  <>
                    Sıra:{' '}
                    <strong className="text-amber-200">
                      {tableState.activeSeatIndex !== null && tableState.seats[tableState.activeSeatIndex]?.player?.name}
                    </strong>{' '}
                    ({tableState.turnTimeRemaining}s)
                  </>
                )}
                {tableState.phase === 'dealer_turn' && 'Kurpiyer Oynuyor...'}
                {tableState.phase === 'round_ended' && 'Tur Tamamlandı • Yeni tur başlıyor...'}
              </span>
            </div>
          </div>

          {/* 5 PLAYER SEATS (SEMI-CIRCLE ARC) */}
          <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-2 my-6">
            {tableState.seats.map((seat, index) => {
              const isOccupied = seat && seat.player !== null;
              const isMe = seat && seat.player && seat.player.id === playerId;
              const isTurn = tableState.phase === 'player_turns' && tableState.activeSeatIndex === index;

              return (
                <div
                  key={index}
                  className={`
                    relative rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between min-h-[170px] sm:min-h-[210px]
                    transition-all duration-200 backdrop-blur-sm
                    ${
                      isTurn
                        ? 'bg-amber-950/80 border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-105 z-20'
                        : isOccupied
                        ? 'bg-slate-950/80 border border-amber-500/40 shadow-lg'
                        : 'bg-slate-950/40 border border-dashed border-amber-500/30 hover:border-amber-400 hover:bg-slate-950/60'
                    }
                  `}
                >
                  {/* Seat Index Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span>Koltuk #{index + 1}</span>
                    {isTurn && (
                      <span className="text-amber-300 flex items-center gap-1 font-mono font-black animate-pulse">
                        <Clock className="w-3 h-3" />
                        {tableState.turnTimeRemaining}s
                      </span>
                    )}
                  </div>

                  {isOccupied && seat && seat.player ? (
                    <>
                      {/* Player Info */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-serif-luxury font-bold text-xs ${
                              isVipManager(seat.player.name)
                                ? 'bg-gradient-to-tr from-amber-400 via-amber-600 to-amber-900 text-slate-950 ring-2 ring-amber-300'
                                : 'bg-slate-800 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {seat.player.name.substring(0, 2).toUpperCase()}
                          </div>
                          {isVipManager(seat.player.name) && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1 drop-shadow" />
                          )}
                        </div>

                        <div className="font-bold text-xs text-white truncate max-w-[90px] mt-0.5">
                          {seat.player.name} {isMe && '(Sen)'}
                        </div>

                        {/* Player Bet Badge */}
                        {seat.bet > 0 && (
                          <div className="mt-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-serif-luxury font-black text-[10px] shadow">
                            ${seat.bet.toLocaleString('tr-TR')}
                          </div>
                        )}
                      </div>

                      {/* Cards View */}
                      <div className="flex items-center justify-center gap-1 my-1 min-h-[50px] flex-wrap">
                        {seat.cards.map((card, cIdx) => (
                          <div
                            key={card.id || cIdx}
                            onClick={() => {
                              if (tableState.gameType === 'poker' && isMe && tableState.phase === 'player_turns' && !seat.hasDrawn) {
                                onPokerToggleHold(cIdx);
                              }
                            }}
                            className={`relative cursor-pointer transition ${
                              tableState.gameType === 'poker' && isMe ? 'hover:-translate-y-1' : ''
                            }`}
                          >
                            <CardView card={card} size="sm" />
                            {tableState.gameType === 'poker' && seat.heldIndices?.includes(cIdx) && (
                              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[8px] font-black px-1 rounded shadow">
                                TUT
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Hand Score / Status Badge */}
                      <div className="w-full text-center">
                        {seat.statusText ? (
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded block truncate ${
                              seat.isBusted
                                ? 'bg-red-950 text-red-300 border border-red-700'
                                : seat.isBlackjack
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : seat.payout > 0
                                ? 'bg-emerald-900 text-emerald-200 border border-emerald-500'
                                : 'bg-slate-900 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {seat.statusText}
                          </span>
                        ) : seat.score > 0 ? (
                          <span className="text-[11px] font-serif-luxury font-bold text-amber-300">
                            Skor: {seat.score}
                          </span>
                        ) : null}
                      </div>

                      {/* Leave Seat button if this is me */}
                      {isMe && tableState.phase === 'waiting_bets' && (
                        <button
                          type="button"
                          onClick={onStandUp}
                          className="mt-1 text-[10px] text-slate-400 hover:text-red-300 underline"
                        >
                          Kalk
                        </button>
                      )}
                    </>
                  ) : (
                    /* EMPTY SEAT */
                    <div className="flex flex-col items-center justify-center h-full gap-2 my-auto">
                      <div className="w-10 h-10 rounded-full border border-dashed border-amber-500/40 flex items-center justify-center text-amber-400/60 font-bold text-xs">
                        +
                      </div>
                      <button
                        type="button"
                        onClick={() => onSitDown(index)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] uppercase tracking-wider shadow active:scale-95 transition"
                      >
                        Otur
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* BOTTOM PLAYER INTERACTIVE CONTROLS */}
          <div className="relative z-20 w-full bg-slate-950/95 rounded-2xl p-3 sm:p-4 border border-amber-500/40 shadow-2xl">
            {/* If player is not seated yet */}
            {!mySeat ? (
              <div className="w-full flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs sm:text-sm text-slate-300">
                  Şu an masayı <strong className="text-amber-300">izleyici</strong> olarak takip ediyorsunuz.
                  Bahis oynamak için boş koltuklardan birine <strong className="text-amber-400">"Otur"</strong> butonuna basınız.
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  Kasanız: ${bankroll.toLocaleString('tr-TR')}
                </div>
              </div>
            ) : (
              /* SEATED PLAYER CONTROLS */
              <div className="w-full flex flex-col gap-3">
                {/* Status bar */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Oturan Oyuncu:</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {playerName}
                      {isVipManager(playerName) && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">Koltuk #{mySeat.seatIndex + 1}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Bahsiniz:</span>
                      <span className="font-serif-luxury font-bold text-amber-300 text-sm">
                        ${mySeat.bet.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <span className="text-xs text-slate-400">Kasa:</span>
                      <span className="font-serif-luxury font-bold text-amber-200 text-xs">
                        ${bankroll.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PHASE 1: BETTING CONTROLS */}
                {tableState.phase === 'waiting_bets' && (
                  <div className="w-full flex flex-col items-center gap-3">
                    {/* Chip selector with high roller chips & manual input */}
                    <ChipSelector
                      selectedChip={selectedChipValue}
                      onSelectChip={setSelectedChipValue}
                      currentBet={mySeat.bet}
                      bankroll={bankroll}
                      onAddBet={(amt) => onPlaceBet(mySeat.bet + amt)}
                      onSetBet={(amt) => onPlaceBet(amt)}
                      onClearBet={onClearBet}
                      onAllIn={() => onPlaceBet(bankroll)}
                    />

                    {/* Start round button */}
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={onStartDeal}
                        disabled={mySeat.bet < tableState.minBet}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Turu Başlat / Kartları Dağıt
                      </button>
                    </div>
                  </div>
                )}

                {/* PHASE 2: PLAYER TURNS (BLACKJACK) */}
                {tableState.phase === 'player_turns' && tableState.gameType === 'blackjack' && (
                  <div className="w-full flex flex-col items-center gap-3 py-1">
                    {isMyTurn ? (
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={onHit}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition"
                        >
                          🃏 Kart Çek (Hit)
                        </button>

                        <button
                          type="button"
                          onClick={onStand}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition"
                        >
                          ✋ Pas / Kal (Stand)
                        </button>

                        <button
                          type="button"
                          onClick={onDouble}
                          disabled={!canAffordDouble || mySeat.cards.length !== 2}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ⚡ İkiye Katla (Double)
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>
                          {tableState.activeSeatIndex !== null && tableState.seats[tableState.activeSeatIndex]?.player
                            ? `${tableState.seats[tableState.activeSeatIndex]?.player?.name} hamlesini yapıyor... Lütfen bekleyin.`
                            : 'Diğer oyuncuların turu bekleniyor...'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* PHASE 2: PLAYER TURNS (POKER DRAW) */}
                {tableState.phase === 'player_turns' && tableState.gameType === 'poker' && (
                  <div className="w-full flex flex-col items-center gap-3 py-1">
                    {!mySeat.hasDrawn ? (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <p className="text-xs text-slate-300">
                          Tutmak istediğiniz kartların üzerine tıklayın, ardından kartları değiştirmek için butona basın:
                        </p>
                        <button
                          type="button"
                          onClick={onPokerDraw}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition"
                        >
                          Kartları Değiştir & Çek (Draw)
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Kartlarınızı çektiniz. Diğer oyuncuların hamlesi bekleniyor...
                      </div>
                    )}
                  </div>
                )}

                {/* DEALER OR ROUND ENDED NOTICE */}
                {(tableState.phase === 'dealer_turn' || tableState.phase === 'round_ended') && (
                  <div className="w-full text-center py-1">
                    <span className="text-xs font-semibold text-amber-300">
                      {tableState.phase === 'dealer_turn'
                        ? 'Kurpiyer eli açıyor ve kart çekiyor...'
                        : 'Tur tamamlandı! Kazananlar ödüllerini aldı. Yeni tur birazdan başlıyor...'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SIDE LIVE CHAT & TABLE LOGS DRAWER */}
        {isChatOpen && (
          <div className="w-full lg:w-80 flex-shrink-0 bg-slate-950/90 rounded-2xl p-3 sm:p-4 border border-amber-500/30 backdrop-blur-md shadow-2xl flex flex-col h-[580px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="font-serif-luxury font-bold text-xs sm:text-sm text-amber-300">
                  Masa Canlı Sohbet
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {chatMessages.length} mesaj
              </span>
            </div>

            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin flex-shrink-0">
              {quickReactions.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => onSendChat(q.text, 'reaction')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[10px] font-semibold whitespace-nowrap active:scale-95 transition"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 scrollbar-thin text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl text-xs ${
                    msg.type === 'system'
                      ? 'bg-amber-950/40 border border-amber-500/20 text-amber-300 text-[11px] italic'
                      : msg.senderId === playerId
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-100 ml-4'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold flex items-center gap-1">
                      {msg.senderName}
                      {msg.isPasha && <Crown className="w-3 h-3 text-amber-400" />}
                    </span>
                    <span className="text-[9px]">
                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="break-words font-medium">{msg.text}</div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex items-center gap-1.5 pt-2 border-t border-slate-800 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Mesaj yazın..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-100 text-xs focus:outline-none focus:border-amber-400 transition placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
