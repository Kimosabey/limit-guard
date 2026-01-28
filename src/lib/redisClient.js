const Redis = require('ioredis');

// Singleton Redis Client
const redis = new Redis({
    port: process.env.REDIS_PORT || 6380,
    host: process.env.REDIS_HOST || '127.0.0.1', // Default to localhost for dev
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Fail fast if we can't connect initially (optional, but good for debugging)
    maxRetriesPerRequest: 1
});

redis.on('connect', () => {
    console.log('✅ [Redis] Connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ [Redis] Connection Error:', err.message);
    // Don't crash the app on Redis error - we want Fail-Open!
});

module.exports = redis;
