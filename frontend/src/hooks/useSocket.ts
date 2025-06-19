import { useEffect, useState, useCallback, useRef } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { socketManager } from '../utils/socketManager';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const boardStore = useBoardStore();
  const { roomId, userName } = boardStore;
  const isSetupRef = useRef(false);

  useEffect(() => {
    if (!roomId || !userName) {
      setIsConnected(false);
      isSetupRef.current = false;
      return;
    }

    // 既にセットアップ済みの場合は重複実行を防ぐ
    const setupKey = `${roomId}-${userName}`;
    if (isSetupRef.current === setupKey) {
      return;
    }
    
    // Connect using singleton socket manager
    const socket = socketManager.connect(roomId, userName);
    
    // Set up event listeners
    setupBoardEventListeners();
    
    // Update connection status
    setIsConnected(socketManager.isConnected());
    
    // Listen for connection status changes
    const updateConnectionStatus = () => setIsConnected(socketManager.isConnected());
    socketManager.addListener('connect', updateConnectionStatus);
    socketManager.addListener('disconnect', updateConnectionStatus);
    
    isSetupRef.current = setupKey;
    
    return () => {
      // Clean up listeners but don't disconnect
      socketManager.removeListener('connect');
      socketManager.removeListener('disconnect');
      cleanupBoardEventListeners();
      isSetupRef.current = false;
    };
  }, [roomId, userName]);

  const setupBoardEventListeners = () => {
    // Board state events
    socketManager.addListener('board-state', (boardState) => {
      boardStore.setBoardState(boardState);
    });

    socketManager.addListener('drawing-update', ({ userId, drawingData }) => {
      try {
        if (userId !== socketManager.isConnected() && userId) {
          boardStore.addDrawing(drawingData);
        }
      } catch (error) {
        console.error('Error handling drawing-update event:', error);
      }
    });

    socketManager.addListener('drawing-remove', ({ userId, drawingId }) => {
      try {
        if (userId !== socketManager.isConnected() && userId) {
          boardStore.removeDrawing(drawingId);
        }
      } catch (error) {
        console.error('Error handling drawing-remove event:', error);
      }
    });

    socketManager.addListener('player-move', ({ userId, playerId, position }) => {
      try {
        if (userId !== socketManager.isConnected() && userId) {
          boardStore.movePlayer(playerId, position);
        }
      } catch (error) {
        console.error('Error handling player-move event:', error);
      }
    });

    socketManager.addListener('player-state-change', ({ userId, playerId, state }) => {
      try {
        if (userId !== socketManager.isConnected() && userId) {
          boardStore.updatePlayer(playerId, state);
        }
      } catch (error) {
        console.error('Error handling player-state-change event:', error);
      }
    });

    socketManager.addListener('stamp-add', ({ userId, stamp }) => {
      try {
        if (!stamp || !stamp.id || !stamp.type || !stamp.position) {
          console.error('Invalid stamp received from server:', stamp);
          return;
        }
        
        boardStore.addStamp(stamp);
      } catch (error) {
        console.error('Error handling stamp-add event:', error);
      }
    });

    socketManager.addListener('stamp-move', ({ userId, stampId, position }) => {
      try {
        if (userId !== socketManager.isConnected() && userId) {
          boardStore.moveStamp(stampId, position);
        }
      } catch (error) {
        console.error('Error handling stamp-move event:', error);
      }
    });

    socketManager.addListener('stamp-remove', ({ userId, stampId }) => {
      if (userId !== socketManager.isConnected() && userId) {
        boardStore.removeStamp(stampId);
      }
    });

    socketManager.addListener('clear-board', ({ userId }) => {
      boardStore.clearBoard();
      toast('ボードがクリアされました');
    });

    socketManager.addListener('user-joined', (user) => {
      // 自分以外のユーザーが参加した場合のみアラート表示
      const currentUserName = useBoardStore.getState().userName;
      if (user.name !== currentUserName) {
        toast.success(`${user.name}が参加しました`);
      }
    });

    socketManager.addListener('user-left', ({ userId }) => {
      // アラートは表示せず、ユーザーリストの更新のみ
    });

    socketManager.addListener('users-update', (users) => {
      boardStore.setConnectedUsers(users.map((u: any) => u.name));
    });

    socketManager.addListener('error', (data) => {
      console.error('Socket error received:', data);
      const message = data?.message || 'Unknown error';
      toast.error(message);
    });
  };

  const cleanupBoardEventListeners = () => {
    const events = [
      'board-state', 'drawing-update', 'drawing-remove', 'player-move', 'player-state-change',
      'stamp-add', 'stamp-move', 'stamp-remove', 'clear-board', 'user-joined', 'user-left',
      'users-update', 'error'
    ];
    
    events.forEach(event => socketManager.removeListener(event));
  };

  // Socket event emitters
  const emitDrawingUpdate = (drawingData: any) => {
    if (!socketManager.isConnected() || !roomId) return;
    try {
      socketManager.emit('drawing-update', { roomId, drawingData });
    } catch (error) {
      console.error('Error emitting drawing-update:', error);
    }
  };

  const emitDrawingRemove = (drawingId: string) => {
    if (!socketManager.isConnected() || !roomId) return;
    try {
      socketManager.emit('drawing-remove', { roomId, drawingId });
    } catch (error) {
      console.error('Error emitting drawing-remove:', error);
    }
  };

  const emitPlayerMove = (playerId: string, position: any) => {
    if (!socketManager.isConnected() || !roomId) return;
    try {
      socketManager.emit('player-move', { roomId, playerId, position });
    } catch (error) {
      console.error('Error emitting player-move:', error);
    }
  };

  const emitPlayerStateChange = (playerId: string, state: any) => {
    if (!socketManager.isConnected() || !roomId) return;
    try {
      socketManager.emit('player-state-change', { roomId, playerId, state });
    } catch (error) {
      console.error('Error emitting player-state-change:', error);
    }
  };

  const emitStampAdd = (stamp: any) => {
    if (!socketManager.isConnected() || !roomId) {
      console.error('Cannot emit stamp-add: socket or roomId missing', { 
        connected: socketManager.isConnected(), 
        roomId 
      });
      return;
    }
    
    // Validate stamp data before sending
    if (!stamp || !stamp.type || !stamp.position || typeof stamp.layer !== 'number') {
      console.error('Invalid stamp data:', stamp);
      toast.error('無効なスタンプデータです');
      return;
    }
    
    if (typeof stamp.position.x !== 'number' || typeof stamp.position.y !== 'number' || 
        isNaN(stamp.position.x) || isNaN(stamp.position.y) ||
        !isFinite(stamp.position.x) || !isFinite(stamp.position.y)) {
      console.error('Invalid position data:', stamp.position);
      toast.error('無効な位置データです');
      return;
    }
    
    if (typeof stamp.layer !== 'number' || isNaN(stamp.layer) || stamp.layer < 0 || stamp.layer > 4) {
      console.error('Invalid layer data:', stamp.layer);
      toast.error('無効なレイヤーデータです');
      return;
    }
    
    try {
      socketManager.emit('stamp-add', { roomId, stamp });
    } catch (error) {
      console.error('Error emitting stamp-add:', error);
      toast.error('スタンプの送信に失敗しました');
    }
  };

  const emitStampMove = (stampId: string, position: any) => {
    if (!socketManager.isConnected() || !roomId) return;
    try {
      socketManager.emit('stamp-move', { roomId, stampId, position });
    } catch (error) {
      console.error('Error emitting stamp-move:', error);
    }
  };

  const emitStampRemove = (stampId: string) => {
    if (socketManager.isConnected() && roomId) {
      socketManager.emit('stamp-remove', { roomId, stampId });
    }
  };

  const emitLayerChange = (layer: number) => {
    if (socketManager.isConnected() && roomId) {
      socketManager.emit('layer-change', { roomId, layer });
    }
  };

  const emitClearBoard = () => {
    if (socketManager.isConnected() && roomId) {
      socketManager.emit('clear-board', { roomId });
    }
  };

  return {
    isConnected,
    socket: socketManager,
    emitDrawingUpdate,
    emitDrawingRemove,
    emitPlayerMove,
    emitPlayerStateChange,
    emitStampAdd,
    emitStampMove,
    emitStampRemove,
    emitLayerChange,
    emitClearBoard
  };
};