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
  id?: string;
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
  content?: string; // For text stamps
  imageUrl?: string; // For custom stamps
}

export interface BoardState {
  players: Player[];
  drawings: DrawingData[];
  stamps: Stamp[];
  mapBackground?: string;
  activeLayer: number;
}

export interface SocketData {
  roomId: string;
  userId: string;
}

export interface DrawingUpdateData extends SocketData {
  drawingData: DrawingData;
}

export interface DrawingRemoveData extends SocketData {
  drawingId: string;
}

export interface PlayerMoveData extends SocketData {
  playerId: string;
  position: Position;
}

export interface PlayerStateChangeData extends SocketData {
  playerId: string;
  state: Partial<Player>;
}

export interface StampData extends SocketData {
  stamp: Stamp;
}

export interface LayerChangeData extends SocketData {
  layer: number;
}