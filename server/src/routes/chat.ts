import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { chatWithAgent, getChats, getChatDetails, submitFeedback, clearChat, regenerateResponse, getSuggestions } from '../controllers/chat.js';

const router = Router();

router.use(requireAuth as any);

router.post('/', chatWithAgent as any);
router.get('/', getChats as any);
router.get('/:id', getChatDetails as any);
router.post('/message/:id/feedback', submitFeedback as any);

// New chat endpoints (Wave 2)
router.delete('/:id/clear', clearChat as any);
router.post('/:id/regenerate', regenerateResponse as any);
router.get('/:id/suggestions', getSuggestions as any);

export default router;

