import redisClient from '../utils/redis';
import logger from '../utils/logger';
import { BoardState, Player, DrawingData, Stamp, Position } from '../types';

const BOARD_STATE_PREFIX = 'board_state:';

class BoardStateManager {
  private getDefaultBoardState(): BoardState {
    const players: Player[] = [];
    
    // Initialize red team players
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
    
    // Initialize blue team players
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
    
    return {
      players,
      drawings: [],
      stamps: [],
      activeLayer: 1
    };
  }

  async getBoardState(roomId: string): Promise<BoardState> {
    try {
      const stateStr = await redisClient.get(`${BOARD_STATE_PREFIX}${roomId}`);
      if (stateStr) {
        return JSON.parse(stateStr);
      }
      
      const defaultState = this.getDefaultBoardState();
      await this.saveBoardState(roomId, defaultState);
      return defaultState;
    } catch (error) {
      logger.error('Error getting board state:', error);
      return this.getDefaultBoardState();
    }
  }

  async saveBoardState(roomId: string, state: BoardState): Promise<void> {
    try {
      await redisClient.set(
        `${BOARD_STATE_PREFIX}${roomId}`,
        JSON.stringify(state),
        { EX: 86400 } // Expire after 24 hours
      );
    } catch (error) {
      logger.error('Error saving board state:', error);
      throw error;
    }
  }

  async updateDrawing(roomId: string, drawingData: DrawingData): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      
      // Add ID if not present
      if (!drawingData.id) {
        drawingData.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      }
      
      state.drawings.push(drawingData);
      
      // Limit drawings to prevent memory issues
      if (state.drawings.length > 1000) {
        state.drawings = state.drawings.slice(-1000);
      }
      
      await this.saveBoardState(roomId, state);
    } catch (error) {
      logger.error('Error updating drawing:', error);
      throw error;
    }
  }

  async removeDrawing(roomId: string, drawingId: string): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      state.drawings = state.drawings.filter(d => d.id !== drawingId);
      await this.saveBoardState(roomId, state);
    } catch (error) {
      logger.error('Error removing drawing:', error);
      throw error;
    }
  }

  async updatePlayerPosition(roomId: string, playerId: string, position: Position): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      const player = state.players.find(p => p.id === playerId);
      
      if (player) {
        player.position = position;
        await this.saveBoardState(roomId, state);
      }
    } catch (error) {
      logger.error('Error updating player position:', error);
      throw error;
    }
  }

  async updatePlayerState(roomId: string, playerId: string, playerState: Partial<Player>): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        state.players[playerIndex] = {
          ...state.players[playerIndex],
          ...playerState
        };
        await this.saveBoardState(roomId, state);
      }
    } catch (error) {
      logger.error('Error updating player state:', error);
      throw error;
    }
  }

  async addStamp(roomId: string, stamp: Stamp): Promise<void> {
    try {
      logger.info(`Adding stamp to room ${roomId}: ${JSON.stringify(stamp)}`);
      const state = await this.getBoardState(roomId);
      state.stamps.push(stamp);
      
      // Limit stamps to prevent memory issues
      if (state.stamps.length > 500) {
        state.stamps = state.stamps.slice(-500);
      }
      
      await this.saveBoardState(roomId, state);
      logger.info(`Stamp added successfully to room ${roomId}`);
    } catch (error) {
      logger.error(`Error adding stamp to room ${roomId}:`, error);
      throw new Error(`Failed to add stamp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeStamp(roomId: string, stampId: string): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      state.stamps = state.stamps.filter(s => s.id !== stampId);
      await this.saveBoardState(roomId, state);
    } catch (error) {
      logger.error('Error removing stamp:', error);
      throw error;
    }
  }

  async clearBoard(roomId: string): Promise<void> {
    try {
      const state = await this.getBoardState(roomId);
      state.drawings = [];
      state.stamps = [];
      
      // Reset player positions
      state.players = this.getDefaultBoardState().players;
      
      await this.saveBoardState(roomId, state);
    } catch (error) {
      logger.error('Error clearing board:', error);
      throw error;
    }
  }
}

export default new BoardStateManager();