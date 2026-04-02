import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  transcribeAudio,
  synthesizeText,
  getAudioStream,
  updateVoiceSettings,
  getVoiceStats
} from '../controllers/voice.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth as any);

// Speech-to-text endpoint
router.post('/transcribe', upload.single('audio'), transcribeAudio as any);

// Text-to-speech endpoint
router.post('/synthesize', synthesizeText as any);

// Get audio stream
router.get('/audio/:sessionId', getAudioStream as any);

// Voice settings for a chat
router.put('/chat/:chatId/settings', updateVoiceSettings as any);

// Admin statistics
router.get('/stats', requireAdmin as any, getVoiceStats as any);

export default router;
