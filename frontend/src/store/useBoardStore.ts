import { create } from 'zustand';
import { BoardState, Tool, Player, DrawingData, Stamp, Position, PenColor } from '../types';

interface BoardStore extends BoardState {
  // UI state
  selectedTool: Tool;
  isDrawing: boolean;
  connectedUsers: string[];
  roomId: string | null;
  userName: string;
  
  // Actions
  setSelectedTool: (tool: Tool) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setActiveLayer: (layer: number) => void;
  setMapBackground: (background: string) => void;
  setRoomId: (roomId: string | null) => void;
  setUserName: (userName: string) => void;
  
  // Board actions
  addPlayer: (player: Player) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  movePlayer: (playerId: string, position: Position) => void;
  addDrawing: (drawing: DrawingData) => void;
  addStamp: (stamp: Stamp) => void;
  removeStamp: (stampId: string) => void;
  clearBoard: () => void;
  setBoardState: (state: BoardState) => void;
  setConnectedUsers: (users: string[]) => void;
}

const getDefaultPlayers = (): Player[] => {
  const players: Player[] = [];
  
  // Red team players
  for (let i = 1; i <= 5; i++) {
    players.push({
      id: `red-${i}`,
      team: 'red',
      number: i,
      position: { x: 100 + (i - 1) * 60, y: 100 },
      isDead: false,
      layer: 1
    });
  }
  
  // Blue team players
  for (let i = 1; i <= 5; i++) {
    players.push({
      id: `blue-${i}`,
      team: 'blue',
      number: i,
      position: { x: 100 + (i - 1) * 60, y: 500 },
      isDead: false,
      layer: 1
    });
  }
  
  return players;
};

export const useBoardStore = create<BoardStore>((set, get) => ({
  // Initial board state
  players: getDefaultPlayers(),
  drawings: [],
  stamps: [],
  activeLayer: 1,
  mapBackground: undefined,
  
  // Initial UI state
  selectedTool: { type: 'default' },
  isDrawing: false,
  connectedUsers: [],
  roomId: null,
  userName: '',
  
  // Actions
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setMapBackground: (background) => set({ mapBackground: background }),
  setRoomId: (roomId) => set({ roomId }),
  setUserName: (userName) => set({ userName }),
  
  // Board actions
  addPlayer: (player) => 
    set((state) => ({ players: [...state.players, player] })),
    
  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      )
    })),
    
  movePlayer: (playerId, position) =>
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, position } : player
      )
    })),
    
  addDrawing: (drawing) =>
    set((state) => ({ drawings: [...state.drawings, drawing] })),
    
  addStamp: (stamp) =>
    set((state) => ({ stamps: [...state.stamps, stamp] })),
    
  removeStamp: (stampId) =>
    set((state) => ({
      stamps: state.stamps.filter((stamp) => stamp.id !== stampId)
    })),
    
  clearBoard: () =>
    set({
      players: getDefaultPlayers(),
      drawings: [],
      stamps: [],
      activeLayer: 1
    }),
    
  setBoardState: (boardState) =>
    set({
      players: boardState.players,
      drawings: boardState.drawings,
      stamps: boardState.stamps,
      activeLayer: boardState.activeLayer,
      mapBackground: boardState.mapBackground
    }),
    
  setConnectedUsers: (users) => set({ connectedUsers: users })
}));