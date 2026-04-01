import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { chatWithAgent, getChats, getChatDetails, submitFeedback } from '../controllers/chat.js';

const router = Router();

router.use(requireAuth as any);

router.post('/', chatWithAgent as any);
router.get('/', getChats as any);
router.get('/:id', getChatDetails as any);
router.post('/message/:id/feedback', submitFeedback as any);


export default router;

