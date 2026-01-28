require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimiter = require('./middleware/rateLimiter');
const redisClient = require('./lib/redisClient');
const geoip = require('geoip-lite');

// --- METRICS STORE (In-Memory) ---
const metrics = {
    total: 0,
    allowed: 0,
    blocked: 0,
    history: [],
    geo: {} // Stores request counts by country: { US: 50, IN: 20 }
};

// --- DYNAMIC RULES STORE (In-Memory) ---
// In a real app, strict rules might be in Redis, but this is fast.
const activeRules = {
    global: { limit: 10, window: 60 }
};

// Update history every 5 seconds
setInterval(() => {
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} `;

    // Add current snapshot to history
    metrics.history.push({
        time: timeLabel,
        allowed: metrics.allowed, // Snapshot cumulative or delta? Let's use cumulative for now, FE can calc delta or just show total. 
        // Actually, chart needs "requests per timeframe". Let's store delta.
        // Resetting counters for "per interval" visualization would be better for a "Traffic Volume" chart.
        // But for "Total Requests" KPI we need cumulative.
        // Let's store BOTH.
    });

    // Keep only last 20 points (approx 1-2 mins) to keep payload light
    if (metrics.history.length > 20) metrics.history.shift();
}, 5000);

const app = express();
const PORT = process.env.PORT || 8800;

app.use(cors({
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-RateLimit-Window']
})); // Allow all origins for "Hacker Dashboard"
app.use(express.json());

// 1. Validating Redis Connection (Optional health check)
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'LimitGuard' });
});

// 2. Public Endpoint (No Limit)
app.get('/', (req, res) => {
    res.send('Welcome to LimitGuard! Try /api/test to see rate limiting in action.');
});

// 3. Protected Endpoint (Rate Limited)
// Dynamic Limit: Reads from activeRules

// --- NEW STATUS API (Not Rate Limited) ---
app.get('/api/status', async (req, res) => {
    const start = process.hrtime();
    let isRedisConnected = false;
    let latency = 0;

    try {
        // Force a PING to check actual connectivity
        // ioredis 'status' property can sometimes lag or be 'connecting'
        await redisClient.ping();
        isRedisConnected = true;
        const diff = process.hrtime(start);
        latency = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2); // ms
    } catch (e) {
        isRedisConnected = false;
        // console.log("Redis Ping Failed:", e.message);
    }

    res.json({
        success: true,
        system: {
            uptime: process.uptime(),
            redisStatus: isRedisConnected ? 'Connected' : 'Disconnected',
            latency: latency,
            timestamp: new Date().toISOString()
        },
        metrics: {
            total: metrics.total,
            allowed: metrics.allowed,
            blocked: metrics.blocked,
            passRate: metrics.total > 0 ? ((metrics.allowed / metrics.total) * 100).toFixed(1) : 100,
            blockRate: metrics.total > 0 ? ((metrics.blocked / metrics.total) * 100).toFixed(1) : 0,
            geo: metrics.geo
        },
        rules: activeRules,
        history: metrics.history
    });
});

// --- RULES MANAGEMENT API (Not Rate Limited) ---
app.post('/api/rules', (req, res) => {
    const { limit, window } = req.body;
    if (limit && window) {
        activeRules.global.limit = parseInt(limit);
        activeRules.global.window = parseInt(window);
        console.log(`🔄 Rule Updated: ${limit} req / ${window} sec`);
        res.json({ success: true, message: 'Rule updated', rule: activeRules.global });
    } else {
        res.status(400).json({ success: false, message: 'Missing limit or window' });
    }
});

// 3. Protected Endpoint (Rate Limited)
// Dynamic Limit: Reads from activeRules
app.use('/api', async (req, res, next) => {
    // GeoIP Tracking
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let country = geo ? geo.country : 'Unknown';

    // DEMO: Randomize country for localhost to show off the map
    if (ip === '::1' || ip === '127.0.0.1' || !geo) {
        const demoCountries = ['US', 'DE', 'IN', 'GB', 'FR', 'BR', 'CA', 'AU', 'JP'];
        country = demoCountries[Math.floor(Math.random() * demoCountries.length)];
    }

    // Increment Geo Stats
    if (!metrics.geo[country]) metrics.geo[country] = 0;
    metrics.geo[country]++;

    // Metric Tracking Middleware
    const originalEnd = res.end;
    res.end = function (...args) {
        if (res.statusCode === 429) {
            metrics.blocked++;
        } else if (res.statusCode < 400) {
            metrics.allowed++;
        }
        metrics.total++;
        originalEnd.apply(res, args);
    };

    // Use Dynamic Rules via Function Callbacks
    await rateLimiter('global',
        () => activeRules.global.window,
        () => activeRules.global.limit
    )(req, res, next);
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'Request Successful!',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/test', (req, res) => {
    res.json({
        message: 'POST Request Successful!',
        data: req.body
    });
});

const fs = require('fs');
const https = require('https');

// Load SSL Certificates (Optional)
let httpsOptions = null;
try {
    if (fs.existsSync('server.key') && fs.existsSync('server.cert')) {
        httpsOptions = {
            key: fs.readFileSync('server.key', 'utf8'),
            cert: fs.readFileSync('server.cert', 'utf8')
        };
        console.log('🔒 SSL Certificates loaded.');
    } else {
        console.log('⚠️  SSL Certificates not found. Falling back to HTTP.');
    }
} catch (e) {
    console.error("❌ Error reading SSL certs:", e.message);
}

let server;
let protocol = 'http';

if (httpsOptions) {
    server = https.createServer(httpsOptions, app);
    protocol = 'https';
} else {
    // Fallback to HTTP
    const http = require('http');
    server = http.createServer(app);
}

server.listen(PORT, '0.0.0.0', () => {
    // Get local IP for display
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
            }
        }
    }

    console.log(`🚀 LimitGuard Server running on ${protocol}://localhost:${PORT}`);
    console.log(`📡 Accessible on Network via ${protocol}://${localIp}:${PORT}`);
    console.log(`🛡️  Global Rate Limit: 10 req / 60 sec`);
});
