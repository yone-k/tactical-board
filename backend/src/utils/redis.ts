import { createClient } from 'redis';
import logger from './logger';

type RedisClient = ReturnType<typeof createClient>;

const client: RedisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    connectTimeout: 60000
  }
});

client.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

client.on('connect', () => {
  logger.info('Redis Client Connected');
});

client.on('reconnecting', () => {
  logger.info('Redis Client Reconnecting');
});

client.on('ready', () => {
  logger.info('Redis Client Ready');
});

let isConnecting = false;

const ensureConnection = async (): Promise<void> => {
  if (!client.isOpen && !isConnecting) {
    isConnecting = true;
    try {
      await client.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    } finally {
      isConnecting = false;
    }
  }
};

// Wrapper client with connection checking
const wrappedClient = {
  async get(key: string) {
    await ensureConnection();
    return client.get(key);
  },
  async set(key: string, value: string, options?: any) {
    await ensureConnection();
    return client.set(key, value, options);
  },
  async del(key: string) {
    await ensureConnection();
    return client.del(key);
  },
  async exists(key: string) {
    await ensureConnection();
    return client.exists(key);
  },
  async hGetAll(key: string) {
    await ensureConnection();
    return client.hGetAll(key);
  },
  async hSet(key: string, data: any) {
    await ensureConnection();
    return client.hSet(key, data);
  },
  async sAdd(key: string, member: string) {
    await ensureConnection();
    return client.sAdd(key, member);
  },
  async sRem(key: string, member: string) {
    await ensureConnection();
    return client.sRem(key, member);
  },
  async sCard(key: string) {
    await ensureConnection();
    return client.sCard(key);
  },
  async sMembers(key: string) {
    await ensureConnection();
    return client.sMembers(key);
  },
  async expire(key: string, seconds: number) {
    await ensureConnection();
    return client.expire(key, seconds);
  },
  async connect() {
    await ensureConnection();
  },
  get isOpen() {
    return client.isOpen;
  },
  disconnect: () => client.disconnect()
};

export default wrappedClient;