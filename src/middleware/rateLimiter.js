const fs = require('fs');
const path = require('path');
const redis = require('../lib/redisClient');

// Load Lua Script at startup (Performance optimization)
const LUA_SCRIPT = fs.readFileSync(path.join(__dirname, '../scripts/rateLimit.lua'), 'utf8');

/**
 * Distributed Rate Limiter Middleware
 * @param {string} ruleName - Identifier for the limit (e.g., 'global', 'api')
 * @param {number|function} windowSeconds - Time window in seconds (or function returning it)
 * @param {number|function} limit - Max requests per window (or function returning it)
 */
const rateLimiter = (ruleName, windowSeconds, limit) => {
    return async (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;

        // Resolve dynamic values if functions are provided
        const finalWindow = typeof windowSeconds === 'function' ? windowSeconds() : windowSeconds;
        const finalLimit = typeof limit === 'function' ? limit() : limit;

        const key = `ratelimit:${ruleName}:${ip}`;

        try {
            // EXECUTE ATOMIC LUA SCRIPT
            // Returns: [allowed (0/1), currentCount, ttl]
            const [allowed, currentCount, ttl] = await redis.eval(LUA_SCRIPT, 1, key, finalWindow, finalLimit);

            // Add headers for visibility
            res.setHeader('X-RateLimit-Limit', finalLimit);
            res.setHeader('X-RateLimit-Window', finalWindow);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, finalLimit - currentCount));
            res.setHeader('X-RateLimit-Reset', ttl);

            if (allowed === 1) {
                next();
            } else {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Try again in ${ttl} seconds.`
                });
            }
        } catch (error) {
            console.error('⚠️ [RateLimit] Redis Failed, checking Fail-Open strategy...');
            console.error(error.message);

            // FAIL-OPEN STRATEGY:
            // If Redis is down, we allow the request to proceed rather than blocking legitimate users.
            // In a strict financial app, this might be Fail-Closed, but for high availability, Fail-Open is preferred.
            res.setHeader('X-RateLimit-Status', 'Fail-Open');
            next();
        }
    };
};

module.exports = rateLimiter;
