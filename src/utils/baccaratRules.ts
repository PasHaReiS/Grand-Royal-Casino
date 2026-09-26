import { BaccaratBet, BaccaratBetType, DiceRollResult } from '../types';

export interface BaccaratPayoutDetail {
  betId: string;
  type: BaccaratBetType;
  label: string;
  amount: number;
  won: boolean;
  payout: number;
  reason: string;
}

export interface BaccaratCalculationResult {
  totalWon: number;
  totalBet: number;
  netWin: number;
  details: BaccaratPayoutDetail[];
  retainedBets: BaccaratBet[]; // Bets that stay on the table (e.g. Pass line during point)
  announcement: string;
  newPoint: number | null;
}

export const BACCARAT_BET_CONFIG: Record<
  BaccaratBetType,
  { label: string; payoutRatio: string; multiplier: number; category: 'core' | 'baccarat' | 'props' | 'hardways' | 'place' }
> = {
  pass_line: { label: 'Pas Hattı (Kazanır)', payoutRatio: '1:1', multiplier: 1, category: 'core' },
  dont_pass: { label: 'Pas Geçme (Kaybeder)', payoutRatio: '1:1', multiplier: 1, category: 'core' },
  player: { label: 'Oyuncu (Punto)', payoutRatio: '1:1', multiplier: 1, category: 'baccarat' },
  banker: { label: 'Kasa (Banco)', payoutRatio: '1:1', multiplier: 1, category: 'baccarat' },
  tie: { label: 'Beraberlik (Tie)', payoutRatio: '8:1', multiplier: 8, category: 'baccarat' },
  field: { label: 'Alan Bahsi (Field 2,3,4,9,10,11,12)', payoutRatio: '1:1 / 2:1', multiplier: 1, category: 'core' },
  any_seven: { label: 'Kırmızı 7 (Any Seven)', payoutRatio: '4:1', multiplier: 4, category: 'props' },
  any_craps: { label: 'Craps (2, 3, 12)', payoutRatio: '7:1', multiplier: 7, category: 'props' },
  yo_eleven: { label: 'Yo 11 (Eleven)', payoutRatio: '15:1', multiplier: 15, category: 'props' },
  snake_eyes: { label: 'Hep Yek (1-1 Snake Eyes)', payoutRatio: '30:1', multiplier: 30, category: 'props' },
  boxcars: { label: 'Düşeş (6-6 Boxcars)', payoutRatio: '30:1', multiplier: 30, category: 'props' },
  hard_4: { label: 'Dört Cihar (2-2)', payoutRatio: '9:1', multiplier: 9, category: 'hardways' },
  hard_6: { label: 'Dü Se (3-3)', payoutRatio: '9:1', multiplier: 9, category: 'hardways' },
  hard_8: { label: 'Dört Dört (4-4)', payoutRatio: '9:1', multiplier: 9, category: 'hardways' },
  hard_10: { label: 'Dü Beş (5-5)', payoutRatio: '9:1', multiplier: 9, category: 'hardways' },
  place_4: { label: 'Sayı 4 (Place 4)', payoutRatio: '9:5', multiplier: 1.8, category: 'place' },
  place_5: { label: 'Sayı 5 (Place 5)', payoutRatio: '7:5', multiplier: 1.4, category: 'place' },
  place_6: { label: 'Sayı 6 (Place 6)', payoutRatio: '7:6', multiplier: 1.1667, category: 'place' },
  place_8: { label: 'Sayı 8 (Place 8)', payoutRatio: '7:6', multiplier: 1.1667, category: 'place' },
  place_9: { label: 'Sayı 9 (Place 9)', payoutRatio: '7:5', multiplier: 1.4, category: 'place' },
  place_10: { label: 'Sayı 10 (Place 10)', payoutRatio: '9:5', multiplier: 1.8, category: 'place' },
};

/**
 * Evaluates all active bets on the table against the thrown dice result
 */
