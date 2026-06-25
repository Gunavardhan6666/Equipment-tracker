'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const { testConnection } = require('./config/db');
const notFound     = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// ─── App Initialization ───────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Logging Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Equipment Tracker API',
    institution: 'FilmDept University',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// Phase 5: auth + users (JWT not wired yet)
// app.use('/api/auth',  require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

// Phase 3: core resource routes (all active)
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/items',        require('./routes/items'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/kits',         require('./routes/kits'));

// ─── 404 & Error Handlers (must be last) ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Start ─────────────────────────────────────────────────────────────
const startServer = async () => {
  // Verify DB connectivity on startup (non-fatal in dev — server still starts)
  await testConnection();

  app.listen(PORT, () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log(`  │   🎬  Equipment Tracker API                 │`);
    console.log(`  │   🏫  FilmDept University                   │`);
    console.log(`  │   🚀  http://localhost:${PORT}                  │`);
    console.log(`  │   🌿  ENV: ${(process.env.NODE_ENV || 'development').padEnd(33)}│`);
    console.log('  └─────────────────────────────────────────────┘');
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});

module.exports = app; // exported for testing (Phase 5+)
