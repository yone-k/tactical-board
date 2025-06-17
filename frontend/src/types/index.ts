export interface User {
  id: string;
  name: string;
  color: string;
  roomId?: string;
  joinedAt?: string;
}

export interface Room {
  id: string;
  createdAt: string;
  createdBy: string;
  users?: User[];
  userCount?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  team: 'red' | 'blue';
  number: number;
  position: Position;
  isDead: boolean;
  layer: number;
}

export interface DrawingData {
  type: 'pen' | 'line';
  points: number[];
  color: string;
  strokeWidth: number;
  layer: number;
}

export interface Stamp {
  id: string;
  type: 'frag' | 'smoke' | 'stun' | 'custom' | 'text';
  position: Position;
  layer: number;
  content?: string;
  imageUrl?: string;
}

export interface BoardState {
  players: Player[];
  drawings: DrawingData[];
  stamps: Stamp[];
  mapBackground?: string;
  activeLayer: number;
}

export interface Tool {
  type: 'pen' | 'eraser' | 'frag' | 'smoke' | 'stun' | 'custom' | 'text';
  color?: string;
  strokeWidth?: number;
  content?: string;
}

export interface SocketEvents {
  'join-room': { roomId: string; userName?: string };
  'drawing-update': { roomId: string; drawingData: DrawingData };
  'player-move': { roomId: string; playerId: string; position: Position };
  'player-state-change': { roomId: string; playerId: string; state: Partial<Player> };
  'stamp-add': { roomId: string; stamp: Omit<Stamp, 'id'> };
  'stamp-remove': { roomId: string; stampId: string };
  'layer-change': { roomId: string; layer: number };
  'clear-board': { roomId: string };
}

export type PenColor = '#FFFF00' | '#00FF00' | '#00FFFF' | '#800080' | '#FFA500' | '#FFFFFF' | '#000000';