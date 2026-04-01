import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import kbRoutes from './routes/kb.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 8000;

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
