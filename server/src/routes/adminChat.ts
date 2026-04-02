import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { takeoverChat, injectMessageIntoChat, flagChatForReview, getReviewQueue } from '../controllers/adminChat.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// Admin chat takeover - join an active chat
router.post('/chat/:chatId/takeover', takeoverChat);

// Inject message into chat
router.post('/chat/:chatId/inject-message', injectMessageIntoChat);

// Flag chat for manual review
router.post('/chat/:chatId/flag-review', flagChatForReview);

// Get review queue (low confidence, disliked, etc)
router.get('/chats/review-queue', getReviewQueue);

export default router;
