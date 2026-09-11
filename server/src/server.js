import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDatabase, seedDatabase, getActiveEngine } from './db.js';
import authRouter from './routes/auth.js';
import placesRouter from './routes/places.js';
import eventsRouter from './routes/events.js';
import uploadRouter from './routes/upload.js';
import aiRouter from './routes/ai.js';
import weatherRouter from './routes/weather.js';
import transitRouter from './routes/transit.js';
import backupRouter from './routes/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 1. Middlewares
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 2. Static uploads directory with caching and video streaming support
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webp') || filePath.endsWith('.png') || filePath.endsWith('.jpg')) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// 3. API Routes
app.use('/api/auth', authRouter);
app.use('/api/places', placesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/transit', transitRouter);
app.use('/api/backup', backupRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);
app.use('/api/weather', weatherRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TuriArica API Server',
    databaseEngine: getActiveEngine(),
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// 4. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor.'
  });
});

// 5. Initialize DB & Start Server
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'turiarica2026';

async function startServer() {
  try {
    await initDatabase();
    await seedDatabase(adminUser, adminPass);
  } catch (e) {
    console.error('[DB STARTUP ERROR]', e);
  }

  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 TuriArica Backend Server activo`);
    console.log(`🐬 Motor Base de Datos: ${getActiveEngine().toUpperCase()}`);
    console.log(`📡 URL API: http://localhost:${PORT}/api`);
    console.log(`📸 Subidas multimedia: http://localhost:${PORT}/uploads`);
    console.log(`🤖 Endpoints IA: http://localhost:${PORT}/api/ai/context`);
    console.log(`===========================================`);
  });
}

startServer();
