import { Socket } from 'socket.io';
import redisClient from '../utils/redis';
import logger from '../utils/logger';
import { User, Room } from '../types';

const ROOM_PREFIX = 'room:';
const USER_PREFIX = 'user:';
const ROOM_USERS_PREFIX = 'room_users:';

class RoomManager {
  async joinRoom(socket: Socket, roomId: string, user: User): Promise<void> {
    try {
      // Check if user is already in a room
      const existingUserData = await redisClient.hGetAll(`${USER_PREFIX}${socket.id}`);
      if (existingUserData && existingUserData.roomId) {
        // Leave the existing room first
        await this.leaveRoom(socket, existingUserData.roomId);
      }
      
      socket.join(roomId);
      
      const userData = {
        ...user,
        roomId,
        joinedAt: new Date().toISOString()
      };
      
      await redisClient.hSet(`${USER_PREFIX}${socket.id}`, userData as any);
      await redisClient.expire(`${USER_PREFIX}${socket.id}`, 604800); // 7日間のTTL
      await redisClient.sAdd(`${ROOM_USERS_PREFIX}${roomId}`, socket.id);
      await redisClient.expire(`${ROOM_USERS_PREFIX}${roomId}`, 604800); // 7日間のTTL
      
      const roomExists = await redisClient.exists(`${ROOM_PREFIX}${roomId}`);
      if (!roomExists) {
        const roomData: Room = {
          id: roomId,
          createdAt: new Date().toISOString(),
          createdBy: socket.id
        };
        await redisClient.hSet(`${ROOM_PREFIX}${roomId}`, roomData as any);
        await redisClient.expire(`${ROOM_PREFIX}${roomId}`, 604800); // 7日間のTTL
      }
      
      logger.info(`User ${socket.id} joined room ${roomId}`);
    } catch (error) {
      logger.error('Error joining room:', error);
      throw error;
    }
  }

  async leaveRoom(socket: Socket, roomId: string): Promise<void> {
    try {
      socket.leave(roomId);
      
      await redisClient.del(`${USER_PREFIX}${socket.id}`);
      await redisClient.sRem(`${ROOM_USERS_PREFIX}${roomId}`, socket.id);
      
      const remainingUsers = await redisClient.sCard(`${ROOM_USERS_PREFIX}${roomId}`);
      if (remainingUsers === 0) {
        await redisClient.del(`${ROOM_PREFIX}${roomId}`);
        await redisClient.del(`board_state:${roomId}`);
        logger.info(`Room ${roomId} deleted (no users remaining)`);
      }
      
      logger.info(`User ${socket.id} left room ${roomId}`);
    } catch (error) {
      logger.error('Error leaving room:', error);
      throw error;
    }
  }

  async getRoomUsers(roomId: string): Promise<User[]> {
    try {
      const userIds = await redisClient.sMembers(`${ROOM_USERS_PREFIX}${roomId}`);
      const users: User[] = [];
      const seenUserNames = new Set<string>();
      
      for (const userId of userIds) {
        const userData = await redisClient.hGetAll(`${USER_PREFIX}${userId}`);
        if (userData && Object.keys(userData).length > 0 && userData.roomId === roomId) {
          // Prevent duplicate usernames
          if (!seenUserNames.has(userData.name)) {
            seenUserNames.add(userData.name);
            users.push(userData as unknown as User);
          }
        }
      }
      
      return users;
    } catch (error) {
      logger.error('Error getting room users:', error);
      return [];
    }
  }

  async getUserRooms(userId: string): Promise<string[]> {
    try {
      const userData = await redisClient.hGetAll(`${USER_PREFIX}${userId}`);
      return userData.roomId ? [userData.roomId] : [];
    } catch (error) {
      logger.error('Error getting user rooms:', error);
      return [];
    }
  }

  async getRoomInfo(roomId: string): Promise<Room | null> {
    try {
      const roomData = await redisClient.hGetAll(`${ROOM_PREFIX}${roomId}`);
      return roomData as unknown as Room;
    } catch (error) {
      logger.error('Error getting room info:', error);
      return null;
    }
  }
}

export default new RoomManager();