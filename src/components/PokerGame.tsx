import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Card, PokerEvaluation, PokerPhase } from '../types';
import { createDeck } from '../utils/cards';
import { evaluate5CardHand, decideDealerDiscards } from '../utils/pokerEvaluator';
import { CardView } from './CardView';
import { ChipSelector } from './ChipSelector';
import { sound } from '../utils/audio';
import { Trophy, HelpCircle, Flame, Users } from 'lucide-react';

interface PokerGameProps {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onRecordGameResult: (bet: number, won: number, game: 'poker') => void;
  onSwitchToMultiplayer?: () => void;
}

export const PokerGame: React.FC<PokerGameProps> = ({
  bankroll,
  onUpdateBankroll,
  onRecordGameResult,
  onSwitchToMultiplayer,
}) => {
  const [deck, setDeck] = useState<Card[]>(() => createDeck(1));
  const [phase, setPhase] = useState<PokerPhase>('betting');
  const [bet, setBet] = useState<number>(50);
  const [lastBet, setLastBet] = useState<number>(50);
  const [selectedChip, setSelectedChip] = useState<number>(50);

  // Hands
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [heldIndices, setHeldIndices] = useState<number[]>([]);

  // Results
  const [playerEval, setPlayerEval] = useState<PokerEvaluation | null>(null);
  const [dealerEval, setDealerEval] = useState<PokerEvaluation | null>(null);
  const [resultTitle, setResultTitle] = useState<string>('');
  const [resultSubtitle, setResultSubtitle] = useState<string>('');
  const [netWin, setNetWin] = useState<number>(0);

  // Handle Deal
  const handleDeal = () => {
    if (bet <= 0 || bet > bankroll) return;

    sound.playChip();
    onUpdateBankroll(-bet);
    setLastBet(bet);
    setPhase('dealing');
    setHeldIndices([]);
    setResultTitle('');
    setResultSubtitle('');
    setNetWin(0);
    setDealerEval(null);

    const freshDeck = createDeck(1);
    // Deal 5 cards to player (face up), 5 cards to dealer (face down)
    const pCards: Card[] = freshDeck.slice(0, 5).map(c => ({ ...c, isFaceUp: true }));
    const dCards: Card[] = freshDeck.slice(5, 10).map(c => ({ ...c, isFaceUp: false }));
    const remainingDeck = freshDeck.slice(10);

    setDeck(remainingDeck);
    setPlayerCards(pCards);
    setDealerCards(dCards);
    sound.playCardDeal();

    // Initial evaluation of player hand
    const initialEval = evaluate5CardHand(pCards);
    setPlayerEval(initialEval);

    // Auto-recommend hold on pairs or better for player convenience
    if (initialEval.winningIndices.length > 0 && initialEval.rank > 1) {
      setHeldIndices(initialEval.winningIndices);
    }

    setPhase('holding');
  };

  // Toggle Hold Card
  const toggleHold = (index: number) => {
    if (phase !== 'holding') return;
    sound.playClick();
    setHeldIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Draw Phase
  const handleDraw = () => {
    if (phase !== 'holding') return;
    setPhase('drawing');
    sound.playCardDeal();

    let currentDeck = [...deck];

    // 1. Replace player unheld cards
    const newPlayerCards = playerCards.map((card, idx) => {
      if (heldIndices.includes(idx)) {
        return card;
      }
      const newCard = { ...currentDeck[0], isFaceUp: true };
      currentDeck = currentDeck.slice(1);
      return newCard;
    });
    setPlayerCards(newPlayerCards);

    // 2. Dealer AI Discards and Draws
    const dealerDiscards = decideDealerDiscards(dealerCards);
    const newDealerCards = dealerCards.map((card, idx) => {
      if (!dealerDiscards.includes(idx)) {
        return card;
      }
      const newCard = { ...currentDeck[0], isFaceUp: false };
      currentDeck = currentDeck.slice(1);
      return newCard;
    });

    setDeck(currentDeck);

    // 3. Reveal Dealer Cards after a short suspense delay
    setTimeout(() => {
      const revealedDealer = newDealerCards.map(c => ({ ...c, isFaceUp: true }));
      setDealerCards(revealedDealer);
      sound.playCardFlip();

      const pFinalEval = evaluate5CardHand(newPlayerCards);
      const dFinalEval = evaluate5CardHand(revealedDealer);

      setPlayerEval(pFinalEval);
      setDealerEval(dFinalEval);

      // Compare hands
      let payout = 0;
      let title = '';
      let sub = '';

      if (pFinalEval.score > dFinalEval.score) {
        // Player beats dealer!
        // Base win (1:1) + high hand bonus if applicable
        const multiplier = Math.max(1, pFinalEval.payoutMultiplier);
        payout = bet * (1 + multiplier); // Returns bet + winnings
        const profit = payout - bet;

        title = 'TEBRİKLER, KAZANDINIZ!';
        sub = `${pFinalEval.nameTr} yendi: ${dFinalEval.nameTr} (+${multiplier}x Bonus: +$${profit})`;
        setNetWin(profit);
        onUpdateBankroll(payout);
        onRecordGameResult(bet, payout, 'poker');

        sound.playWin();
        if (pFinalEval.rank >= 5) {
          sound.playJackpot();
        }
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } else if (pFinalEval.score === dFinalEval.score) {
        // Push
        payout = bet;
        title = 'BERABERE (PUSH)';
        sub = `Her iki taraf da aynı ele sahip: ${pFinalEval.nameTr}`;
        setNetWin(0);
        onUpdateBankroll(bet);
        onRecordGameResult(bet, bet, 'poker');
      } else {
        // Dealer wins
        title = 'KASA KAZANDI';
        sub = `Krupiye eli üstün: ${dFinalEval.nameTr} > ${pFinalEval.nameTr}`;
        setNetWin(-bet);
        onRecordGameResult(bet, 0, 'poker');
      }

      setResultTitle(title);
      setResultSubtitle(sub);
      setPhase('showdown');
    }, 700);
  };

  // Reset Round
  const handleNewHand = () => {
    sound.playClick();
    setPhase('betting');
    setPlayerCards([]);
    setDealerCards([]);
    setHeldIndices([]);
    setPlayerEval(null);
    setDealerEval(null);
    setResultTitle('');
    setResultSubtitle('');
    setNetWin(0);

    if (bankroll >= lastBet) {
      setBet(lastBet);
    } else {
      setBet(Math.min(bankroll, 50));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Luxury Casino Table Viewport: Heavy Mahogany Rim + Padded Leather Armrest + Curved Felt */}
      <div className="relative w-full wood-rim-mahogany rounded-[36px] p-2 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
        {/* Padded Stitched Leather Armrest Rail */}
        <div className="relative w-full leather-armrest rounded-[28px] p-2 sm:p-3">
          {/* Inner Rich Green Casino Felt Oval Poker Table */}
          <div className="relative w-full casino-felt rounded-[20px] p-4 sm:p-8 min-h-[540px] flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Felt Decorative Gold Filigree and Poker Watermark */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-90 select-none overflow-hidden">
              <div className="w-[85%] max-w-2xl h-44 border border-amber-400/20 rounded-full flex flex-col items-center justify-center p-4">
                <div className="flex items-center gap-4 text-amber-300/30 text-lg sm:text-2xl mb-1">
                  <span>♠</span>
                  <span>♥</span>
                  <span className="font-serif-luxury font-black text-xl sm:text-3xl tracking-[0.2em] text-amber-300/25 uppercase">
                    HIGH STAKES POKER
                  </span>
                  <span>♦</span>
                  <span>♣</span>
                </div>
                <div className="font-serif-luxury font-bold text-[10px] sm:text-xs text-amber-300/25 tracking-widest uppercase">
                  Royal Showdown • 5-Card Draw • European Club Rules
                </div>
              </div>
            </div>

            {/* Top: Header Controls & Multiplayer Switch */}
            <div className="relative z-20 w-full flex items-center justify-between pb-2 border-b border-amber-500/20 mb-2">
              <div className="text-[11px] font-serif-luxury font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span className="gold-gradient-text">VIP Poker Salonu • Tekli Masa</span>
              </div>

              {onSwitchToMultiplayer && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSwitchToMultiplayer();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-amber-500/50 text-amber-300 hover:text-amber-100 text-xs font-serif-luxury font-bold transition shadow"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Çok Oyunculu Masaya Geç</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </button>
              )}
            </div>

            {/* Krupiye / Dealer Zone (Top) with Chip Trays */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {/* Metallic Croupier Chip Rack */}
              <div className="flex items-center gap-3">
                <div className="croupier-tray px-3 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white/40 shadow-sm" />
                  </div>
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white/40 shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-1.5 rounded-full border-2 border-amber-400/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                  <span className="text-xs uppercase font-serif-luxury font-black text-amber-300 tracking-wider">
                    Krupiye Eli
                  </span>
                  {dealerEval && (
                    <span className="text-xs font-bold bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                      {dealerEval.nameTr}
                    </span>
                  )}
                </div>

                <div className="croupier-tray px-3 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400/80 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400/80 shadow-sm" />
                  </div>
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white/60 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white/60 shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[110px] sm:min-h-[140px] pt-1">
                {dealerCards.length === 0 ? (
                  <div className="text-xs text-amber-300/40 font-serif-luxury font-semibold italic border-2 border-dashed border-amber-400/30 rounded-2xl px-8 py-7 bg-slate-950/30 backdrop-blur-sm">
                    Krupiye kartları bekleniyor...
                  </div>
                ) : (
                  dealerCards.map((card, idx) => {
                    const isWinning = dealerEval ? dealerEval.winningIndices.includes(idx) : false;
                    return (
                      <CardView
                        key={`${card.id}-${idx}`}
                        card={card}
                        size="md"
                        isWinning={isWinning && phase === 'showdown'}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Center: Dynamic Result Notice */}
            <div className="relative z-20 my-2 flex flex-col items-center justify-center min-h-[60px]">
              {resultTitle && (
                <div className={`px-6 py-3 rounded-2xl border-2 text-center shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-md max-w-xl ${
                  netWin > 0
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_35px_rgba(52,211,153,0.6)]'
                    : netWin === 0
                    ? 'bg-amber-950/95 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                    : 'bg-rose-950/95 border-rose-500 text-rose-100'
                }`}>
                  <div className="font-serif-luxury font-black text-base sm:text-xl tracking-wide flex items-center justify-center gap-2">
                    {netWin > 0 && <Trophy className="w-5 h-5 text-amber-400" />}
                    {resultTitle}
                  </div>
                  <div className="text-xs sm:text-sm font-medium opacity-90 mt-0.5">
                    {resultSubtitle}
                  </div>
                </div>
              )}
            </div>

            {/* Player Zone (Bottom) */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {/* Player Hand Banner */}
              <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-1.5 rounded-full border-2 border-amber-400/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                <span className="text-xs uppercase font-serif-luxury font-black text-amber-300 tracking-wider">
                  Sizin Eliniz
                </span>
                {playerEval && (
                  <span className="text-xs font-bold bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {playerEval.nameTr}
                  </span>
                )}
              </div>

              {/* Interactive Player Cards */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[110px] sm:min-h-[140px] pt-1">
                {playerCards.length === 0 ? (
                  <div className="text-xs text-amber-300/40 font-serif-luxury font-semibold italic border-2 border-dashed border-amber-400/30 rounded-2xl px-8 py-7 bg-slate-950/30 backdrop-blur-sm">
                    Bahis miktarınızı belirleyip dağıtın
                  </div>
                ) : (
                  playerCards.map((card, idx) => {
                    const isHeld = heldIndices.includes(idx);
                    const isWinning = playerEval ? playerEval.winningIndices.includes(idx) : false;

                    return (
                      <CardView
                        key={`${card.id}-${idx}`}
                        card={card}
                        size="md"
                        interactive={phase === 'holding'}
                        isHeld={isHeld}
                        isWinning={isWinning && phase === 'showdown'}
                        onClick={() => toggleHold(idx)}
                      />
                    );
                  })
                )}
              </div>

              {/* Placed Bet Indicator with 3D Chip Icon */}
              {bet > 0 && phase !== 'betting' && (
                <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-400/60 px-3.5 py-1.5 rounded-full shadow-lg">
                  <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950 shadow">
                    $
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Ante Bahis:</span>
                  <span className="text-xs font-serif-luxury font-black text-amber-200">${bet.toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-xl flex flex-col gap-4">
        {phase === 'betting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full max-w-lg">
              <div className="text-xs font-semibold text-slate-400">
                VIP Masa Limiti: $5 - $1.000.000+
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300">Ante Bahsi:</span>
                <span className="font-serif-luxury font-bold text-lg text-amber-300">
                  ${bet.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            <ChipSelector
              selectedChip={selectedChip}
              onSelectChip={setSelectedChip}
              currentBet={bet}
              bankroll={bankroll}
              onAddBet={(val) => setBet(prev => Math.min(bankroll, prev + val))}
              onSetBet={(val) => setBet(Math.min(bankroll, Math.max(0, val)))}
              onClearBet={() => setBet(0)}
              onAllIn={() => setBet(bankroll)}
            />

            <button
              onClick={handleDeal}
              disabled={bet <= 0 || bet > bankroll}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Kartları Dağıt (Deal)
            </button>
          </div>
        )}

        {phase === 'holding' && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Tutmak istediğiniz kartlara tıklayın, ardından çekilişi başlatın:
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={handleDraw}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Kart Değiştir & Çek (Draw)
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setHeldIndices([0, 1, 2, 3, 4]);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition"
              >
                Tümünü Tut (Stand)
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setHeldIndices([]);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                Tümünü Bırak
              </button>
            </div>
          </div>
        )}

        {phase === 'drawing' && (
          <div className="flex items-center justify-center py-2 text-amber-400 text-sm font-semibold animate-pulse">
            Kartlar değiştiriliyor ve Krupiye eli açılıyor...
          </div>
        )}

        {phase === 'showdown' && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleNewHand}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Yeni El Aç
            </button>
            {bankroll >= lastBet && (
              <button
                onClick={() => {
                  handleNewHand();
                  setTimeout(() => {
                    handleDeal();
                  }, 150);
                }}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-serif-luxury font-bold text-sm uppercase tracking-wider border border-amber-500/40 shadow-lg active:scale-95 transition cursor-pointer"
              >
                Aynı Bahisle Oyna (${lastBet})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
