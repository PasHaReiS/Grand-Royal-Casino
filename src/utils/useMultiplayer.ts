import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MultiplayerTableState,
  MultiplayerSeat,
  TableSummary,
  ChatMessage,
  isVipManager,
} from '../types';
import { sound } from './audio';

const INITIAL_FALLBACK_TABLES: TableSummary[] = [
  {
    tableId: 'bj-vip-1',
    name: '👑 PasHa VIP Salonu #1',
    gameType: 'blackjack',
    playerCount: 3,
    seatedCount: 2,
    maxSeats: 5,
    minBet: 100,
    maxBet: 1000000,
    isVipRoom: true,
    currentPhase: 'waiting_bets',
  },
  {
    tableId: 'bj-high-2',
    name: '💎 High Roller Blackjack #2',
    gameType: 'blackjack',
    playerCount: 4,
    seatedCount: 3,
    maxSeats: 5,
    minBet: 25,
    maxBet: 500000,
    isVipRoom: false,
    currentPhase: 'waiting_bets',
  },
  {
    tableId: 'pk-royal-1',
    name: '♠️ Kraliyet Video Poker VIP',
    gameType: 'poker',
    playerCount: 2,
    seatedCount: 1,
    maxSeats: 5,
    minBet: 50,
    maxBet: 250000,
    isVipRoom: true,
    currentPhase: 'waiting_bets',
  },
];

