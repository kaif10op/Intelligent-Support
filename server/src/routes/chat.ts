import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { chatWithAgent, getChats, getRecentChats, getChatDetails, submitFeedback, clearChat, regenerateResponse, getSuggestions, exportChatsAsCSV } from '../controllers/chat.js';
import { addHumanMessage, generateAgentAssistance, transferChat, getChatTranscript, closeChat } from '../controllers/chatHuman.js';

const router = Router();

router.use(requireAuth as any);

router.post('/', chatWithAgent as any);
router.get('/recent', getRecentChats as any);
router.get('/', getChats as any);
router.get('/:id', getChatDetails as any);
router.post('/message/:id/feedback', submitFeedback as any);

// New chat endpoints (Wave 2)
router.delete('/:id/clear', clearChat as any);
router.post('/:id/regenerate', regenerateResponse as any);
router.get('/:id/suggestions', getSuggestions as any);

// Export endpoints (Wave 5)
router.get('/export/csv', exportChatsAsCSV as any);

// Human-in-loop chat endpoints
// Support agent/admin adds human message to chat
router.post('/:chatId/human-message', addHumanMessage as any);

// Support agent requests AI assistance
router.post('/:chatId/assistant/suggest', generateAgentAssistance as any);

// Transfer chat to another support agent
router.post('/:chatId/transfer/:targetAgentId', transferChat as any);

// Get chat transcript
router.get('/:chatId/transcript', getChatTranscript as any);

// Close chat
router.post('/:chatId/close', closeChat as any);

export default router;

