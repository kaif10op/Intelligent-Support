import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  receiveEmailTicket,
  sendEmailReply,
  getEmailTickets,
  getEmailChannelStats
} from '../controllers/emailChannel.js';

const router = Router();

// Email webhook endpoint (public - no auth required for receiving emails)
// In production, verify webhook signature from email service
router.post('/receive', receiveEmailTicket as any);

// Authenticated endpoints
router.use(requireAuth as any);

router.post('/reply/:ticketId', sendEmailReply as any);
router.get('/tickets', getEmailTickets as any);
router.get('/stats', requireAdmin as any, getEmailChannelStats as any);

export default router;
