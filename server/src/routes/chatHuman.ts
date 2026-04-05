import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  addHumanMessage,
  generateAgentAssistance,
  requestHumanHandoff,
  takeOverChat,
  transferChat,
  getHumanHandoffStatus,
  getChatTranscript,
  closeChat
} from '../controllers/chatHuman.js';

const router = Router();

router.use(requireAuth as any);

/**
 * Human/Support Agent endpoints
 */

// Add human message to chat (support agent, admin, or chat owner)
router.post('/:chatId/message', addHumanMessage as any);

// Customer/user requests human handoff
router.post('/:chatId/request-handoff', requestHumanHandoff as any);

// Support/admin takes over a chat
router.post('/:chatId/takeover', takeOverChat as any);

// Get AI-suggested response for support agent
router.post('/:chatId/assistant/suggest', generateAgentAssistance as any);

// Transfer chat to another agent
router.post('/:chatId/transfer/:targetAgentId', transferChat as any);

// Get handoff/assignment status
router.get('/:chatId/status', getHumanHandoffStatus as any);

// Get chat transcript for documentation/review
router.get('/:chatId/transcript', getChatTranscript as any);

// Close chat and add summary
router.post('/:chatId/close', closeChat as any);

export default router;
