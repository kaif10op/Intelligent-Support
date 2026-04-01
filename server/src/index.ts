import 'dotenv/config';
console.log('--- GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import ticketRoutes from './routes/ticket.js';

const app = express();
const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    app.use(cors({
      origin: 'http://localhost:3000',
      credentials: true,
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Test route
    app.get('/ping', (req, res) => res.send('pong'));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/kb', kbRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/tickets', ticketRoutes);


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('--- Server Start FAILED:', {
      message: err.message,
      stack: err.stack,
      error: err
    });
    process.exit(1);
  }
}

startServer();
