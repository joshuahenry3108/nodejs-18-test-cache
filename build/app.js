"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const models_1 = __importDefault(require("./database/models"));
const createRedisClient = () => {
    const redisHost = process.env.CACHE_HOST;
    const redisPort = Number(process.env.CACHE_PORT) || 6379;
    const redisPassword = process.env.CACHE_PASSWORD;
    const redisMaxRetry = Number(process.env.REDIS_MAX_RETRY) || 5;
    if (!redisHost) {
        console.error('❌ CACHE_HOST environment variable is missing.');
        process.exit(1);
    }
    const redis = new ioredis_1.default({
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
            return 1000;
        },
    });
    redis.on('connect', () => console.log('✅ Connected to Redis'));
    redis.on('error', (err) => console.error('Redis Error:', err));
    return redis;
};
const disconnectRedis = (redis) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🔌 Disconnecting Redis...');
    yield redis.quit();
    console.log('✅ Redis disconnected');
    process.exit(0);
});
const StartServer = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const redisClient = createRedisClient();
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK check tests' });
    });
    app.get('/cache-test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield redisClient.set('message', 'Hello from Redis!');
            const msg = yield redisClient.get('message');
            res.status(200).json({ success: true, message: msg });
        }
        catch (err) {
            console.error('Redis operation failed:', err);
            res.status(500).json({ success: false, error: 'Redis failure' });
        }
    }));
    const baseUrl = process.env.BASE_URL;
    app.get(`${baseUrl}/users`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log('DB Models available:', Object.keys(models_1.default));
            console.log('User model:', models_1.default.User);
            const response = yield axios_1.default.post(process.env.THIRD_PARTY_URL, 'Hello World! testing third party', {
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
            const users = yield models_1.default.User.findAll();
            res.status(200).json({
                success: true,
                data: { users: users },
            });
        }
        catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }));
    app.post(`${baseUrl}/user`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { name, email } = req.body;
            const newUser = yield models_1.default.User.create({
                name,
                email,
            });
            res.status(201).json({
                success: true,
                data: newUser,
            });
        }
        catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }));
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
        console.log(`🚀 Listening on port ${PORT}`);
    });
    process.on('SIGINT', () => disconnectRedis(redisClient));
    process.on('SIGTERM', () => disconnectRedis(redisClient));
    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });
});
StartServer();
