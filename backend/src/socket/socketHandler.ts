import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import roomManager from './roomManager';
import boardStateManager from './boardStateManager';
import { User, DrawingData, Position, Player, Stamp } from '../types';

interface JoinRoomData {
  roomId: string;
  userName?: string;
}

interface DrawingUpdateData {
  roomId: string;
  drawingData: DrawingData;
}

interface PlayerMoveData {
  roomId: string;
  playerId: string;
  position: Position;
}

interface PlayerStateChangeData {
  roomId: string;
  playerId: string;
  state: Partial<Player>;
}

interface StampAddData {
  roomId: string;
  stamp: Omit<Stamp, 'id'>;
}

interface StampRemoveData {
  roomId: string;
  stampId: string;
}

interface LayerChangeData {
  roomId: string;
  layer: number;
}

interface ClearBoardData {
  roomId: string;
}

export default (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    logger.info(`New client connected: ${socket.id}`);

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });

    socket.on('disconnect', async (reason) => {
      logger.info(`Client ${socket.id} disconnected: ${reason}`);
      try {
        const rooms = await roomManager.getUserRooms(socket.id);
        for (const roomId of rooms) {
          await roomManager.leaveRoom(socket, roomId);
          const users = await roomManager.getRoomUsers(roomId);
          socket.to(roomId).emit('user-left', { userId: socket.id });
          socket.to(roomId).emit('users-update', users);
        }
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });

    socket.on('join-room', async ({ roomId, userName }: JoinRoomData) => {
      try {
        const user: User = {
          id: socket.id,
          name: userName || `User-${socket.id.slice(0, 6)}`,
          color: generateUserColor()
        };

        await roomManager.joinRoom(socket, roomId, user);
        
        const boardState = await boardStateManager.getBoardState(roomId);
        socket.emit('board-state', boardState);
        
        socket.to(roomId).emit('user-joined', user);
        
        const users = await roomManager.getRoomUsers(roomId);
        io.to(roomId).emit('users-update', users);

      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('drawing-update', async ({ roomId, drawingData }: DrawingUpdateData) => {
      try {
        await boardStateManager.updateDrawing(roomId, drawingData);
        socket.to(roomId).emit('drawing-update', { userId: socket.id, drawingData });
      } catch (error) {
        logger.error('Error updating drawing:', error);
      }
    });

    socket.on('player-move', async ({ roomId, playerId, position }: PlayerMoveData) => {
      try {
        await boardStateManager.updatePlayerPosition(roomId, playerId, position);
        socket.to(roomId).emit('player-move', { userId: socket.id, playerId, position });
      } catch (error) {
        logger.error('Error moving player:', error);
      }
    });

    socket.on('player-state-change', async ({ roomId, playerId, state }: PlayerStateChangeData) => {
      try {
        await boardStateManager.updatePlayerState(roomId, playerId, state);
        socket.to(roomId).emit('player-state-change', { userId: socket.id, playerId, state });
      } catch (error) {
        logger.error('Error changing player state:', error);
      }
    });

    socket.on('stamp-add', async (data) => {
      try {
        logger.info(`Stamp add request from ${socket.id}: ${JSON.stringify(data)}`);
        
        if (!data || !data.roomId || !data.stamp) {
          logger.error('Invalid stamp-add data:', data);
          socket.emit('error', { message: 'Invalid stamp data' });
          return;
        }

        const { roomId, stamp } = data;
        
        // Validate stamp data
        if (!stamp.type || !stamp.position || typeof stamp.layer !== 'number') {
          logger.error('Invalid stamp structure:', stamp);
          socket.emit('error', { message: 'Invalid stamp structure' });
          return;
        }

        const stampWithId: Stamp = { ...stamp, id: uuidv4() };
        await boardStateManager.addStamp(roomId, stampWithId);
        io.to(roomId).emit('stamp-add', { userId: socket.id, stamp: stampWithId });
        logger.info(`Stamp added successfully: ${stampWithId.id}`);
      } catch (error) {
        logger.error('Error adding stamp:', error);
        socket.emit('error', { message: 'Failed to add stamp' });
      }
    });

    socket.on('stamp-remove', async ({ roomId, stampId }: StampRemoveData) => {
      try {
        await boardStateManager.removeStamp(roomId, stampId);
        socket.to(roomId).emit('stamp-remove', { userId: socket.id, stampId });
      } catch (error) {
        logger.error('Error removing stamp:', error);
      }
    });

    socket.on('layer-change', async ({ roomId, layer }: LayerChangeData) => {
      socket.to(roomId).emit('layer-change', { userId: socket.id, layer });
    });

    socket.on('clear-board', async ({ roomId }: ClearBoardData) => {
      try {
        await boardStateManager.clearBoard(roomId);
        io.to(roomId).emit('clear-board', { userId: socket.id });
      } catch (error) {
        logger.error('Error clearing board:', error);
      }
    });

  });
};

function generateUserColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}