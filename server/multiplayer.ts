import { WebSocket } from 'ws';
import { Card, MultiplayerSeat, MultiplayerTableState, TablePhase, ChatMessage, PlayerProfile, TableSummary } from '../src/types';
import { createDeck, getRankBaseValue } from '../src/utils/cards';
import { calculateBlackjackHand } from '../src/utils/blackjackRules';
import { evaluate5CardHand } from '../src/utils/pokerEvaluator';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  playerName: string;
  isPasha: boolean;
  tableId: string | null;
}

interface ServerTable extends MultiplayerTableState {
  deck: Card[];
  dealerHiddenCard?: Card;
  turnTimeout?: NodeJS.Timeout;
  roundResetTimeout?: NodeJS.Timeout;
  clients: Set<WebSocket>;
  chatMessages: ChatMessage[];
}

export class MultiplayerServer {
  private tables: Map<string, ServerTable> = new Map();
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private httpClients: Map<
    string,
    { playerId: string; playerName: string; isPasha: boolean; tableId: string | null; lastSeen: number }
  > = new Map();

  constructor() {
    this.initDefaultTables();
  }

  private initDefaultTables() {
    // 3 Blackjack tables
    this.createTable({
      tableId: 'bj-vip-1',
      name: '👑 PasHa VIP Salonu #1',
      gameType: 'blackjack',
      minBet: 100,
      maxBet: 1000000,
      isVipRoom: true,
    });

    this.createTable({
      tableId: 'bj-high-2',
      name: '💎 High Roller Blackjack #2',
      gameType: 'blackjack',
      minBet: 25,
      maxBet: 500000,
      isVipRoom: false,
    });

    this.createTable({
      tableId: 'bj-vegas-3',
      name: '🎰 Klasik Vegas Blackjack #3',
      gameType: 'blackjack',
      minBet: 5,
      maxBet: 50000,
      isVipRoom: false,
    });

    // 2 Poker tables
    this.createTable({
      tableId: 'poker-vip-1',
      name: '👑 PasHa Royale Poker #1',
      gameType: 'poker',
      minBet: 50,
      maxBet: 1000000,
      isVipRoom: true,
    });

    this.createTable({
      tableId: 'poker-high-2',
      name: '♠ High Roller Draw Poker #2',
      gameType: 'poker',
      minBet: 10,
      maxBet: 250000,
      isVipRoom: false,
    });
  }

  public createTable(opts: {
    tableId: string;
    name: string;
    gameType: 'blackjack' | 'poker';
    minBet: number;
    maxBet: number;
    isVipRoom: boolean;
  }): ServerTable {
    const seats: (MultiplayerSeat | null)[] = Array(5).fill(null);
    for (let i = 0; i < 5; i++) {
      seats[i] = {
        seatIndex: i,
        player: null,
        bet: 0,
        cards: [],
        score: 0,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
        isDoubled: false,
        payout: 0,
        statusText: undefined,
        heldIndices: [],
        hasDrawn: false,
      };
    }

    const table: ServerTable = {
      tableId: opts.tableId,
      name: opts.name,
      gameType: opts.gameType,
      phase: 'waiting_bets',
      dealerCards: [],
      dealerScore: 0,
      seats,
      activeSeatIndex: null,
      turnTimeRemaining: 25,
      deckCount: 312, // 6 decks
      roundNumber: 1,
      minBet: opts.minBet,
      maxBet: opts.maxBet,
      isVipRoom: opts.isVipRoom,
      history: [
        {
          id: `h-${Date.now()}`,
          text: `${opts.name} masası aktif. Oyuncular bekleniyor.`,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
        },
      ],
      deck: createDeck(opts.gameType === 'blackjack' ? 6 : 1),
      clients: new Set(),
      chatMessages: [
        {
          id: `msg-welcome-${Date.now()}`,
          senderId: 'dealer',
          senderName: '👑 Kurpiyer PasHa',
          isPasha: true,
          text: `Hoş geldiniz! Masaya oturup bahsinizi belirleyin. Bol şanslar!`,
          timestamp: Date.now(),
          type: 'system',
        },
      ],
    };

    this.tables.set(opts.tableId, table);
    return table;
  }