export function evaluateBaccaratAndDiceRoll(
  bets: BaccaratBet[],
  die1: number,
  die2: number,
  currentPoint: number | null
): BaccaratCalculationResult {
  const total = die1 + die2;
  const isPair = die1 === die2;
  let nextPoint = currentPoint;
  let announcement = '';

  const playerVal = die1;
  const bankerVal = die2;
  const baccaratWinner: 'player' | 'banker' | 'tie' =
    playerVal > bankerVal ? 'player' : bankerVal > playerVal ? 'banker' : 'tie';

  // Determine Dice Announcements
  if (currentPoint === null) {
    // Come-out roll
    if (total === 7 || total === 11) {
      announcement = `Zar ${total}! Doğal Kazanç (Natural) - Pas Hattı Kazandı!`;
      nextPoint = null;
    } else if (total === 2 || total === 3 || total === 12) {
      announcement = `Zar ${total}! Craps (Barbut) - Pas Hattı Kaybetti!`;
      nextPoint = null;
    } else {
      nextPoint = total;
      announcement = `Zar ${total}! Sayı Belirlendi: ${total} (Point ON)`;
    }
  } else {
    // Point is active
    if (total === currentPoint) {
      announcement = `Zar ${total}! SAYI VURULDU! Pas Hattı Kazandı!`;
      nextPoint = null; // resets to OFF
    } else if (total === 7) {
      announcement = `Zar 7! SEVEN OUT! Pas Geçme Kazandı, Pas Hattı Düştü!`;
      nextPoint = null; // resets to OFF
    } else {
      announcement = `Zar ${total}! Sayı ${currentPoint} için atışlar devam ediyor.`;
    }
  }

  let totalWon = 0;
  let totalBet = 0;
  const details: BaccaratPayoutDetail[] = [];
  const retainedBets: BaccaratBet[] = [];

  for (const bet of bets) {
    totalBet += bet.amount;
    let won = false;
    let payout = 0;
    let reason = '';
    let shouldRetain = false;

    switch (bet.type) {
      // 1. PASS LINE
      case 'pass_line': {
        if (currentPoint === null) {
          if (total === 7 || total === 11) {
            won = true;
            payout = bet.amount * 2; // Return bet + 1:1 profit
            reason = `Doğal ${total} ile Pas Hattı kazandı (1:1)`;
          } else if (total === 2 || total === 3 || total === 12) {
            won = false;
            payout = 0;
            reason = `Craps ${total} ile Pas Hattı kaybetti`;
          } else {
            // Point established, bet stays on table
            shouldRetain = true;
            won = false;
            payout = 0;
            reason = `Sayı ${total} belirlendi. Bahis masada aktif kaldı.`;
          }
        } else {
          if (total === currentPoint) {
            won = true;
            payout = bet.amount * 2;
            reason = `Sayı ${total} tekrar vuruldu! (1:1)`;
          } else if (total === 7) {
            won = false;
            payout = 0;
            reason = `Seven Out! 7 geldi, Pas Hattı kaybetti.`;
          } else {
            shouldRetain = true;
            reason = `Sayı ${currentPoint} bekleniyor.`;
          }
        }
        break;
      }

      // 2. DON'T PASS
      case 'dont_pass': {
        if (currentPoint === null) {
          if (total === 2 || total === 3) {
            won = true;
            payout = bet.amount * 2;
            reason = `Craps ${total} ile Pas Geçme kazandı (1:1)`;
          } else if (total === 12) {
            // Push
            won = true;
            payout = bet.amount; // Bet returned
            reason = `12 geldi! Beraberlik / İade (Push)`;
          } else if (total === 7 || total === 11) {
            won = false;
            payout = 0;
            reason = `Doğal ${total} ile Pas Geçme kaybetti.`;
          } else {
            shouldRetain = true;
            reason = `Sayı ${total} belirlendi. Pas Geçme masada aktif.`;
          }
        } else {
          if (total === 7) {
            won = true;
            payout = bet.amount * 2;
            reason = `Seven Out! Sayıdan önce 7 geldi (1:1)`;
          } else if (total === currentPoint) {
            won = false;
            payout = 0;
            reason = `Sayı ${currentPoint} vuruldu, Pas Geçme kaybetti.`;
          } else {
            shouldRetain = true;
            reason = `Sayı ${currentPoint} bekleniyor.`;
          }
        }
        break;
      }

      // 3. BACCARAT PUNTO (PLAYER DIE)
      case 'player': {
        if (baccaratWinner === 'player') {
          won = true;
          payout = bet.amount * 2;
          reason = `Oyuncu Zarı (${die1}) > Kasa Zarı (${die2})! Kazanç 1:1`;
        } else if (baccaratWinner === 'tie') {
          won = true;
          payout = bet.amount; // Push on tie in baccarat
          reason = `Beraberlik (${die1}-${die2})! Baccarat bahsi iade edildi.`;
        } else {
          won = false;
          payout = 0;
          reason = `Kasa Zarı (${die2}) > Oyuncu Zarı (${die1}).`;
        }
        break;
      }

      // 4. BACCARAT BANCO (BANKER DIE)
      case 'banker': {
        if (baccaratWinner === 'banker') {
          won = true;
          payout = bet.amount * 2;
          reason = `Kasa Zarı (${die2}) > Oyuncu Zarı (${die1})! Kazanç 1:1`;
        } else if (baccaratWinner === 'tie') {
          won = true;
          payout = bet.amount;
          reason = `Beraberlik (${die1}-${die2})! Baccarat bahsi iade edildi.`;
        } else {
          won = false;
          payout = 0;
          reason = `Oyuncu Zarı (${die1}) > Kasa Zarı (${die2}).`;
        }
        break;
      }

      // 5. BACCARAT TIE
      case 'tie': {
        if (baccaratWinner === 'tie') {
          won = true;
          payout = bet.amount + bet.amount * 8; // 8:1
          reason = `ÇİFT ZAR BERABERLİK (${die1}-${die2})! 8:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `Zarlar eşit gelmedi (${die1} vs ${die2}).`;
        }
        break;
      }

      // 6. FIELD BET
      case 'field': {
        if (total === 2) {
          won = true;
          payout = bet.amount + bet.amount * 2; // 2:1
          reason = `Alan Bahsi: 2 (Yılan Gözü) 2:1 Ödedi!`;
        } else if (total === 12) {
          won = true;
          payout = bet.amount + bet.amount * 3; // 3:1
          reason = `Alan Bahsi: 12 (Düşeş) 3:1 Ödedi!`;
        } else if ([3, 4, 9, 10, 11].includes(total)) {
          won = true;
          payout = bet.amount * 2;
          reason = `Alan Bahsi: ${total} Geldi (1:1)`;
        } else {
          won = false;
          payout = 0;
          reason = `Alan Bahsi: ${total} kaybeden sayı (5,6,7,8).`;
        }
        break;
      }

      // 7. ANY SEVEN
      case 'any_seven': {
        if (total === 7) {
          won = true;
          payout = bet.amount + bet.amount * 4; // 4:1
          reason = `Kırmızı 7 Geldi! 4:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `7 gelmedi (Zar: ${total}).`;
        }
        break;
      }

      // 8. ANY CRAPS
      case 'any_craps': {
        if (total === 2 || total === 3 || total === 12) {
          won = true;
          payout = bet.amount + bet.amount * 7; // 7:1
          reason = `Craps (${total}) Geldi! 7:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `Craps gelmedi (Zar: ${total}).`;
        }
        break;
      }

      // 9. YO ELEVEN
      case 'yo_eleven': {
        if (total === 11) {
          won = true;
          payout = bet.amount + bet.amount * 15; // 15:1
          reason = `Yo 11 Geldi! 15:1 Dev Kazanç!`;
        } else {
          won = false;
          payout = 0;
          reason = `11 gelmedi (Zar: ${total}).`;
        }
        break;
      }

      // 10. SNAKE EYES (1-1)
      case 'snake_eyes': {
        if (die1 === 1 && die2 === 1) {
          won = true;
          payout = bet.amount + bet.amount * 30; // 30:1
          reason = `HEP YEK (1-1)! 30:1 REKOR KAZANÇ!`;
        } else {
          won = false;
          payout = 0;
          reason = `1-1 gelmedi.`;
        }
        break;
      }

      // 11. BOXCARS (6-6)
      case 'boxcars': {
        if (die1 === 6 && die2 === 6) {
          won = true;
          payout = bet.amount + bet.amount * 30; // 30:1
          reason = `DÜŞEŞ (6-6)! 30:1 REKOR KAZANÇ!`;
        } else {
          won = false;
          payout = 0;
          reason = `6-6 gelmedi.`;
        }
        break;
      }

      // 12. HARDWAYS (2-2, 3-3, 4-4, 5-5)
      case 'hard_4': {
        if (die1 === 2 && die2 === 2) {
          won = true;
          payout = bet.amount + bet.amount * 9;
          reason = `Dört Cihar (2-2) Çift Geldi! 9:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `2-2 gelmedi.`;
        }
        break;
      }
      case 'hard_6': {
        if (die1 === 3 && die2 === 3) {
          won = true;
          payout = bet.amount + bet.amount * 9;
          reason = `Dü Se (3-3) Çift Geldi! 9:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `3-3 gelmedi.`;
        }
        break;
      }
      case 'hard_8': {
        if (die1 === 4 && die2 === 4) {
          won = true;
          payout = bet.amount + bet.amount * 9;
          reason = `Dört Dört (4-4) Çift Geldi! 9:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `4-4 gelmedi.`;
        }
        break;
      }
      case 'hard_10': {
        if (die1 === 5 && die2 === 5) {
          won = true;
          payout = bet.amount + bet.amount * 9;
          reason = `Dü Beş (5-5) Çift Geldi! 9:1 Ödeme!`;
        } else {
          won = false;
          payout = 0;
          reason = `5-5 gelmedi.`;
        }
        break;
      }

      // 13. PLACE BETS (Sayı Bahisleri)
      case 'place_4': {
        if (total === 4) {
          won = true;
          payout = bet.amount + Math.floor(bet.amount * 1.8);
          reason = `Sayı 4 Geldi! 9:5 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `4 veya 7 bekleniyor.`;
        }
        break;
      }
      case 'place_5': {
        if (total === 5) {
          won = true;
          payout = bet.amount + Math.floor(bet.amount * 1.4);
          reason = `Sayı 5 Geldi! 7:5 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `5 veya 7 bekleniyor.`;
        }
        break;
      }
      case 'place_6': {
        if (total === 6) {
          won = true;
          payout = bet.amount + Math.floor((bet.amount * 7) / 6);
          reason = `Sayı 6 Geldi! 7:6 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `6 veya 7 bekleniyor.`;
        }
        break;
      }
      case 'place_8': {
        if (total === 8) {
          won = true;
          payout = bet.amount + Math.floor((bet.amount * 7) / 6);
          reason = `Sayı 8 Geldi! 7:6 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `8 veya 7 bekleniyor.`;
        }
        break;
      }
      case 'place_9': {
        if (total === 9) {
          won = true;
          payout = bet.amount + Math.floor(bet.amount * 1.4);
          reason = `Sayı 9 Geldi! 7:5 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `9 veya 7 bekleniyor.`;
        }
        break;
      }
      case 'place_10': {
        if (total === 10) {
          won = true;
          payout = bet.amount + Math.floor(bet.amount * 1.8);
          reason = `Sayı 10 Geldi! 9:5 Ödeme!`;
        } else if (total === 7) {
          won = false;
          payout = 0;
          reason = `7 geldi, Place bahsi kaybetti.`;
        } else {
          shouldRetain = true;
          reason = `10 veya 7 bekleniyor.`;
        }
        break;
      }
    }

    if (shouldRetain) {
      retainedBets.push(bet);
    } else {
      totalWon += payout;
    }

    details.push({
      betId: bet.id,
      type: bet.type,
      label: bet.label,
      amount: bet.amount,
      won,
      payout,
      reason,
    });
  }

  const netWin = totalWon - totalBet;

  return {
    totalWon,
    totalBet,
    netWin,
    details,
    retainedBets,
    announcement,
    newPoint: nextPoint,
  };
}

/**
 * Returns Turkish traditional Barbut & Craps nickname for a pair of dice
 */
export function getDiceCallout(die1: number, die2: number): string {
  const d1 = Math.min(die1, die2);
  const d2 = Math.max(die1, die2);

  // Traditional Barbut & Backgammon dice names in Turkish
  if (d1 === 1 && d2 === 1) return 'Hep Yek (1-1)';
  if (d1 === 2 && d2 === 2) return 'Dü Bara (2-2)';
  if (d1 === 3 && d2 === 3) return 'Dü Se (3-3)';
  if (d1 === 4 && d2 === 4) return 'Dört Cihar (4-4)';
  if (d1 === 5 && d2 === 5) return 'Dü Beş (5-5)';
  if (d1 === 6 && d2 === 6) return 'Düşeş (6-6)';

  if (d1 === 1 && d2 === 2) return 'Yek-i Dü (3)';
  if (d1 === 1 && d2 === 3) return 'Se Yek (4)';
  if (d1 === 1 && d2 === 4) return 'Cihar-ı Yek (5)';
  if (d1 === 1 && d2 === 5) return 'Penc-i Yek (6)';
  if (d1 === 1 && d2 === 6) return 'Şeş-i Yek (7)';

  if (d1 === 2 && d2 === 3) return 'Seba-i Dü (5)';
  if (d1 === 2 && d2 === 4) return 'Cihar-ı Dü (6)';
  if (d1 === 2 && d2 === 5) return 'Penc-i Dü (7)';
  if (d1 === 2 && d2 === 6) return 'Şeş-i Dü (8)';

  if (d1 === 3 && d2 === 4) return 'Cihar-ı Se (7)';
  if (d1 === 3 && d2 === 5) return 'Penc-i Se (8)';
  if (d1 === 3 && d2 === 6) return 'Şeş-i Se (9)';

  if (d1 === 4 && d2 === 5) return 'Penc-i Cihar (9)';
  if (d1 === 4 && d2 === 6) return 'Şeş-i Cihar (10)';

  if (d1 === 5 && d2 === 6) return 'Şeş-i Beş (11 - Yo)';

  return `Zar ${die1 + die2} (${die1}-${die2})`;
}
