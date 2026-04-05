import 'dotenv/config';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { initRedis } from './utils/cache.js';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createHTTPServer } from 'http';
import { initializeSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import chatRoutes from './routes/chat.js';
import chatHumanRoutes from './routes/chatHuman.js';
import adminRoutes from './routes/admin.js';
import ticketRoutes from './routes/ticket.js';
import searchRoutes from './routes/search.js';
import adminChatRoutes from './routes/adminChat.js';
import emailChannelRoutes from './routes/emailChannel.js';
import abTestRoutes from './routes/abTest.js';
import voiceRoutes from './routes/voice.js';
import pluginRoutes from './routes/plugins.js';
import webhookRoutes from './routes/webhooks.js';
import { TicketAssignmentService } from './services/ticketAssignmentService.js';

const app = express();

// Add fallback routes BEFORE trying to initialize complex stuff
// This ensures server responds even if initialization fails
app.get('/ping', (req: Request, res: Response) => res.send('pong'));
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'initializing', message: 'Server is starting...' });
});

async function startServer() {
  try {
    logger.info('Starting server initialization...');

    // Initialize Redis cache
    await initRedis();
    logger.info('Redis cache initialized (or disabled)');

    // Create HTTP server to attach Socket.io
    const httpServer = createHTTPServer(app);

    // Initialize Socket.io
    const io = initializeSocket(httpServer);
    logger.info('Socket.io initialized');

    // Middleware
    const corsOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

    app.use(cors({
      origin: corsOrigins,
      credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Performance monitoring middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 500) {
          logger.warn(`Slow Request: ${req.method} ${req.originalUrl}`, { duration: `${duration}ms` });
        }
      });
      next();
    });

    // Store io instance in app for use in controllers
    app.set('io', io);

    logger.info('Core middleware initialized');

    app.get('/ping', (req: Request, res: Response) => res.send('pong'));

    // Health check route
    app.get('/healthz', async (req: Request, res: Response) => {
      try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'healthy', database: 'connected', timestamp: new Date() });
      } catch (err: any) {
        logger.error('Health Check Failed', { error: err.message });
        res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: err.message });
      }
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/kb', kbRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/chat/human', chatHumanRoutes); // Human-in-loop chat endpoints
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin-chat', adminChatRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/email-channel', emailChannelRoutes);
    app.use('/api/ab-tests', abTestRoutes);
    app.use('/api/voice', voiceRoutes);
    app.use('/api/plugins', pluginRoutes);
    app.use('/api/webhooks', webhookRoutes);

    logger.info('All routes registered');

    // Automated ticket assignment/reassignment optimizer loop
    const runAssignmentCycle = async () => {
      try {
        const [autoAssign, rebalance, slow, inactive] = await Promise.all([
          TicketAssignmentService.autoAssignUnassignedTickets(),
          TicketAssignmentService.rebalanceTickets(),
          TicketAssignmentService.reassignSlowTickets(),
          TicketAssignmentService.reassignInactiveAgentsTickets()
        ]);

        logger.info('Ticket optimization cycle completed', {
          autoAssigned: autoAssign.assigned,
          autoAssignErrors: autoAssign.errors,
          rebalanced: rebalance.length,
          slowReassigned: slow.length,
          inactiveReassigned: inactive.length
        });
      } catch (cycleError: any) {
        logger.error('Ticket optimization cycle failed', { error: cycleError.message });
      }
    };

    setInterval(runAssignmentCycle, 5 * 60 * 1000);
    runAssignmentCycle().catch(err => logger.error('Initial optimization cycle failed', { error: err.message }));

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
    });

    // Global error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error('Request error', { error: err.message || err, stack: err.stack });
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
