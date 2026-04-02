import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { globalSearch, summarizeChat, autoTagConversation } from '../controllers/search.js';

const router = Router();

router.use(requireAuth);

// Global search across chats, KBs, tickets
router.get('/', globalSearch);

// Chat summarization
router.post('/chat/:id/summarize', summarizeChat);

// Auto-tagging
router.post('/chat/:id/auto-tag', autoTagConversation);

export default router;
