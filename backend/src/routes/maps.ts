import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import logger from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/maps');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/upload', upload.single('map'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/maps/${req.file.filename}`;
    return res.json({ 
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    logger.error('Error uploading map:', error);
    return res.status(500).json({ error: 'Failed to upload map' });
  }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const mapsDir = path.join(__dirname, '../../uploads/maps');
    
    try {
      const files = await fs.readdir(mapsDir);
      const maps = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          filename: file,
          url: `/uploads/maps/${file}`
        }));
      
      return res.json({ maps });
    } catch (error) {
      // Directory doesn't exist yet
      return res.json({ maps: [] });
    }
  } catch (error) {
    logger.error('Error listing maps:', error);
    return res.status(500).json({ error: 'Failed to list maps' });
  }
});

export default router;