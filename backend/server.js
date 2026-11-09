const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { securityHeaders, rateLimit } = require('./middleware/security');

// Fail fast on missing critical config instead of issuing unsigned/invalid tokens.
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

// Route imports
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const providerRoutes = require('./routes/providers');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const serviceRoutes = require('./routes/services');

connectDB();

const app = express();

// Behind Nginx: trust the first proxy so req.ip is the real client IP (rate limiting, audit logs).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS: same-origin in production (SPA is served by this server). Allow explicit origins via CORS_ORIGIN.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

app.use(securityHeaders);
// Visit reports carry base64 documents; keep a ceiling but don't accept unbounded bodies.
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Determine dist path: backend/dist first, fallback to ../frontend/dist
let distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  distPath = path.join(__dirname, '../frontend/dist');
}

if (fs.existsSync(distPath)) {
  // Hashed assets are immutable; index.html and sw.js must always revalidate so deploys take effect.
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
}

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'धेरै प्रयास भयो। केही समयपछि फेरि प्रयास गर्नुहोस्।' // Too many attempts
});
// General API ceiling per IP.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: 'धेरै अनुरोध भयो। कृपया केही बेर पर्खनुहोस्।'
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);

// Health check — reports DB state so PM2/uptime monitors catch a dead database.
app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: 'घरको डाक्टर API चलिरहेको छ',
    db: dbUp ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Unknown API routes → JSON 404 (never the SPA HTML).
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// SPA Catch-All Route for Frontend Navigation
if (fs.existsSync(distPath)) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/uploads')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`🏥 घरको डाक्टर — GharkoDoctor API | port ${PORT} | ${process.env.NODE_ENV || 'development'}`);
});
