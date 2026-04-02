import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Voice I/O Features
 * - Speech-to-text: Convert audio to text
 * - Text-to-speech: Convert text to audio
 */

/**
 * Process speech-to-text from audio buffer
 * POST /api/voice/transcribe
 * Body: FormData with 'audio' file and optional 'language'
 */
export const transcribeAudio = async (req: AuthRequest, res: Response) => {
  try {
    const file = (req.files as any)?.[0] || (req as any).file;
    const { language = 'en' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // In production, integrate with AssemblyAI or Google Cloud Speech-to-Text
    // For now, return a placeholder that would be replaced with actual transcription
    const audioBuffer = file.buffer || Buffer.from(file);

    // Estimate text length from audio duration
    // Audio file size → approximate duration → estimated transcription
    const estimatedDurationSeconds = Math.ceil(audioBuffer.length / 16000);

    // Store transcription log for audit trail
    const transcriptionLog = await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'voice_transcription',
        resourceType: 'voice_session',
        description: `Audio transcribed (${estimatedDurationSeconds}s, ${language})`,
        changes: {
          duration_seconds: estimatedDurationSeconds,
          language,
          file_size: audioBuffer.length,
          timestamp: new Date().toISOString()
        } as any
      }
    });

    // Placeholder transcription result
    // In production: send to Speech-to-Text API
    const placeholderTranscriptions = [
      "I need help with my account",
      "Can I create a support ticket?",
      "What's the status of my previous ticket?",
      "I want to search the knowledge base"
    ];

    const transcribedText =
      placeholderTranscriptions[Math.floor(Math.random() * placeholderTranscriptions.length)];

    res.json({
      success: true,
      transcription: transcribedText,
      language,
      duration_seconds: estimatedDurationSeconds,
      confidence: 0.95, // Placeholder confidence score
      session_id: transcriptionLog.id,
      message: 'Audio transcribed successfully (demo mode - integrate with Speech-to-Text API)'
    });
  } catch (error: any) {
    logger.error('Transcribe Audio Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
};

/**
 * Synthesize text to speech audio
 * POST /api/voice/synthesize
 * Body: { text, voice: 'male'|'female', language: 'en'|'es'|'fr'|'de' }
 */
export const synthesizeText = async (req: AuthRequest, res: Response) => {
  try {
    const { text, voice = 'female', language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
    }

    // Store synthesis log for audit trail
    const synthesisLog = await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'voice_synthesis',
        resourceType: 'voice_session',
        description: `Text synthesized to speech (${text.length} chars, ${voice}, ${language})`,
        changes: {
          text_length: text.length,
          voice,
          language,
          timestamp: new Date().toISOString()
        } as any
      }
    });

    // In production, integrate with Google Text-to-Speech, Azure Speech, or similar
    // For now, return metadata about what would be synthesized
    const estimatedDurationSeconds = text.length / 15; // Rough estimate: ~15 chars per second

    res.json({
      success: true,
      message: 'Text scheduled for synthesis (demo mode - integrate with Text-to-Speech API)',
      session_id: synthesisLog.id,
      text,
      voice,
      language,
      estimated_duration_seconds: estimatedDurationSeconds,
      audio_url: `/api/voice/audio/${synthesisLog.id}`,
      note: 'In production, audio would be returned as MP3/WAV stream'
    });
  } catch (error: any) {
    logger.error('Synthesize Text Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to synthesize text' });
  }
};

/**
 * Get audio stream for a synthesis session
 * GET /api/voice/audio/:sessionId
 */
export const getAudioStream = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.auditLog.findUnique({
      where: { id: sessionId as string }
    });

    if (!session) {
      return res.status(404).json({ error: 'Audio session not found' });
    }

    // Return demo audio placeholder
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `inline; filename="audio-${sessionId}.mp3"`
    });

    res.json({
      message: 'Audio stream would be returned here',
      session_id: sessionId,
      format: 'mp3',
      note: 'Demo mode - actual audio synthesis needed'
    });
  } catch (error: any) {
    logger.error('Get Audio Stream Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve audio' });
  }
};

/**
 * Enable/disable voice for a chat
 * PUT /api/voice/chat/:chatId/settings
 */
export const updateVoiceSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { stt_enabled, tts_enabled, language, voice } = req.body;

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId as string, userId: req.user!.id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Store voice settings as audit log
    const settingsLog = await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'voice_settings_updated',
        resourceType: 'voice_chat',
        resourceId: chatId as string,
        description: `Voice settings updated for chat ${chatId}`,
        changes: {
          stt_enabled: stt_enabled ?? true,
          tts_enabled: tts_enabled ?? true,
          language: language || 'en',
          voice: voice || 'female'
        } as any
      }
    });

    res.json({
      success: true,
      message: 'Voice settings updated',
      chat_id: chatId,
      settings: {
        stt_enabled: stt_enabled ?? true,
        tts_enabled: tts_enabled ?? true,
        language: language || 'en',
        voice: voice || 'female'
      }
    });
  } catch (error: any) {
    logger.error('Update Voice Settings Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update voice settings' });
  }
};

/**
 * Get voice usage statistics
 * GET /api/voice/stats
 */
export const getVoiceStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get voice activity stats
    const transcriptions = await prisma.auditLog.count({
      where: {
        action: 'voice_transcription',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const syntheses = await prisma.auditLog.count({
      where: {
        action: 'voice_synthesis',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const voiceChats = await prisma.auditLog.count({
      where: {
        action: 'voice_settings_updated',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    res.json({
      period: '30_days',
      stats: {
        total_transcriptions: transcriptions,
        total_syntheses: syntheses,
        voice_chats_enabled: voiceChats,
        total_voice_interactions: transcriptions + syntheses
      },
      daily_average: {
        transcriptions: (transcriptions / 30).toFixed(1),
        syntheses: (syntheses / 30).toFixed(1)
      }
    });
  } catch (error: any) {
    logger.error('Get Voice Stats Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch voice statistics' });
  }
};
