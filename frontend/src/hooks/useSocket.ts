import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBoardStore } from '../store/useBoardStore';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { 
    roomId, 
    userName, 
    setBoardState, 
    addDrawing, 
    movePlayer, 
    updatePlayer, 
    addStamp, 
    removeStamp, 
    clearBoard,
    setConnectedUsers
  } = useBoardStore();

  useEffect(() => {
    if (!roomId || !userName) return;

    // Cleanup existing socket if any
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    // Create socket connection
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      toast.success('サーバーに接続しました');
      
      // Join room
      socket?.emit('join-room', { roomId, userName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('サーバーから切断されました');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('接続に失敗しました');
    });

    // Board state events
    socket.on('board-state', (boardState) => {
      setBoardState(boardState);
    });

    socket.on('drawing-update', ({ userId, drawingData }) => {
      // Only add if it's from another user
      if (userId !== socket.id) {
        addDrawing(drawingData);
      }
    });

    socket.on('player-move', ({ userId, playerId, position }) => {
      // Only update if it's from another user
      if (userId !== socket.id) {
        movePlayer(playerId, position);
      }
    });

    socket.on('player-state-change', ({ userId, playerId, state }) => {
      // Only update if it's from another user
      if (userId !== socket.id) {
        updatePlayer(playerId, state);
      }
    });

    socket.on('stamp-add', ({ userId, stamp }) => {
      // Always add stamps since server assigns ID
      addStamp(stamp);
    });

    socket.on('stamp-remove', ({ userId, stampId }) => {
      // Only remove if it's from another user
      if (userId !== socket.id) {
        removeStamp(stampId);
      }
    });

    socket.on('clear-board', ({ userId }) => {
      clearBoard();
      toast.info('ボードがクリアされました');
    });

    // User events
    socket.on('user-joined', (user) => {
      toast.success(`${user.name}が参加しました`);
    });

    socket.on('user-left', ({ userId }) => {
      toast.info('ユーザーが退出しました');
    });

    socket.on('users-update', (users) => {
      setConnectedUsers(users.map((u: any) => u.name));
    });

    // Error handling
    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      setIsConnected(false);
    };
  }, [roomId, userName]);

  // Socket event emitters
  const emitDrawingUpdate = (drawingData: any) => {
    socket?.emit('drawing-update', { roomId, drawingData });
  };

  const emitPlayerMove = (playerId: string, position: any) => {
    socket?.emit('player-move', { roomId, playerId, position });
  };

  const emitPlayerStateChange = (playerId: string, state: any) => {
    socket?.emit('player-state-change', { roomId, playerId, state });
  };

  const emitStampAdd = (stamp: any) => {
    socket?.emit('stamp-add', { roomId, stamp });
  };

  const emitStampRemove = (stampId: string) => {
    socket?.emit('stamp-remove', { roomId, stampId });
  };

  const emitLayerChange = (layer: number) => {
    socket?.emit('layer-change', { roomId, layer });
  };

  const emitClearBoard = () => {
    socket?.emit('clear-board', { roomId });
  };

  return {
    isConnected,
    socket,
    emitDrawingUpdate,
    emitPlayerMove,
    emitPlayerStateChange,
    emitStampAdd,
    emitStampRemove,
    emitLayerChange,
    emitClearBoard
  };
};