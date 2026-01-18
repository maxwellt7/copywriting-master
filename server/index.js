import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import copyRoutes from './routes/copy.js';
import metricsRoutes from './routes/metrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ULTRA-AGGRESSIVE CORS - Allow ALL origins for debugging
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || 'unknown';

  console.log(`🌐 ${req.method} ${req.url}`);
  console.log(`   Origin: ${origin}`);
  console.log(`   Headers:`, Object.keys(req.headers).join(', '));

  // Set CORS headers for EVERY request
  res.setHeader('Access-Control-Allow-Origin', origin === 'unknown' ? '*' : origin);
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Expose-Headers', '*');

  console.log(`✅ CORS headers set`);

  // Handle OPTIONS immediately
  if (req.method === 'OPTIONS') {
    console.log(`✅ OPTIONS request - responding with 200 OK`);
    return res.status(200).end();
  }

  next();
});

// CORS Configuration - Allow Vercel frontend and development
const corsOptions = {
  origin: (origin, callback) => {
    // Log the origin for debugging
    console.log('🔍 CORS request from origin:', origin);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://copywriting-master-vb5u.vercel.app',
      process.env.FRONTEND_URL
    ];

    // Remove null/undefined values
    const validOrigins = allowedOrigins.filter(o => o && o.trim());

    // Allow requests with no origin (server-to-server, mobile apps)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (validOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing whitelisted origin: ${origin}`);
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.log(`❌ CORS: Rejecting origin: ${origin}`);
    console.log('   Allowed origins:', validOrigins);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));
// Explicitly handle OPTIONS for all routes
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Copywriting Master API'
  });
});

// Test CORS endpoint - responds to ANY method
app.all('/test-cors', (req, res) => {
  console.log(`✅ /test-cors endpoint hit with ${req.method}`);
  res.json({
    method: req.method,
    headers: req.headers,
    origin: req.headers.origin,
    message: 'CORS test successful!'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/copy', copyRoutes);
app.use('/api/metrics', metricsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
// Bind to 0.0.0.0 to accept connections from outside Docker container
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Copywriting Master API Server              ║
║   Status: Running                             ║
║   Port: ${PORT.toString().padEnd(38)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
