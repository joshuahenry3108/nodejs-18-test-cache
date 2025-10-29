import express, { Request, Response } from 'express';
import axios from 'axios';
import Redis from 'ioredis';
import db from './database/models';

// --- Redis Setup ---
const createRedisClient = () => {
  const redisHost = process.env.CACHE_HOST || "127.0.0.1";
  const redisPort = Number(process.env.CACHE_PORT) || 6379;
  const redisPassword = process.env.CACHE_PASSWORD || undefined;
  const redisMaxRetry = Number(process.env.REDIS_MAX_RETRY) || 5;

  if (!redisHost) {
    console.error('❌ CACHE_HOST environment variable is missing.');
    process.exit(1);
  }

  const redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > redisMaxRetry) {
        console.log('❌ Failed connecting to Redis server after max retries');
        process.exit(1);
      }
      console.log(`🔁 Retry Redis connection attempt #${times}`);
      return 1000; // retry after 1 second
    },
  });

  redis.on('connect', () => console.log('✅ Connected to Redis'));
  redis.on('error', (err) => console.error('Redis Error:', err));

  return redis;
};

// --- Disconnect Logic ---
const disconnectRedis = async (redis: Redis) => {
  console.log('🔌 Disconnecting Redis...');
  await redis.quit();
  console.log('✅ Redis disconnected');
  process.exit(0);
};

// --- Main Server Function ---
const StartServer = async () => {
  const app = express();
  app.use(express.json());

  // Create Redis client
  const redisClient = createRedisClient();

  // --- Original Health Route ---
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK check tests' });
  });

  // --- Redis Test Route ---
  app.get('/cache-test', async (req: Request, res: Response) => {
    try {
      await redisClient.set('message', 'Hello from Redis!');
      const msg = await redisClient.get('message');
      res.status(200).json({ success: true, message: msg });
    } catch (err) {
      console.error('Redis operation failed:', err);
      res.status(500).json({ success: false, error: 'Redis failure' });
    }
  });

  const baseUrl = process.env.BASE_URL;

  app.get(`${baseUrl}/users`, async (req: Request, res: Response) => {
    try {
      console.log('DB Models available:', Object.keys(db));
      console.log('User model:', db.User);
      const response = await axios.post(
        process.env.THIRD_PARTY_URL as string,
        'Hello World! testing third party',
        {
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );
      const users = await db.User.findAll();
      res.status(200).json({
        success: true,
        data: { users: users },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  app.post(`${baseUrl}/user`, async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      const newUser = await db.User.create({
        name,
        email,
      });
      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // --- Start Express ---
  const PORT = process.env.PORT || 8080;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Listening on port ${PORT}`);
  });

  // Graceful Shutdown
  process.on('SIGINT', () => disconnectRedis(redisClient));
  process.on('SIGTERM', () => disconnectRedis(redisClient));

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
};

StartServer();