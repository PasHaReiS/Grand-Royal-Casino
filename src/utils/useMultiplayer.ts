import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MultiplayerTableState,
  MultiplayerSeat,
  TableSummary,
  ChatMessage,
} from '../types';
import { sound } from './audio';

export function useMultiplayer(playerName: string, bankroll: number, onWinPayout?: (amount: number) => void) {
  const [connected, setConnected] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>(() => {
    const saved = localStorage.getItem('casino_player_id');
    if (saved) return saved;
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('casino_player_id', newId);
    return newId;
  });

  const [tableList, setTableList] = useState<TableSummary[]>([]);
  const [currentTable, setCurrentTable] = useState<MultiplayerTableState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastProcessedRoundRef = useRef<number>(-1);

  // Send message over websocket
  const send = useCallback((msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to server
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (socketRef.current) {
        socketRef.current.close();
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
                setTableList(data.tables || []);
                if (data.playerId) {
                  setPlayerId(data.playerId);
                }
                break;
              }

              case 'table_state': {
                const newState: MultiplayerTableState = data.state;
                setCurrentTable(newState);

                if (data.chatMessages) {
                  setChatMessages(data.chatMessages);
                }

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
          } catch (err) {
            console.error('WS parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Try reconnecting in 2.5s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 2500);
        };

        ws.onerror = (e) => {
          console.error('WS error:', e);
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection initiation error:', err);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [playerId]);

  // Sync player name changes to server
  useEffect(() => {
    send({
      type: 'identify',
      name: playerName,
      playerId,
    });
  }, [playerName, playerId, send]);

  // Sync bankroll updates
  useEffect(() => {
    send({
      type: 'sync_bankroll',
      bankroll,
    });
  }, [bankroll, send]);

  // Determine current player's seat
  const mySeat: MultiplayerSeat | null = currentTable?.seats.find(
    (s) => s && s.player && s.player.id === playerId
  ) || null;

  const isMyTurn = currentTable?.phase === 'player_turns' &&
    currentTable?.activeSeatIndex !== null &&
    mySeat !== null &&
    currentTable?.activeSeatIndex === mySeat.seatIndex;

  // Actions
  const joinTable = useCallback((tableId: string, customOpts?: { name?: string; gameType?: 'blackjack' | 'poker'; minBet?: number; maxBet?: number }) => {
    sound.playChip();
    send({
      type: 'join_table',
      tableId,
      tableName: customOpts?.name,
      gameType: customOpts?.gameType,
      minBet: customOpts?.minBet,
      maxBet: customOpts?.maxBet,
    });
  }, [send]);

  const leaveTable = useCallback(() => {
    sound.playClick();
    send({ type: 'leave_table' });
    setCurrentTable(null);
    setChatMessages([]);
  }, [send]);

  const sitDown = useCallback((seatIndex: number) => {
    sound.playChip();
    send({
      type: 'sit_down',
      seatIndex,
      bankroll,
    });
  }, [bankroll, send]);

  const standUp = useCallback(() => {
    sound.playClick();
    send({ type: 'stand_up' });
  }, [send]);

  const placeBet = useCallback((amount: number) => {
    sound.playChip();
    send({
      type: 'place_bet',
      amount,
    });
  }, [send]);

  const clearBet = useCallback(() => {
    sound.playClick();
    send({
      type: 'place_bet',
      amount: 0,
    });
  }, [send]);

  const startDeal = useCallback(() => {
    sound.playCard();
    send({ type: 'start_deal' });
  }, [send]);

  const hit = useCallback(() => {
    sound.playCard();
    send({
      type: 'player_action',
      action: 'hit',
    });
  }, [send]);

  const stand = useCallback(() => {
    sound.playClick();
    send({
      type: 'player_action',
      action: 'stand',
    });
  }, [send]);

  const doubleDown = useCallback(() => {
    sound.playChip();
    send({
      type: 'player_action',
      action: 'double',
    });
  }, [send]);

  const pokerToggleHold = useCallback((cardIndex: number) => {
    sound.playClick();
    send({
      type: 'poker_toggle_hold',
      cardIndex,
    });
  }, [send]);

  const pokerDraw = useCallback(() => {
    sound.playCard();
    send({ type: 'poker_draw' });
  }, [send]);

  const sendChat = useCallback((text: string, chatType: 'chat' | 'reaction' = 'chat') => {
    send({
      type: 'chat_message',
      text,
      chatType,
    });
  }, [send]);

  const refreshTableList = useCallback(() => {
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
