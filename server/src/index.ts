import 'dotenv/config';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { initRedis } from './utils/cache.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createHTTPServer } from 'http';
import { initializeSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import ticketRoutes from './routes/ticket.js';

const app = express();

async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');

    // Initialize Redis cache
    await initRedis();
    console.log('✅ Redis cache initialized (or disabled)');

    // Create HTTP server to attach Socket.io
    const httpServer = createHTTPServer(app);

    // Initialize Socket.io
    const io = initializeSocket(httpServer);
    console.log('✅ Socket.io initialized');

    // Middleware
    app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Store io instance in app for use in controllers
    app.set('io', io);

    console.log('✅ Core middleware initialized');

    // Test route
    app.get('/ping', (req, res) => res.send('pong'));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/kb', kbRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/tickets', ticketRoutes);

    console.log('✅ All routes registered');

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
    });

    // Global error handler (simplified)
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Error:', err.message || err);
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        statusCode,
      });
    });

    httpServer.listen(config.PORT, () => {
      logger.info(`✅ Server started successfully`, {
        port: config.PORT,
        environment: config.NODE_ENV,
        corsOrigin: config.CORS_ORIGIN,
        websocket: 'enabled'
      });
    });
  } catch (err: any) {
    logger.error('❌ Server startup failed', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

startServer();