  public handleConnection(ws: WebSocket) {
    const client: ClientConnection = {
      ws,
      playerId: `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      playerName: 'Oyuncu',
      isPasha: false,
      tableId: null,
    };
    this.clients.set(ws, client);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(ws, msg);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WS client error:', err);
      this.handleDisconnect(ws);
    });

    // Send table listings immediately
    this.send(ws, {
      type: 'table_list',
      tables: this.getTableSummaries(),
      playerId: client.playerId,
    });
  }

  public handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    if (client.tableId) {
      this.leaveTable(ws, client.tableId);
    }
    this.clients.delete(ws);
  }

  private handleMessage(ws: WebSocket, msg: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (msg.type) {
      case 'identify': {
        if (msg.name && typeof msg.name === 'string') {
          client.playerName = msg.name.trim();
          client.isPasha = client.playerName.toLowerCase() === 'pasha';
        }
        if (msg.playerId && typeof msg.playerId === 'string') {
          client.playerId = msg.playerId;
        }
        break;
      }

      case 'get_table_list': {
        this.send(ws, {
          type: 'table_list',
          tables: this.getTableSummaries(),
        });
        break;
      }

      case 'join_table': {
        const tableId = msg.tableId;
        if (!tableId) return;

        // Auto-create table if custom room entered
        let table = this.tables.get(tableId);
        if (!table) {
          table = this.createTable({
            tableId,
            name: msg.tableName || `Özel Masa #${tableId.substring(0, 6)}`,
            gameType: msg.gameType || 'blackjack',
            minBet: msg.minBet || 25,
            maxBet: msg.maxBet || 1000000,
            isVipRoom: !!msg.isVipRoom,
          });
        }

        if (client.tableId && client.tableId !== tableId) {
          this.leaveTable(ws, client.tableId);
        }

        client.tableId = tableId;
        table.clients.add(ws);

        // Send full table state to joining client
        this.send(ws, {
          type: 'table_state',
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
          playerId: client.playerId,
        });

        // Broadcast player joined notification
        this.broadcastTableChat(table, {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Sistem',
          isPasha: false,
          text: `${client.playerName} masaya izleyici olarak katıldı.`,
          timestamp: Date.now(),
          type: 'system',
        });

        this.broadcastTableState(table);
        this.broadcastTableList();
        break;
      }

      case 'leave_table': {
        if (client.tableId) {
          this.leaveTable(ws, client.tableId);
        }
        break;
      }

      case 'sit_down': {
        const { seatIndex, bankroll } = msg;
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table) return;

        if (seatIndex < 0 || seatIndex >= table.seats.length) return;
        const targetSeat = table.seats[seatIndex];

        // Check if seat is occupied
        if (targetSeat && targetSeat.player) {
          this.send(ws, { type: 'error', message: 'Bu koltuk dolu!' });
          return;
        }

        // Check if player already sits elsewhere at this table
        for (const s of table.seats) {
          if (s && s.player && s.player.id === client.playerId) {
            s.player = null;
            s.bet = 0;
            s.cards = [];
          }
        }

        const playerProfile: PlayerProfile = {
          id: client.playerId,
          name: client.playerName,
          isPasha: client.isPasha,
          bankroll: typeof bankroll === 'number' ? bankroll : 5000,
        };

        table.seats[seatIndex] = {
          seatIndex,
          player: playerProfile,
          bet: 0,
          cards: [],
          score: 0,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
          isDoubled: false,
          payout: 0,
          heldIndices: [],
          hasDrawn: false,
        };

        this.broadcastTableChat(table, {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Kurpiyer',
          isPasha: true,
          text: `${client.playerName} ${seatIndex + 1}. Koltuğa oturdu.`,
          timestamp: Date.now(),
          type: 'system',
        });

        this.broadcastTableState(table);
        this.broadcastTableList();
        break;
      }

      case 'stand_up': {
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table) return;

        let leftSeat = -1;
        for (let i = 0; i < table.seats.length; i++) {
          const s = table.seats[i];
          if (s && s.player && s.player.id === client.playerId) {
            s.player = null;
            s.bet = 0;
            s.cards = [];
            leftSeat = i;
          }
        }

        if (leftSeat !== -1) {
          this.broadcastTableChat(table, {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'Kurpiyer',
            isPasha: true,
            text: `${client.playerName} masadan kalktı.`,
            timestamp: Date.now(),
            type: 'system',
          });
          this.broadcastTableState(table);
          this.broadcastTableList();
        }
        break;
      }

      case 'place_bet': {
        const { amount } = msg;
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || table.phase !== 'waiting_bets') return;

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || !seat.player) return;

        const betAmt = Math.min(table.maxBet, Math.max(0, parseInt(amount, 10) || 0));
        seat.bet = betAmt;

        this.broadcastTableState(table);
        break;
      }

      case 'start_deal': {
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || table.phase !== 'waiting_bets') return;

        // Check if at least one seated player placed a valid bet
        const activeSeats = table.seats.filter((s) => s && s.player && s.bet >= table.minBet);
        if (activeSeats.length === 0) {
          this.send(ws, {
            type: 'error',
            message: `Oyunu başlatmak için en az bir oyuncunun asgari $${table.minBet} bahis koyması gerekir.`,
          });
          return;
        }

        this.startRound(table);
        break;
      }

      case 'player_action': {
        const { action } = msg; // 'hit' | 'stand' | 'double'
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || table.phase !== 'player_turns') return;

        if (table.activeSeatIndex === null) return;
        const activeSeat = table.seats[table.activeSeatIndex];
        if (!activeSeat || !activeSeat.player || activeSeat.player.id !== client.playerId) {
          this.send(ws, { type: 'error', message: 'Şu anda sizin sıranız değil.' });
          return;
        }

        this.handlePlayerAction(table, activeSeat, action);
        break;
      }

      case 'poker_toggle_hold': {
        const { cardIndex } = msg;
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || table.gameType !== 'poker' || table.phase !== 'player_turns') return;

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || seat.hasDrawn) return;

        const currentHolds = seat.heldIndices || [];
        if (currentHolds.includes(cardIndex)) {
          seat.heldIndices = currentHolds.filter((idx) => idx !== cardIndex);
        } else {
          seat.heldIndices = [...currentHolds, cardIndex];
        }

        this.broadcastTableState(table);
        break;
      }

      case 'poker_draw': {
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || table.gameType !== 'poker' || table.phase !== 'player_turns') return;

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || seat.hasDrawn) return;

        this.handlePokerDraw(table, seat);
        break;
      }

      case 'chat_message': {
        const { text, chatType = 'chat' } = msg;
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (!table || !text || !text.trim()) return;

        const chatMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: client.playerId,
          senderName: client.playerName,
          isPasha: client.isPasha,
          text: text.trim().slice(0, 140),
          timestamp: Date.now(),
          type: chatType === 'reaction' ? 'reaction' : 'chat',
        };

        this.broadcastTableChat(table, chatMsg);
        break;
      }

      case 'sync_bankroll': {
        const { bankroll } = msg;
        const table = client.tableId ? this.tables.get(client.tableId) : null;
        if (table && typeof bankroll === 'number') {
          const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
          if (seat && seat.player) {
            seat.player.bankroll = bankroll;
            this.broadcastTableState(table);
          }
        }
        break;
      }
    }
  }

  private leaveTable(ws: WebSocket, tableId: string) {
    const client = this.clients.get(ws);
    const table = this.tables.get(tableId);
    if (!table) return;

    table.clients.delete(ws);
    if (client) {
      client.tableId = null;
      for (const s of table.seats) {
        if (s && s.player && s.player.id === client.playerId) {
          s.player = null;
          s.bet = 0;
          s.cards = [];
        }
      }
    }

    this.broadcastTableState(table);
    this.broadcastTableList();
  }

  // ---------------- BLACKJACK / POKER ROUND LOGIC ----------------
  private startRound(table: ServerTable) {
    if (table.deck.length < 52) {
      table.deck = createDeck(table.gameType === 'blackjack' ? 6 : 1);
    }

    table.phase = 'dealing';
    table.dealerCards = [];
    table.dealerScore = 0;
    table.activeSeatIndex = null;
    table.roundNumber += 1;

    // Reset seats
    for (const seat of table.seats) {
      if (seat) {
        seat.cards = [];
        seat.score = 0;
        seat.isStanding = false;
        seat.isBusted = false;
        seat.isBlackjack = false;
        seat.isDoubled = false;
        seat.payout = 0;
        seat.statusText = undefined;
        seat.heldIndices = [];
        seat.hasDrawn = false;
      }
    }

    if (table.gameType === 'blackjack') {
      // Deal 2 cards to each seated player with a bet
      for (let round = 0; round < 2; round++) {
        for (const seat of table.seats) {
          if (seat && seat.player && seat.bet >= table.minBet) {
            const card = table.deck.pop();
            if (card) {
              card.isFaceUp = true;
              seat.cards.push(card);
            }
          }
        }
        // Dealer card
        const dealerCard = table.deck.pop();
        if (dealerCard) {
          if (round === 0) {
            dealerCard.isFaceUp = true;
            table.dealerCards.push(dealerCard);
          } else {
            // Second dealer card is face down
            dealerCard.isFaceUp = false;
            table.dealerHiddenCard = dealerCard;
            table.dealerCards.push(dealerCard);
          }
        }
      }

      // Calculate initial player scores & blackjacks
      for (const seat of table.seats) {
        if (seat && seat.player && seat.bet >= table.minBet) {
          const calc = calculateBlackjackHand(seat.cards);
          seat.score = calc.total;
          if (calc.isBlackjack) {
            seat.isBlackjack = true;
            seat.statusText = 'BLACKJACK!';
          }
        }
      }

      // Dealer visible score
      const visibleDealerCards = table.dealerCards.filter((c) => c.isFaceUp);
      table.dealerScore = calculateBlackjackHand(visibleDealerCards).total;
      table.deckCount = table.deck.length;

      this.broadcastTableState(table);

      // Advance to player turns
      setTimeout(() => {
        this.nextPlayerTurn(table, -1);
      }, 1000);
    } else {
      // Poker: Deal 5 cards to each seated player with bet
      for (let c = 0; c < 5; c++) {
        for (const seat of table.seats) {
          if (seat && seat.player && seat.bet >= table.minBet) {
            const card = table.deck.pop();
            if (card) {
              card.isFaceUp = true;
              seat.cards.push(card);
            }
          }
        }
      }

      // Evaluate initial poker hands
      for (const seat of table.seats) {
        if (seat && seat.player && seat.bet >= table.minBet) {
          const pEval = evaluate5CardHand(seat.cards);
          seat.pokerEvaluation = pEval;
          seat.statusText = pEval.nameTr;
          // Auto hold winning indices
          seat.heldIndices = [...(pEval.winningIndices || [])];
        }
      }

      table.phase = 'player_turns';
      table.deckCount = table.deck.length;
      this.broadcastTableState(table);

      // 30 second timer for poker draw
      table.turnTimeRemaining = 30;
      this.startPokerTurnCountdown(table);
    }
  }

  private nextPlayerTurn(table: ServerTable, currentSeatIndex: number) {
    if (table.turnTimeout) {
      clearTimeout(table.turnTimeout);
      table.turnTimeout = undefined;
    }

    // Find next seated player with a bet who hasn't busted, blackjacked or stood
    let nextIdx = -1;
    for (let i = currentSeatIndex + 1; i < table.seats.length; i++) {
      const s = table.seats[i];
      if (s && s.player && s.bet >= table.minBet && !s.isBusted && !s.isStanding && !s.isBlackjack) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx !== -1) {
      table.phase = 'player_turns';
      table.activeSeatIndex = nextIdx;
      table.turnTimeRemaining = 25;
      this.broadcastTableState(table);

      // Start 25-second countdown timer for active seat
      this.startSeatCountdown(table, nextIdx);
    } else {
      // All player turns done -> Dealer's turn!
      table.activeSeatIndex = null;
      this.startDealerTurn(table);
    }
  }

  private startSeatCountdown(table: ServerTable, seatIndex: number) {
    if (table.turnTimeout) clearTimeout(table.turnTimeout);

    const step = () => {
      table.turnTimeRemaining -= 1;
      if (table.turnTimeRemaining <= 0) {
        // Auto-stand on timeout
        const seat = table.seats[seatIndex];
        if (seat) {
          seat.isStanding = true;
          seat.statusText = 'Zaman Aşımı (Pas)';
          this.nextPlayerTurn(table, seatIndex);
        }
      } else {
        this.broadcastTableState(table);
        table.turnTimeout = setTimeout(step, 1000);
      }
    };

    table.turnTimeout = setTimeout(step, 1000);
  }

  private startPokerTurnCountdown(table: ServerTable) {
    if (table.turnTimeout) clearTimeout(table.turnTimeout);

    const step = () => {
      table.turnTimeRemaining -= 1;
      if (table.turnTimeRemaining <= 0) {
        // Force draw for all seats that haven't drawn yet
        for (const seat of table.seats) {
          if (seat && seat.player && seat.bet >= table.minBet && !seat.hasDrawn) {
            this.handlePokerDraw(table, seat);
          }
        }
      } else {
        this.broadcastTableState(table);
        table.turnTimeout = setTimeout(step, 1000);
      }
    };

    table.turnTimeout = setTimeout(step, 1000);
  }

  private handlePlayerAction(table: ServerTable, seat: MultiplayerSeat, action: 'hit' | 'stand' | 'double') {
    if (action === 'stand') {
      seat.isStanding = true;
      seat.statusText = 'Kaldı';
      this.nextPlayerTurn(table, seat.seatIndex);
      return;
    }

    if (action === 'hit') {
      const card = table.deck.pop();
      if (card) {
        card.isFaceUp = true;
        seat.cards.push(card);
      }
      const calc = calculateBlackjackHand(seat.cards);
      seat.score = calc.total;

      if (calc.isBust) {
        seat.isBusted = true;
        seat.statusText = `Bust! (${calc.total})`;
        this.nextPlayerTurn(table, seat.seatIndex);
      } else if (calc.total === 21) {
        seat.isStanding = true;
        seat.statusText = '21 Tamam!';
        this.nextPlayerTurn(table, seat.seatIndex);
      } else {
        // Still player's turn with reset timer
        table.turnTimeRemaining = 25;
        this.broadcastTableState(table);
      }
      return;
    }

    if (action === 'double') {
      seat.isDoubled = true;
      seat.bet = seat.bet * 2;
      const card = table.deck.pop();
      if (card) {
        card.isFaceUp = true;
        seat.cards.push(card);
      }
      const calc = calculateBlackjackHand(seat.cards);
      seat.score = calc.total;
      seat.isStanding = true;

      if (calc.isBust) {
        seat.isBusted = true;
        seat.statusText = `Double Bust! (${calc.total})`;
      } else {
        seat.statusText = `Double: ${calc.total}`;
      }

      this.nextPlayerTurn(table, seat.seatIndex);
    }
  }

  private startDealerTurn(table: ServerTable) {
    table.phase = 'dealer_turn';

    // Reveal hidden dealer card
    for (const c of table.dealerCards) {
      c.isFaceUp = true;
    }

    let dealerCalc = calculateBlackjackHand(table.dealerCards);
    table.dealerScore = dealerCalc.total;
    this.broadcastTableState(table);

    // Dealer draws until 17 or more
    const dealerDrawStep = () => {
      dealerCalc = calculateBlackjackHand(table.dealerCards);
      table.dealerScore = dealerCalc.total;

      if (dealerCalc.total < 17) {
        const newCard = table.deck.pop();
        if (newCard) {
          newCard.isFaceUp = true;
          table.dealerCards.push(newCard);
        }
        this.broadcastTableState(table);
        setTimeout(dealerDrawStep, 800);
      } else {
        // Dealer finished, calculate payouts
        this.resolveRound(table, dealerCalc);
      }
    };

    setTimeout(dealerDrawStep, 800);
  }

  private resolveRound(table: ServerTable, dealerCalc: { total: number; isBust: boolean; isBlackjack: boolean }) {
    table.phase = 'round_ended';
    const dealerScore = dealerCalc.total;
    const dealerBust = dealerCalc.isBust;
    const dealerBlackjack = dealerCalc.isBlackjack;

    for (const seat of table.seats) {
      if (!seat || !seat.player || seat.bet < table.minBet) continue;

      if (seat.isBusted) {
        seat.payout = 0;
        seat.statusText = 'Kaybetti (Bust)';
      } else if (seat.isBlackjack) {
        if (dealerBlackjack) {
          seat.payout = seat.bet; // Push
          seat.statusText = 'Berabere (Push)';
        } else {
          seat.payout = Math.floor(seat.bet * 2.5); // 3:2 payout + bet
          seat.statusText = `👑 BLACKJACK! (+$${(seat.payout - seat.bet).toLocaleString('tr-TR')})`;
        }
      } else if (dealerBust) {
        seat.payout = seat.bet * 2;
        seat.statusText = `Kazandı! Kurpiyer Bust (+$${seat.bet.toLocaleString('tr-TR')})`;
      } else if (dealerBlackjack) {
        seat.payout = 0;
        seat.statusText = 'Kurpiyer Blackjack!';
      } else if (seat.score > dealerScore) {
        seat.payout = seat.bet * 2;
        seat.statusText = `Kazandı! (+$${seat.bet.toLocaleString('tr-TR')})`;
      } else if (seat.score === dealerScore) {
        seat.payout = seat.bet;
        seat.statusText = 'Berabere (Push)';
      } else {
        seat.payout = 0;
        seat.statusText = 'Kaybetti';
      }
    }

    // Add round summary to table history
    const winners = table.seats.filter((s) => s && s.player && s.payout > s.bet);
    const winSummary = winners.length > 0
      ? `Turu kazananlar: ${winners.map((w) => `${w!.player!.name} (+$${(w!.payout - w!.bet).toLocaleString('tr-TR')})`).join(', ')}`
      : 'Bu turda kasa kazandı.';

    table.history.unshift({
      id: `h-${Date.now()}`,
      text: `Tur #${table.roundNumber} tamamlandı. ${winSummary}`,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      type: winners.length > 0 ? 'win' : 'info',
    });

    this.broadcastTableState(table);

    // Auto reset table after 7 seconds for the next round
    if (table.roundResetTimeout) clearTimeout(table.roundResetTimeout);
    table.roundResetTimeout = setTimeout(() => {
      this.resetTableForNextRound(table);
    }, 7000);
  }

  private handlePokerDraw(table: ServerTable, seat: MultiplayerSeat) {
    seat.hasDrawn = true;
    const holds = seat.heldIndices || [];

    // Replace unheld cards
    for (let i = 0; i < 5; i++) {
      if (!holds.includes(i)) {
        const replacement = table.deck.pop();
        if (replacement) {
          replacement.isFaceUp = true;
          seat.cards[i] = replacement;
        }
      }
    }

    // Final evaluation
    const evalResult = evaluate5CardHand(seat.cards);
    seat.pokerEvaluation = evalResult;

    if (evalResult.payoutMultiplier > 0) {
      seat.payout = seat.bet * evalResult.payoutMultiplier;
      seat.statusText = `🎉 ${evalResult.nameTr} (${evalResult.payoutMultiplier}x, +$${seat.payout.toLocaleString('tr-TR')})`;
    } else {
      seat.payout = 0;
      seat.statusText = `${evalResult.nameTr} (Kazanç Yok)`;
    }

    // Check if all seated players have drawn
    const pendingSeats = table.seats.filter((s) => s && s.player && s.bet >= table.minBet && !s.hasDrawn);
    if (pendingSeats.length === 0) {
      if (table.turnTimeout) clearTimeout(table.turnTimeout);
      table.phase = 'round_ended';

      table.history.unshift({
        id: `h-${Date.now()}`,
        text: `Poker Tur #${table.roundNumber} tamamlandı.`,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        type: 'win',
      });

      this.broadcastTableState(table);

      if (table.roundResetTimeout) clearTimeout(table.roundResetTimeout);
      table.roundResetTimeout = setTimeout(() => {
        this.resetTableForNextRound(table);
      }, 7000);
    } else {
      this.broadcastTableState(table);
    }
  }

  private resetTableForNextRound(table: ServerTable) {
    table.phase = 'waiting_bets';
    table.dealerCards = [];
    table.dealerScore = 0;
    table.activeSeatIndex = null;
    table.turnTimeRemaining = 25;

    for (const seat of table.seats) {
      if (seat) {
        seat.cards = [];
        seat.score = 0;
        seat.isStanding = false;
        seat.isBusted = false;
        seat.isBlackjack = false;
        seat.isDoubled = false;
        seat.payout = 0;
        seat.statusText = undefined;
        seat.heldIndices = [];
        seat.hasDrawn = false;
        // Keep their bet if player still sits, or let them adjust
      }
    }

    this.broadcastTableState(table);
  }

  // ---------------- BROADCAST & SERIALIZATION HELPERS ----------------
  private serializeTable(table: ServerTable): MultiplayerTableState {
    return {
      tableId: table.tableId,
      name: table.name,
      gameType: table.gameType,
      phase: table.phase,
      dealerCards: table.dealerCards,
      dealerScore: table.dealerScore,
      seats: table.seats,
      activeSeatIndex: table.activeSeatIndex,
      turnTimeRemaining: table.turnTimeRemaining,
      deckCount: table.deckCount,
      roundNumber: table.roundNumber,
      minBet: table.minBet,
      maxBet: table.maxBet,
      isVipRoom: table.isVipRoom,
      history: table.history.slice(0, 20),
    };
  }

  public getTableSummaries(): TableSummary[] {
    const list: TableSummary[] = [];
    for (const table of this.tables.values()) {
      const seatedCount = table.seats.filter((s) => s && s.player !== null).length;
      list.push({
        tableId: table.tableId,
        name: table.name,
        gameType: table.gameType,
        playerCount: table.clients.size,
        seatedCount,
        maxSeats: 5,
        minBet: table.minBet,
        maxBet: table.maxBet,
        isVipRoom: table.isVipRoom,
        currentPhase: table.phase,
      });
    }
    return list;
  }

  private broadcastTableState(table: ServerTable) {
    const payload = JSON.stringify({
      type: 'table_state',
      state: this.serializeTable(table),
    });

    for (const clientWs of table.clients) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    }
  }

  private broadcastTableChat(table: ServerTable, chatMsg: ChatMessage) {
    table.chatMessages.push(chatMsg);
    if (table.chatMessages.length > 80) {
      table.chatMessages = table.chatMessages.slice(-50);
    }

    const payload = JSON.stringify({
      type: 'chat_broadcast',
      message: chatMsg,
    });

    for (const clientWs of table.clients) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    }
  }

  public broadcastTableList() {
    const payload = JSON.stringify({
      type: 'table_list',
      tables: this.getTableSummaries(),
    });

    for (const [ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private send(ws: WebSocket, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  // ---------------- HTTP REST COMPATIBILITY API ----------------
  public getHttpTableState(tableId: string): { state: MultiplayerTableState; chatMessages: ChatMessage[] } | null {
    const table = this.tables.get(tableId);
    if (!table) return null;
    return {
      state: this.serializeTable(table),
      chatMessages: table.chatMessages.slice(-50),
    };
  }

  public handleHttpAction(msg: any): {
    success: boolean;
    state?: MultiplayerTableState;
    chatMessages?: ChatMessage[];
    tables?: TableSummary[];
    error?: string;
    playerId?: string;
  } {
    const playerId = msg.playerId || `http-player-${Date.now()}`;
    const playerName = (msg.playerName || msg.name || 'VIP Oyuncu').trim();
    const isPasha = playerName.toLowerCase() === 'pasha';

    let client = this.httpClients.get(playerId);
    if (!client) {
      client = {
        playerId,
        playerName,
        isPasha,
        tableId: null,
        lastSeen: Date.now(),
      };
      this.httpClients.set(playerId, client);
    } else {
      client.playerName = playerName;
      client.isPasha = isPasha;
      client.lastSeen = Date.now();
    }

    const targetTableId = msg.tableId || client.tableId;
    const table = targetTableId ? this.tables.get(targetTableId) : null;
    if (table && !client.tableId) {
      client.tableId = table.tableId;
    }

    switch (msg.type) {
      case 'get_tables':
      case 'get_table_list': {
        return {
          success: true,
          tables: this.getTableSummaries(),
          playerId,
        };
      }

      case 'join_table': {
        const tableId = msg.tableId;
        if (!tableId) return { success: false, error: 'Masa ID belirtilmedi.' };

        let table = this.tables.get(tableId);
        if (!table) {
          table = this.createTable({
            tableId,
            name: msg.tableName || `Özel Masa #${tableId.substring(0, 6)}`,
            gameType: msg.gameType || 'blackjack',
            minBet: msg.minBet || 25,
            maxBet: msg.maxBet || 1000000,
            isVipRoom: !!msg.isVipRoom,
          });
        }

        if (client.tableId && client.tableId !== tableId) {
          this.leaveHttpTable(client);
        }

        client.tableId = tableId;

        this.broadcastTableChat(table, {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Sistem',
          isPasha: false,
          text: `${client.playerName} masaya katıldı.`,
          timestamp: Date.now(),
          type: 'system',
        });

        this.broadcastTableState(table);
        this.broadcastTableList();

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
          playerId,
        };
      }

      case 'leave_table': {
        if (client.tableId) {
          this.leaveHttpTable(client);
        }
        return {
          success: true,
          tables: this.getTableSummaries(),
        };
      }

      case 'sit_down': {
        if (!table) return { success: false, error: 'Masa bulunamadı.' };

        const { seatIndex, bankroll } = msg;
        if (seatIndex < 0 || seatIndex >= table.seats.length) {
          return { success: false, error: 'Geçersiz koltuk.' };
        }

        const targetSeat = table.seats[seatIndex];
        if (targetSeat && targetSeat.player) {
          return { success: false, error: 'Bu koltuk dolu!' };
        }

        for (const s of table.seats) {
          if (s && s.player && s.player.id === client.playerId) {
            s.player = null;
            s.bet = 0;
            s.cards = [];
          }
        }

        const playerProfile: PlayerProfile = {
          id: client.playerId,
          name: client.playerName,
          isPasha: client.isPasha,
          bankroll: typeof bankroll === 'number' ? bankroll : 5000,
        };

        table.seats[seatIndex] = {
          seatIndex,
          player: playerProfile,
          bet: 0,
          cards: [],
          score: 0,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
          isDoubled: false,
          payout: 0,
          heldIndices: [],
          hasDrawn: false,
        };

        this.broadcastTableChat(table, {
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Kurpiyer',
          isPasha: true,
          text: `${client.playerName} ${seatIndex + 1}. Koltuğa oturdu.`,
          timestamp: Date.now(),
          type: 'system',
        });

        this.broadcastTableState(table);
        this.broadcastTableList();

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'stand_up': {
        if (!table) return { success: false, error: 'Masa bulunamadı.' };

        let leftSeat = -1;
        for (let i = 0; i < table.seats.length; i++) {
          const s = table.seats[i];
          if (s && s.player && s.player.id === client.playerId) {
            s.player = null;
            s.bet = 0;
            s.cards = [];
            leftSeat = i;
          }
        }

        if (leftSeat !== -1) {
          this.broadcastTableChat(table, {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'Kurpiyer',
            isPasha: true,
            text: `${client.playerName} masadan kalktı.`,
            timestamp: Date.now(),
            type: 'system',
          });
          this.broadcastTableState(table);
          this.broadcastTableList();
        }

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'place_bet': {
        const { amount } = msg;
        if (!table || table.phase !== 'waiting_bets') {
          return { success: false, error: 'Bahisler şu an kapalı.' };
        }

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || !seat.player) return { success: false, error: 'Masada oturmuyorsunuz.' };

        const betAmt = Math.min(table.maxBet, Math.max(0, parseInt(amount, 10) || 0));
        seat.bet = betAmt;

        this.broadcastTableState(table);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'start_deal': {
        if (!table || table.phase !== 'waiting_bets') {
          return { success: false, error: 'El şu an başlatılamaz.' };
        }

        const activeSeats = table.seats.filter((s) => s && s.player && s.bet >= table.minBet);
        if (activeSeats.length === 0) {
          return {
            success: false,
            error: `Oyunu başlatmak için en az bir oyuncunun asgari $${table.minBet} bahis koyması gerekir.`,
          };
        }

        this.startRound(table);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'player_action': {
        const { action } = msg;
        if (!table || table.phase !== 'player_turns') {
          return { success: false, error: 'Şu an oyuncu hamlesi beklenmiyor.' };
        }

        if (table.activeSeatIndex === null) return { success: false, error: 'Aktif koltuk yok.' };
        const activeSeat = table.seats[table.activeSeatIndex];
        if (!activeSeat || !activeSeat.player || activeSeat.player.id !== client.playerId) {
          return { success: false, error: 'Şu anda sizin sıranız değil.' };
        }

        this.handlePlayerAction(table, activeSeat, action);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'poker_toggle_hold': {
        const { cardIndex } = msg;
        if (!table || table.gameType !== 'poker' || table.phase !== 'player_turns') {
          return { success: false };
        }

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || seat.hasDrawn) return { success: false };

        const currentHolds = seat.heldIndices || [];
        if (currentHolds.includes(cardIndex)) {
          seat.heldIndices = currentHolds.filter((idx) => idx !== cardIndex);
        } else {
          seat.heldIndices = [...currentHolds, cardIndex];
        }

        this.broadcastTableState(table);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'poker_draw': {
        if (!table || table.gameType !== 'poker' || table.phase !== 'player_turns') {
          return { success: false };
        }

        const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
        if (!seat || seat.hasDrawn) return { success: false };

        this.handlePokerDraw(table, seat);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'chat_message': {
        const { text, chatType = 'chat' } = msg;
        if (!table || !text || !text.trim()) return { success: false };

        const chatMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: client.playerId,
          senderName: client.playerName,
          isPasha: client.isPasha,
          text: text.trim().slice(0, 140),
          timestamp: Date.now(),
          type: chatType === 'reaction' ? 'reaction' : 'chat',
        };

        this.broadcastTableChat(table, chatMsg);

        return {
          success: true,
          state: this.serializeTable(table),
          chatMessages: table.chatMessages.slice(-50),
        };
      }

      case 'sync_bankroll': {
        const { bankroll } = msg;
        if (table && typeof bankroll === 'number') {
          const seat = table.seats.find((s) => s && s.player && s.player.id === client.playerId);
          if (seat && seat.player) {
            seat.player.bankroll = bankroll;
            this.broadcastTableState(table);
          }
        }
        return { success: true };
      }

      default:
        return { success: false, error: 'Bilinmeyen istek tipi.' };
    }
  }

  private leaveHttpTable(client: { playerId: string; playerName: string; isPasha: boolean; tableId: string | null }) {
    if (!client.tableId) return;
    const table = this.tables.get(client.tableId);
    client.tableId = null;
    if (!table) return;

    for (const s of table.seats) {
      if (s && s.player && s.player.id === client.playerId) {
        s.player = null;
        s.bet = 0;
        s.cards = [];
      }
    }

    this.broadcastTableState(table);
    this.broadcastTableList();
  }
}
