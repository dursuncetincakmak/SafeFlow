import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import apiRouter from './routes/api';
import { initDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend web application integration
app.use(cors({
  origin: '*', // Allow connections from Vite Dev Server or IIS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Code', 'x-company-code']
}));

// Increase body limit to support base64 custom company logo uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount main REST API router
app.use('/api', apiRouter);

// Backend Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'V-PASS Backend API Server'
  });
});

// Initialize dynamic database connection pool and start the Express server
async function startServer() {
  console.log('[Server Startup] Starting V-PASS Backend Server...');
  
  // Connect to the configured database engine (PostgreSQL, MySQL, MSSQL, MongoDB, or Fallback File DB)
  const dbStatus = await initDatabase();
  console.log(`[Server Startup] Database Status: ${dbStatus.message}`);

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 V-PASS Backend API Sunucusu başarıyla başlatıldı!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('[Server Startup] Core failure during boot sequence:', err);
  process.exit(1);
});
