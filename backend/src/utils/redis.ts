import { createClient } from 'redis';
import logger from './logger';

type RedisClient = ReturnType<typeof createClient>;

const client: RedisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

client.on('connect', () => {
  logger.info('Redis Client Connected');
});

export default client;