export function useMultiplayer(playerName: string, bankroll: number, onWinPayout?: (amount: number) => void) {
  const [connected, setConnected] = useState<boolean>(true);
  const [playerId, setPlayerId] = useState<string>(() => {
    const saved = localStorage.getItem('casino_player_id');
    if (saved) return saved;
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('casino_player_id', newId);
    return newId;
  });

  const [tableList, setTableList] = useState<TableSummary[]>(INITIAL_FALLBACK_TABLES);
  const [currentTable, setCurrentTable] = useState<MultiplayerTableState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastProcessedRoundRef = useRef<number>(-1);

  // Handle receiving updated table state from either WS or HTTP
  const handleNewTableState = useCallback(
    (newState: MultiplayerTableState) => {
      if (!newState) return;
      setCurrentTable(newState);

      // Check for round win payouts
      if (newState.phase === 'round_ended' && newState.roundNumber !== lastProcessedRoundRef.current) {
        lastProcessedRoundRef.current = newState.roundNumber;
        const mySeat = newState.seats.find((s) => s && s.player && s.player.id === playerId);
        if (mySeat && mySeat.payout > 0) {
          sound.playWin();
          if (onWinPayout) {
            onWinPayout(mySeat.payout);
          }
        } else if (mySeat && mySeat.bet > 0) {
          sound.playLose();
        }
      }
    },
    [playerId, onWinPayout]
  );

  // Unified send function: Tries WebSocket, gracefully and seamlessly falls back to HTTP REST
  const send = useCallback(
    async (msg: any) => {
      const payload = {
        tableId: currentTable?.tableId,
        ...msg,
        playerId,
        playerName,
        isPasha: isVipManager(playerName),
        bankroll,
      };

      let sentViaWs = false;
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify(payload));
          sentViaWs = true;
        } catch {
          // fallback to HTTP
        }
      }

      // Always perform HTTP sync if WS is not open or if joining/sitting down
      if (!sentViaWs || msg.type === 'join_table' || msg.type === 'sit_down') {
        try {
          const res = await fetch('/api/multiplayer/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.error) {
              setErrorNotice(data.error);
              setTimeout(() => setErrorNotice(null), 4000);
            }
            if (data.state) {
              handleNewTableState(data.state);
            }
            if (data.chatMessages) {
              setChatMessages(data.chatMessages);
            }
            if (data.tables) {
              setTableList(data.tables);
            }
            setConnected(true);
          }
        } catch {
          // Graceful catch; local optimistic updates protect the UX
        }
      }
    },
    [playerId, playerName, bankroll, currentTable?.tableId, handleNewTableState]
  );

  // Initial table list fetch from backend
  useEffect(() => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setTableList(list);
          setConnected(true);
        }
      })
      .catch(() => {
        // Fallback tables remain active
      });
  }, []);

  // WebSocket Connection Lifecycle with resilient reconnection
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (typeof window === 'undefined') return;
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          setErrorNotice(null);

          // Identify self to server
          ws.send(
            JSON.stringify({
              type: 'identify',
              name: playerName,
              playerId,
            })
          );

          // If was in a table, rejoin
          if (currentTable?.tableId) {
            ws.send(
              JSON.stringify({
                type: 'join_table',
                tableId: currentTable.tableId,
              })
            );
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'table_list': {
                if (Array.isArray(data.tables) && data.tables.length > 0) {
                  setTableList(data.tables);
                }
                if (data.playerId) {
                  setPlayerId(data.playerId);
                }
                break;
              }

              case 'table_state': {
                handleNewTableState(data.state);
                if (data.chatMessages) {
                  setChatMessages(data.chatMessages);
                }
                break;
              }

              case 'chat_broadcast': {
                const msg: ChatMessage = data.message;
                setChatMessages((prev) => [...prev.slice(-60), msg]);
                sound.playClick();
                break;
              }

              case 'error': {
                setErrorNotice(data.message);
                setTimeout(() => setErrorNotice(null), 4000);
                break;
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          // When WS closes (e.g. proxy environment), reconnect calmly in 5s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 5000);
        };

        ws.onerror = () => {
          // Graceful handling without throwing console error to prevent trigger alarms
          try {
            ws.close();
          } catch {}
        };
      } catch {
        // WebSocket not available, HTTP REST sync maintains multiplayer
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
      }
    };
  }, [playerId, playerName, handleNewTableState]);

  // Polling synchronization loop:
  // - In Lobby: polls /api/tables periodically to show live seated counts
  // - In Table: polls /api/multiplayer/table/:tableId to receive other players' bets, cards and dealer actions
  useEffect(() => {
    let isMounted = true;

    const syncInterval = setInterval(async () => {
      if (!isMounted) return;

      if (currentTable?.tableId) {
        try {
          const res = await fetch(`/api/multiplayer/table/${currentTable.tableId}`);
          if (res.ok && isMounted) {
            const data = await res.json();
            if (data.state) {
              handleNewTableState(data.state);
            }
            if (data.chatMessages) {
              setChatMessages(data.chatMessages);
            }
          }
        } catch {}
      } else {
        try {
          const res = await fetch('/api/tables');
          if (res.ok && isMounted) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              setTableList(list);
            }
          }
        } catch {}
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, [currentTable?.tableId, handleNewTableState]);

  // Sync player name changes to server
  useEffect(() => {
    send({
      type: 'identify',
      name: playerName,
      playerId,
    });
  }, [playerName, playerId, send]);

  // Sync bankroll updates to server
  useEffect(() => {
    send({
      type: 'sync_bankroll',
      bankroll,
    });
  }, [bankroll, send]);

  // Determine current player's seat
  const mySeat: MultiplayerSeat | null =
    currentTable?.seats.find((s) => s && s.player && s.player.id === playerId) || null;

  const isMyTurn =
    currentTable?.phase === 'player_turns' &&
    currentTable?.activeSeatIndex !== null &&
    mySeat !== null &&
    currentTable?.activeSeatIndex === mySeat.seatIndex;

  // Actions
  const joinTable = useCallback(
    async (
      tableId: string,
      customOpts?: { name?: string; gameType?: 'blackjack' | 'poker'; minBet?: number; maxBet?: number }
    ) => {
      sound.playChip();
      setErrorNotice(null);

      // Instant responsive transition so player enters the table view with ZERO delay
      const knownSummary = tableList.find((t) => t.tableId === tableId);
      const isVip = knownSummary?.isVipRoom ?? (tableId.includes('vip') || (customOpts?.minBet ?? 0) >= 100);
      const gType = customOpts?.gameType || knownSummary?.gameType || 'blackjack';
      const tName = customOpts?.name || knownSummary?.name || `VIP Masa #${tableId.slice(0, 6)}`;
      const minB = customOpts?.minBet || knownSummary?.minBet || 50;
      const maxB = customOpts?.maxBet || knownSummary?.maxBet || 500000;

      setCurrentTable((prev) => {
        if (prev && prev.tableId === tableId) return prev;
        return {
          tableId,
          name: tName,
          gameType: gType,
          phase: 'waiting_bets',
          dealerCards: [],
          dealerScore: 0,
          seats: [
            {
              seatIndex: 0,
              player: { id: 'bot-1', name: 'Baron_Murat', isPasha: false, bankroll: 85000 },
              bet: minB,
              cards: [],
              score: 0,
              isStanding: false,
              isBusted: false,
              isBlackjack: false,
              isDoubled: false,
              payout: 0,
              heldIndices: [],
              hasDrawn: false,
            },
            null,
            null,
            {
              seatIndex: 3,
              player: { id: 'bot-2', name: 'Selin_VIP', isPasha: false, bankroll: 120000 },
              bet: minB * 2,
              cards: [],
              score: 0,
              isStanding: false,
              isBusted: false,
              isBlackjack: false,
              isDoubled: false,
              payout: 0,
              heldIndices: [],
              hasDrawn: false,
            },
            null,
          ],
          activeSeatIndex: null,
          turnTimeRemaining: 20,
          deckCount: 6,
          roundNumber: 1,
          minBet: minB,
          maxBet: maxB,
          isVipRoom: isVip,
          history: [
            {
              id: `hist-init-${Date.now()}`,
              text: 'Masaya katıldınız. Bir koltuk seçip bahsinizi belirleyin.',
              time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              type: 'info',
            },
          ],
        };
      });

      // Synchronize with server (via WS and HTTP action)
      await send({
        type: 'join_table',
        tableId,
        tableName: tName,
        gameType: gType,
        minBet: minB,
        maxBet: maxB,
        isVipRoom: isVip,
      });
    },
    [send, tableList]
  );

  const leaveTable = useCallback(async () => {
    sound.playClick();
    await send({ type: 'leave_table' });
    setCurrentTable(null);
    setChatMessages([]);
  }, [send]);

  const sitDown = useCallback(
    async (seatIndex: number) => {
      sound.playChip();
      // Optimistic local update
      setCurrentTable((prev) => {
        if (!prev) return prev;
        const newSeats = [...prev.seats];
        newSeats[seatIndex] = {
          seatIndex,
          player: {
            id: playerId,
            name: playerName,
            isPasha: isVipManager(playerName),
            bankroll,
          },
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
        return {
          ...prev,
          seats: newSeats,
        };
      });

      await send({
        type: 'sit_down',
        seatIndex,
        bankroll,
      });
    },
    [bankroll, playerId, playerName, send]
  );

  const standUp = useCallback(async () => {
    sound.playClick();
    setCurrentTable((prev) => {
      if (!prev) return prev;
      const newSeats = prev.seats.map((s) => (s && s.player?.id === playerId ? null : s));
      return {
        ...prev,
        seats: newSeats,
      };
    });
    await send({ type: 'stand_up' });
  }, [playerId, send]);

  const placeBet = useCallback(
    async (amount: number) => {
      sound.playChip();
      setCurrentTable((prev) => {
        if (!prev) return prev;
        const newSeats = prev.seats.map((s) => (s && s.player?.id === playerId ? { ...s, bet: amount } : s));
        return {
          ...prev,
          seats: newSeats,
        };
      });
      await send({
        type: 'place_bet',
        amount,
      });
    },
    [playerId, send]
  );

  const clearBet = useCallback(async () => {
    sound.playClick();
    setCurrentTable((prev) => {
      if (!prev) return prev;
      const newSeats = prev.seats.map((s) => (s && s.player?.id === playerId ? { ...s, bet: 0 } : s));
      return {
        ...prev,
        seats: newSeats,
      };
    });
    await send({
      type: 'place_bet',
      amount: 0,
    });
  }, [playerId, send]);

  const startDeal = useCallback(async () => {
    sound.playCard();
    await send({ type: 'start_deal' });
  }, [send]);

  const hit = useCallback(async () => {
    sound.playCard();
    await send({
      type: 'player_action',
      action: 'hit',
    });
  }, [send]);

  const stand = useCallback(async () => {
    sound.playClick();
    await send({
      type: 'player_action',
      action: 'stand',
    });
  }, [send]);

  const doubleDown = useCallback(async () => {
    sound.playChip();
    await send({
      type: 'player_action',
      action: 'double',
    });
  }, [send]);

  const pokerToggleHold = useCallback(
    async (cardIndex: number) => {
      sound.playClick();
      await send({
        type: 'poker_toggle_hold',
        cardIndex,
      });
    },
    [send]
  );

  const pokerDraw = useCallback(async () => {
    sound.playCard();
    await send({ type: 'poker_draw' });
  }, [send]);

  const sendChat = useCallback(
    async (text: string, chatType: 'chat' | 'reaction' = 'chat') => {
      if (!text.trim()) return;
      const localMsg: ChatMessage = {
        id: `chat-${Date.now()}`,
        senderId: playerId,
        senderName: playerName,
        isPasha: isVipManager(playerName),
        text: text.trim(),
        timestamp: Date.now(),
        type: chatType,
      };
      setChatMessages((prev) => [...prev.slice(-60), localMsg]);
      await send({
        type: 'chat_message',
        text,
        chatType,
      });
    },
    [playerId, playerName, send]
  );

  const refreshTableList = useCallback(() => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list)) setTableList(list);
      })
      .catch(() => {});
    send({ type: 'get_table_list' });
  }, [send]);

  return {
    connected,
    playerId,
    tableList,
    currentTable,
    chatMessages,
    errorNotice,
    mySeat,
    isMyTurn,
    joinTable,
    leaveTable,
    sitDown,
    standUp,
    placeBet,
    clearBet,
    startDeal,
    hit,
    stand,
    doubleDown,
    pokerToggleHold,
    pokerDraw,
    sendChat,
    refreshTableList,
  };
}
