import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import roomManager from '../socket/roomManager';
import logger from '../utils/logger';

const router = Router();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const roomId = uuidv4();
    return res.json({ roomId });
  } catch (error) {
    logger.error('Error creating room:', error);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const roomInfo = await roomManager.getRoomInfo(roomId);
    
    if (!roomInfo) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const users = await roomManager.getRoomUsers(roomId);
    
    return res.json({
      ...roomInfo,
      users,
      userCount: users.length
    });
  } catch (error) {
    logger.error('Error getting room info:', error);
    return res.status(500).json({ error: 'Failed to get room info' });
  }
});

router.get('/:roomId/users', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const users = await roomManager.getRoomUsers(roomId);
    return res.json({ users });
  } catch (error) {
    logger.error('Error getting room users:', error);
    return res.status(500).json({ error: 'Failed to get room users' });
  }
});

export default router;