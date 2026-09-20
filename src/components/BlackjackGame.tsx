import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Card, BlackjackHand, BlackjackPhase } from '../types';
import { createDeck } from '../utils/cards';
import { calculateBlackjackHand, canSplit, canDoubleDown } from '../utils/blackjackRules';
import { CardView } from './CardView';
import { ChipSelector } from './ChipSelector';
import { sound } from '../utils/audio';
import { ShieldAlert, Sparkles, Trophy, Users } from 'lucide-react';

interface BlackjackGameProps {
  bankroll: number;
  onUpdateBankroll: (delta: number) => void;
  onRecordGameResult: (bet: number, won: number, game: 'blackjack') => void;
  onSwitchToMultiplayer?: () => void;
}

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  bankroll,
  onUpdateBankroll,
  onRecordGameResult,
  onSwitchToMultiplayer,
}) => {
  const [deck, setDeck] = useState<Card[]>(() => createDeck(6));
  const [phase, setPhase] = useState<BlackjackPhase>('betting');
  const [bet, setBet] = useState<number>(50);
  const [lastBet, setLastBet] = useState<number>(50);
  const [selectedChip, setSelectedChip] = useState<number>(50);

  // Dealer State
  const [dealerCards, setDealerCards] = useState<Card[]>([]);

  // Player Hands (support for Split)
  const [playerHands, setPlayerHands] = useState<BlackjackHand[]>([
    {
      id: 'hand-1',
      cards: [],
      bet: 0,
      isBusted: false,
      isStanding: false,
      isBlackjack: false,
      isDoubled: false,
    },
  ]);
  const [activeHandIndex, setActiveHandIndex] = useState<number>(0);
  const [roundResultMessage, setRoundResultMessage] = useState<string>('');
  const [roundNetWin, setRoundNetWin] = useState<number>(0);

  // Helper: draw card from deck
  const drawCard = (isFaceUp: boolean = true): { card: Card; newDeck: Card[] } => {
    let currentDeck = deck;
    if (currentDeck.length < 15) {
      currentDeck = createDeck(6);
    }
    const card = { ...currentDeck[0], isFaceUp };
    const newDeck = currentDeck.slice(1);
    setDeck(newDeck);
    return { card, newDeck };
  };

  // Start Deal
  const handleDeal = () => {
    if (bet <= 0 || bet > bankroll) return;

    sound.playChip();
    onUpdateBankroll(-bet);
    setLastBet(bet);
    setPhase('dealing');
    setRoundResultMessage('');
    setRoundNetWin(0);

    let currentDeck = deck.length < 15 ? createDeck(6) : [...deck];

    // Card 1 to Player
    const p1 = { ...currentDeck[0], isFaceUp: true };
    // Card 1 to Dealer
    const d1 = { ...currentDeck[1], isFaceUp: true };
    // Card 2 to Player
    const p2 = { ...currentDeck[2], isFaceUp: true };
    // Card 2 to Dealer (Hole Card, face down)
    const d2 = { ...currentDeck[3], isFaceUp: false };

    currentDeck = currentDeck.slice(4);
    setDeck(currentDeck);

    const initialPlayerCards = [p1, p2];
    const initialDealerCards = [d1, d2];

    setDealerCards(initialDealerCards);
    sound.playCardDeal();

    const pCalc = calculateBlackjackHand(initialPlayerCards);
    const initialHand: BlackjackHand = {
      id: 'hand-1',
      cards: initialPlayerCards,
      bet: bet,
      isBusted: false,
      isStanding: false,
      isBlackjack: pCalc.isBlackjack,
      isDoubled: false,
    };

    setPlayerHands([initialHand]);
    setActiveHandIndex(0);

    // Check Natural Blackjack
    if (pCalc.isBlackjack) {
      setTimeout(() => {
        // Reveal dealer hole card
        const revealedDealer = initialDealerCards.map(c => ({ ...c, isFaceUp: true }));
        setDealerCards(revealedDealer);
        sound.playCardFlip();

        const dCalc = calculateBlackjackHand(revealedDealer);
        if (dCalc.isBlackjack) {
          // Push
          onUpdateBankroll(bet);
          setRoundResultMessage('BERABERE (Her İki Tarafta Blackjack!)');
          setRoundNetWin(0);
          onRecordGameResult(bet, bet, 'blackjack');
        } else {
          // Player Blackjack 3:2 payout (bet + 1.5 * bet)
          const winAmount = bet + Math.floor(bet * 1.5);
          onUpdateBankroll(winAmount);
          sound.playJackpot();
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          setRoundResultMessage(`BLACKJACK! (3:2 Ödeme: +$${Math.floor(bet * 1.5)})`);
          setRoundNetWin(Math.floor(bet * 1.5));
          onRecordGameResult(bet, winAmount, 'blackjack');
        }
        setPhase('roundOver');
      }, 700);
    } else {
      setPhase('playerTurn');
    }
  };

  // Player Action: Hit
  const handleHit = () => {
    if (phase !== 'playerTurn') return;
    sound.playCardDeal();

    const { card } = drawCard(true);
    setPlayerHands(prevHands => {
      const newHands = [...prevHands];
      const currentHand = { ...newHands[activeHandIndex] };
      currentHand.cards = [...currentHand.cards, card];

      const calc = calculateBlackjackHand(currentHand.cards);
      if (calc.isBust) {
        currentHand.isBusted = true;
        currentHand.isStanding = true;
        currentHand.statusText = 'PATLADI (Bust)';
      } else if (calc.total === 21) {
        currentHand.isStanding = true;
        currentHand.statusText = '21';
      }

      newHands[activeHandIndex] = currentHand;
      return newHands;
    });
  };

  // Check if we should advance to next split hand or dealer turn
  useEffect(() => {
    if (phase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!currentHand) return;

    if (currentHand.isStanding || currentHand.isBusted) {
      // Check if there is a second hand to play
      if (activeHandIndex < playerHands.length - 1) {
        // Move to hand 2
        setActiveHandIndex(activeHandIndex + 1);
        sound.playChip();
      } else {
        // All player hands finished, proceed to dealer
        startDealerTurn();
      }
    }
  }, [playerHands, activeHandIndex, phase]);

  // Player Action: Stand
  const handleStand = () => {
    if (phase !== 'playerTurn') return;
    sound.playClick();

    setPlayerHands(prevHands => {
      const newHands = [...prevHands];
      newHands[activeHandIndex] = {
        ...newHands[activeHandIndex],
        isStanding: true,
      };
      return newHands;
    });
  };

  // Player Action: Double Down
  const handleDoubleDown = () => {
    if (phase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!canDoubleDown(currentHand, bankroll)) return;

    sound.playChip();
    onUpdateBankroll(-currentHand.bet);

    const { card } = drawCard(true);
    sound.playCardDeal();

    setPlayerHands(prevHands => {
      const newHands = [...prevHands];
      const doubledHand = { ...newHands[activeHandIndex] };
      doubledHand.bet = doubledHand.bet * 2;
      doubledHand.isDoubled = true;
      doubledHand.cards = [...doubledHand.cards, card];

      const calc = calculateBlackjackHand(doubledHand.cards);
      if (calc.isBust) {
        doubledHand.isBusted = true;
        doubledHand.statusText = 'PATLADI (Bust)';
      }
      doubledHand.isStanding = true; // Double down stands after 1 card

      newHands[activeHandIndex] = doubledHand;
      return newHands;
    });
  };

  // Player Action: Split (Kartları Ayırma)
  const handleSplit = () => {
    if (phase !== 'playerTurn') return;
    const currentHand = playerHands[activeHandIndex];
    if (!canSplit(currentHand, bankroll)) return;

    sound.playChip();
    onUpdateBankroll(-currentHand.bet);

    // Split initial 2 cards into 2 hands
    const [card1, card2] = currentHand.cards;

    // Draw 1 card for hand 1 and 1 card for hand 2
    let currentDeck = deck.length < 15 ? createDeck(6) : [...deck];
    const newCard1 = { ...currentDeck[0], isFaceUp: true };
    const newCard2 = { ...currentDeck[1], isFaceUp: true };
    currentDeck = currentDeck.slice(2);
    setDeck(currentDeck);

    sound.playCardDeal();

    const hand1: BlackjackHand = {
      id: 'hand-1-split',
      cards: [card1, newCard1],
      bet: currentHand.bet,
      isBusted: false,
      isStanding: false,
      isBlackjack: false,
      isDoubled: false,
    };

    const hand2: BlackjackHand = {
      id: 'hand-2-split',
      cards: [card2, newCard2],
      bet: currentHand.bet,
      isBusted: false,
      isStanding: false,
      isBlackjack: false,
      isDoubled: false,
    };

    setPlayerHands([hand1, hand2]);
    setActiveHandIndex(0);
  };

  // Dealer Turn Execution
  const startDealerTurn = () => {
    setPhase('dealerTurn');

    // Check if all player hands busted
    const allBusted = playerHands.every(h => h.isBusted);

    // Reveal dealer hole card
    setTimeout(() => {
      const revealedDealer = dealerCards.map(c => ({ ...c, isFaceUp: true }));
      setDealerCards(revealedDealer);
      sound.playCardFlip();

      if (allBusted) {
        // Dealer doesn't need to draw if all player hands busted
        finalizeRound(revealedDealer);
        return;
      }

      // Dealer draws cards until total >= 17
      playDealerDrawLoop(revealedDealer);
    }, 600);
  };

  const playDealerDrawLoop = (currentDealer: Card[]) => {
    let dCalc = calculateBlackjackHand(currentDealer);

    if (dCalc.total < 17) {
      setTimeout(() => {
        const { card } = drawCard(true);
        sound.playCardDeal();
        const updated = [...currentDealer, card];
        setDealerCards(updated);
        playDealerDrawLoop(updated);
      }, 700);
    } else {
      finalizeRound(currentDealer);
    }
  };

  // Finalize round & calculate payouts
  const finalizeRound = (finalDealerCards: Card[]) => {
    const dealerCalc = calculateBlackjackHand(finalDealerCards);
    let totalPayout = 0;
    let totalBet = 0;
    let winCount = 0;
    let pushCount = 0;

    const evaluatedHands = playerHands.map(hand => {
      totalBet += hand.bet;
      const playerCalc = calculateBlackjackHand(hand.cards);
      let status = '';
      let payout = 0;

      if (hand.isBusted) {
        status = 'KAYBETTİ (Patladı)';
        payout = 0;
      } else if (dealerCalc.isBust) {
        status = 'KAZANDI! (Krupiye Patladı)';
        payout = hand.bet * 2;
        winCount++;
      } else if (playerCalc.total > dealerCalc.total) {
        status = 'KAZANDI!';
        payout = hand.bet * 2;
        winCount++;
      } else if (playerCalc.total === dealerCalc.total) {
        status = 'BERABERE (İade)';
        payout = hand.bet;
        pushCount++;
      } else {
        status = 'KAYBETTİ';
        payout = 0;
      }

      totalPayout += payout;
      return { ...hand, statusText: status, payout };
    });

    setPlayerHands(evaluatedHands);

    if (totalPayout > 0) {
      onUpdateBankroll(totalPayout);
    }

    const netWin = totalPayout - totalBet;
    setRoundNetWin(netWin);
    onRecordGameResult(totalBet, totalPayout, 'blackjack');

    if (netWin > 0) {
      sound.playWin();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setRoundResultMessage(`TEBRİKLER! Toplam Kazanç: +$${netWin}`);
    } else if (netWin === 0 && pushCount > 0) {
      sound.playClick();
      setRoundResultMessage('BERABERE! Bahisler İade Edildi.');
    } else {
      setRoundResultMessage('KASA KAZANDI');
    }

    setPhase('roundOver');
  };

  // Reset for Next Round
  const handleNewRound = () => {
    sound.playClick();
    setPhase('betting');
    setDealerCards([]);
    setPlayerHands([
      {
        id: 'hand-1',
        cards: [],
        bet: 0,
        isBusted: false,
        isStanding: false,
        isBlackjack: false,
        isDoubled: false,
      },
    ]);
    setActiveHandIndex(0);
    setRoundResultMessage('');
    setRoundNetWin(0);
    // Auto-set last bet if affordable
    if (bankroll >= lastBet) {
      setBet(lastBet);
    } else {
      setBet(Math.min(bankroll, 50));
    }
  };

  const dealerCalc = calculateBlackjackHand(dealerCards);
  const activeHand = playerHands[activeHandIndex];
  const canPlayerSplit = phase === 'playerTurn' && activeHand && canSplit(activeHand, bankroll);
  const canPlayerDouble = phase === 'playerTurn' && activeHand && canDoubleDown(activeHand, bankroll);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Luxury Casino Table Viewport: Heavy Mahogany Rim + Padded Leather Armrest + Curved Felt */}
      <div className="relative w-full wood-rim-mahogany rounded-t-[32px] table-horseshoe-curved p-2 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
        {/* Padded Stitched Leather Armrest Perimeter */}
        <div className="relative w-full leather-armrest rounded-t-[24px] table-horseshoe-curved p-2 sm:p-3">
          {/* Inner Rich Green Casino Felt Horseshoe Table */}
          <div className="relative w-full casino-felt rounded-t-[16px] table-horseshoe-curved p-4 sm:p-8 min-h-[530px] flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Table Felt Decorative Curved Arcs & Gold Text Watermark */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-90 select-none overflow-hidden">
              {/* Semi-circular Insurance Ribbon Arc */}
              <div className="w-[90%] max-w-2xl h-44 border-b-2 border-amber-400/25 rounded-b-[180px] sm:rounded-b-[240px] flex items-end justify-center pb-2">
                <span className="font-serif-luxury font-black text-xs sm:text-sm tracking-[0.25em] text-amber-300/40 uppercase">
                  ★ INSURANCE PAYS 2 TO 1 ★
                </span>
              </div>
              {/* Blackjack Payout Text */}
              <div className="text-center mt-3">
                <div className="font-serif-luxury font-black text-2xl sm:text-4xl text-amber-300/20 tracking-widest uppercase">
                  BLACKJACK PAYS 3 TO 2
                </div>
                <div className="font-serif-luxury font-bold text-[10px] sm:text-xs text-amber-300/25 tracking-wider uppercase mt-0.5">
                  Dealer Must Draw to 16 and Stand on all 17s
                </div>
              </div>
            </div>

            {/* Top: Header Controls & Multiplayer Switch */}
            <div className="relative z-20 w-full flex items-center justify-between pb-2 border-b border-amber-500/20 mb-2">
              <div className="text-[11px] font-serif-luxury font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span className="gold-gradient-text">VIP Salonu • Tekli Blackjack</span>
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

            {/* Top: Krupiye / Dealer Zone with Realistic Chip Tray */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {/* Metallic Croupier Chip Rack & Card Shoe */}
              <div className="flex items-center gap-3">
                {/* Decorative Left Chip Tray */}
                <div className="croupier-tray px-3 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-red-600 border border-white/40 shadow-sm" />
                  </div>
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-emerald-600 border border-white/40 shadow-sm" />
                  </div>
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400/80 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400/80 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-amber-400/80 shadow-sm" />
                  </div>
                </div>

                {/* Dealer Title Badge */}
                <div className="flex items-center gap-2 bg-slate-950/90 px-4 py-1.5 rounded-full border-2 border-amber-400/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                  <span className="text-xs uppercase font-serif-luxury font-black text-amber-300 tracking-wider">
                    Krupiye (Dealer)
                  </span>
                  {dealerCards.length > 0 && (
                    <span className="text-xs font-bold bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                      {dealerCalc.total} {dealerCalc.isBust ? '(Patladı!)' : ''}
                    </span>
                  )}
                </div>

                {/* Decorative Right Chip Tray */}
                <div className="croupier-tray px-3 py-1 rounded-lg hidden sm:flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-purple-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-purple-600 border border-white/40 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-purple-600 border border-white/40 shadow-sm" />
                  </div>
                  <div className="flex -space-x-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white/60 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white/60 shadow-sm" />
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white/60 shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Dealer Cards Container */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[110px] sm:min-h-[140px] pt-1">
                {dealerCards.length === 0 ? (
                  <div className="text-xs text-amber-300/40 font-serif-luxury font-semibold italic border-2 border-dashed border-amber-400/30 rounded-2xl px-8 py-7 bg-slate-950/30 backdrop-blur-sm">
                    Krupiye kartları bekleniyor...
                  </div>
                ) : (
                  dealerCards.map((card) => (
                    <CardView key={card.id} card={card} size="md" />
                  ))
                )}
              </div>
            </div>

            {/* Center: Result Banner / Status Notice */}
            <div className="relative z-20 my-2 flex flex-col items-center justify-center min-h-[50px]">
              {roundResultMessage && (
                <div className={`px-6 py-2.5 rounded-2xl border-2 text-center shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-md ${
                  roundNetWin > 0 
                    ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_35px_rgba(52,211,153,0.6)]'
                    : roundNetWin === 0 && roundResultMessage.includes('BERABERE')
                    ? 'bg-amber-950/95 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                    : 'bg-rose-950/95 border-rose-500 text-rose-100'
                }`}>
                  <div className="font-serif-luxury font-black text-base sm:text-xl tracking-wide flex items-center justify-center gap-2">
                    {roundNetWin > 0 && <Trophy className="w-5 h-5 text-amber-400" />}
                    {roundResultMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Player Hands with Authentic Circular Betting Spots */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
                {playerHands.map((hand, idx) => {
                  const calc = calculateBlackjackHand(hand.cards);
                  const isCurrent = phase === 'playerTurn' && activeHandIndex === idx;

                  return (
                    <div
                      key={hand.id}
                      className={`
                        relative flex flex-col items-center p-3 sm:p-4 rounded-3xl transition-all duration-300
                        ${isCurrent 
                          ? 'bg-amber-950/50 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] scale-105' 
                          : 'bg-slate-950/50 border border-amber-500/25'}
                      `}
                    >
                      {/* Hand Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase font-serif-luxury font-black text-amber-300 tracking-wider">
                          {playerHands.length > 1 ? `El #${idx + 1}` : 'Oyuncu'}
                        </span>
                        {hand.cards.length > 0 && (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            calc.isBust 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' 
                              : calc.isBlackjack
                              ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                              : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                          }`}>
                            {calc.isBlackjack ? 'Blackjack! (21)' : calc.isBust ? 'Patladı (Bust)' : `${calc.total}${calc.isSoft ? ' (Soft)' : ''}`}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="animate-pulse bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            Sıra Sizde
                          </span>
                        )}
                      </div>

                      {/* Hand Cards */}
                      <div className="flex items-center justify-center gap-2 min-h-[110px] sm:min-h-[140px]">
                        {hand.cards.length === 0 ? (
                          <div className="w-28 h-36 border-2 border-dashed border-amber-400/40 rounded-2xl flex flex-col items-center justify-center text-center p-2 bg-slate-950/40">
                            <span className="text-[11px] font-serif-luxury text-amber-300/50 font-bold uppercase">
                              Bahis Yeri
                            </span>
                          </div>
                        ) : (
                          hand.cards.map((card) => (
                            <CardView key={card.id} card={card} size="md" />
                          ))
                        )}
                      </div>

                      {/* Bet Amount on Hand with 3D Chip Icon */}
                      {hand.bet > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 bg-slate-950/90 border border-amber-400/60 px-3 py-1 rounded-full shadow-lg">
                          <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950 shadow">
                            $
                          </div>
                          <span className="text-xs font-serif-luxury font-black text-amber-200">
                            ${hand.bet.toLocaleString('tr-TR')}
                          </span>
                          {hand.isDoubled && (
                            <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded shadow">2x</span>
                          )}
                        </div>
                      )}

                      {/* Hand Status Result if ended */}
                      {hand.statusText && (
                        <div className="mt-1.5 text-xs font-serif-luxury font-black text-amber-300 drop-shadow">
                          {hand.statusText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Center Panel */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-xl flex flex-col gap-4">
        {phase === 'betting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full max-w-lg">
              <div className="text-xs font-semibold text-slate-400">
                VIP Masa Limiti: $5 - $1.000.000+
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300">Seçilen Bahis:</span>
                <span className="font-serif-luxury font-bold text-lg text-amber-300">
                  ${bet.toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            {/* 3D Chip Controls */}
            <ChipSelector
              selectedChip={selectedChip}
              onSelectChip={setSelectedChip}
              currentBet={bet}
              bankroll={bankroll}
              onAddBet={(val) => {
                setBet(prev => Math.min(bankroll, prev + val));
              }}
              onSetBet={(val) => {
                setBet(Math.min(bankroll, Math.max(0, val)));
              }}
              onClearBet={() => setBet(0)}
              onAllIn={() => setBet(bankroll)}
            />

            {/* Deal Button */}
            <button
              onClick={handleDeal}
              disabled={bet <= 0 || bet > bankroll}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Kartları Dağıt (Deal)
            </button>
          </div>
        )}

        {phase === 'playerTurn' && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-amber-300/80 font-medium">
              Sıra sizde. Hamlenizi seçin:
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* HIT */}
              <button
                onClick={handleHit}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-serif-luxury font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
              >
                Kart Çek (Hit)
              </button>

              {/* STAND */}
              <button
                onClick={handleStand}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-amber-300 font-serif-luxury font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer border border-amber-500/30"
              >
                Kal (Stand)
              </button>

              {/* DOUBLE DOWN */}
              <button
                onClick={handleDoubleDown}
                disabled={!canPlayerDouble}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-serif-luxury font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Bahsi 2 katına çıkar ve tam 1 kart al"
              >
                İkiye Katla (Double)
              </button>

              {/* SPLIT */}
              <button
                onClick={handleSplit}
                disabled={!canPlayerSplit}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-serif-luxury font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-purple-400/40"
                title="Aynı değerdeki kartları iki ayrı ele ayır"
              >
                Ayır (Split)
              </button>
            </div>
          </div>
        )}

        {phase === 'dealerTurn' && (
          <div className="flex items-center justify-center py-2 text-amber-400 text-sm font-semibold animate-pulse">
            Krupiye oynuyor, lütfen bekleyin...
          </div>
        )}

        {phase === 'roundOver' && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleNewRound}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-serif-luxury font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Yeni El Aç
            </button>
            {bankroll >= lastBet && (
              <button
                onClick={() => {
                  handleNewRound();
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
