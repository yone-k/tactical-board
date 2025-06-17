import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketManager {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private currentUserName: string | null = null;
  private listeners: Map<string, (...args: any[]) => void> = new Map();
  private hasJoinedRoom: boolean = false;

  connect(roomId: string, userName: string) {
    console.log(`SocketManager.connect called with roomId: ${roomId}, userName: ${userName}`);
    console.log(`Current state: roomId=${this.currentRoomId}, userName=${this.currentUserName}, connected=${this.socket?.connected}, hasJoinedRoom=${this.hasJoinedRoom}`);
    
    if (this.currentRoomId === roomId && this.currentUserName === userName && this.socket?.connected && this.hasJoinedRoom) {
      console.log('Already connected to the same room, returning existing socket');
      return this.socket;
    }

    // Reset join flag when connecting to a different room
    if (this.currentRoomId !== roomId || this.currentUserName !== userName) {
      console.log('Room or user changed, resetting join flag');
      this.hasJoinedRoom = false;
    }

    // Only create new socket if we don't have one
    if (!this.socket) {
      console.log('Creating new socket connection');
      this.socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      this.setupCoreListeners();
    }

    this.currentRoomId = roomId;
    this.currentUserName = userName;

    if (this.socket.connected && !this.hasJoinedRoom) {
      console.log('Socket connected, joining room immediately');
      this.joinRoom();
    } else if (!this.socket.connected) {
      console.log('Socket not connected, waiting for connection to join room');
      this.socket.once('connect', () => {
        console.log('Socket connected, joining room');
        if (!this.hasJoinedRoom) {
          this.joinRoom();
        }
      });
    }

    return this.socket;
  }

  private setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected via SocketManager');
      toast.success('サーバーに接続しました');
      // joinRoomはここでは呼ばない（重複防止）
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('接続に失敗しました');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('サーバーから切断されました');
      } else if (reason !== 'io client disconnect') {
        toast.error(`接続が切断されました: ${reason}`);
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private joinRoom() {
    console.log(`joinRoom called: socket=${!!this.socket}, roomId=${this.currentRoomId}, userName=${this.currentUserName}, hasJoinedRoom=${this.hasJoinedRoom}`);
    if (this.socket && this.currentRoomId && this.currentUserName && !this.hasJoinedRoom) {
      console.log(`Emitting join-room event for room ${this.currentRoomId} as ${this.currentUserName}`);
      this.socket.emit('join-room', { 
        roomId: this.currentRoomId, 
        userName: this.currentUserName 
      });
      this.hasJoinedRoom = true;
      console.log('hasJoinedRoom set to true');
    } else {
      console.log('joinRoom skipped - conditions not met');
    }
  }

  addListener(event: string, listener: (...args: any[]) => void) {
    if (this.socket) {
      // Remove existing listener for this event first to prevent duplicates
      this.removeListener(event);
      this.socket.on(event, listener);
      this.listeners.set(event, listener);
      console.log(`Added listener for event: ${event}`);
    }
  }

  removeListener(event: string) {
    if (this.socket) {
      const listener = this.listeners.get(event);
      if (listener) {
        this.socket.off(event, listener);
        this.listeners.delete(event);
        console.log(`Removed listener for event: ${event}`);
      }
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.currentUserName = null;
      this.hasJoinedRoom = false;
      this.listeners.clear();
    }
  }
}

export const socketManager = new SocketManager();