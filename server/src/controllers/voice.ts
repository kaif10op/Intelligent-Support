import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import axios from 'axios';
import { logger } from '../utils/logger.js';

const voiceAudioStore = new Map<string, { buffer: Buffer; contentType: string; createdAt: number }>();

const cleanupVoiceAudioStore = () => {
  const now = Date.now();
  const ttlMs = 30 * 60 * 1000; // 30 minutes
  for (const [id, item] of voiceAudioStore.entries()) {
    if (now - item.createdAt > ttlMs) {
      voiceAudioStore.delete(id);
    }
  }
};

const mapToAssemblyLanguage = (language: string) => {
  const normalized = (language || 'en').toLowerCase();
  const mapping: Record<string, string> = {
    en: 'en',
    es: 'es',
    fr: 'fr',
    de: 'de',
    it: 'it',
    pt: 'pt',
    hi: 'hi',
    ja: 'ja'
  };
  return mapping[normalized] || 'en';
};

const transcribeWithAssemblyAI = async (audioBuffer: Buffer, language: string) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is not configured');
  }

  const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', audioBuffer, {
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream'
    },
    maxBodyLength: Infinity
  });

  const audioUrl = uploadRes.data?.upload_url;
  if (!audioUrl) {
    throw new Error('AssemblyAI upload failed');
  }

  const transcriptRes = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    {
      audio_url: audioUrl,
      language_code: mapToAssemblyLanguage(language),
      punctuate: true,
      format_text: true
    },
    {
      headers: { authorization: apiKey }
    }
  );

  const transcriptId = transcriptRes.data?.id;
  if (!transcriptId) {
    throw new Error('AssemblyAI transcript creation failed');
  }

  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const pollRes = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { authorization: apiKey }
    });

    const status = pollRes.data?.status;
    if (status === 'completed') {
      return {
        text: pollRes.data?.text || '',
        confidence: Number(pollRes.data?.confidence ?? 0.85)
      };
    }
    if (status === 'error') {
      throw new Error(pollRes.data?.error || 'AssemblyAI transcription failed');
    }
  }

  throw new Error('AssemblyAI transcription timed out');
};

const synthesizeWithOpenAI = async (text: string, voice: 'male' | 'female') => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const openAIVoice = voice === 'male' ? 'alloy' : 'shimmer';
  const response = await axios.post(
    'https://api.openai.com/v1/audio/speech',
    {
      model: 'gpt-4o-mini-tts',
      voice: openAIVoice,
      input: text,
      format: 'mp3'
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );

  return Buffer.from(response.data);
};

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

    let transcribedText = '';
    let confidence = 0;
    try {
      const transcription = await transcribeWithAssemblyAI(audioBuffer, language);
      transcribedText = transcription.text;
      confidence = transcription.confidence;
    } catch (err: any) {
      logger.warn('Voice transcription provider unavailable', { error: err.message });
      return res.status(503).json({
        error: 'Voice transcription service unavailable',
        details: err.message
      });
    }

    res.json({
      success: true,
      transcription: transcribedText,
      language,
      duration_seconds: estimatedDurationSeconds,
      confidence,
      session_id: transcriptionLog.id,
      message: 'Audio transcribed successfully'
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

    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesizeWithOpenAI(text, voice);
    } catch (err: any) {
      logger.warn('Voice synthesis provider unavailable', { error: err.message });
      return res.status(503).json({
        error: 'Voice synthesis service unavailable',
        details: err.message
      });
    }

    cleanupVoiceAudioStore();
    voiceAudioStore.set(synthesisLog.id, {
      buffer: audioBuffer,
      contentType: 'audio/mpeg',
      createdAt: Date.now()
    });
    const estimatedDurationSeconds = text.length / 15;
    const audioUrl = `${req.protocol}://${req.get('host')}/api/voice/audio/${synthesisLog.id}`;

    res.json({
      success: true,
      message: 'Text synthesized successfully',
      session_id: synthesisLog.id,
      text,
      voice,
      language,
      estimated_duration_seconds: estimatedDurationSeconds,
      audio_url: audioUrl
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
    const sessionId = String(req.params.sessionId || '');

    const session = await prisma.auditLog.findUnique({
      where: { id: sessionId as string }
    });

    if (!session) {
      return res.status(404).json({ error: 'Audio session not found' });
    }

    const storedAudio = voiceAudioStore.get(sessionId);
    if (!storedAudio) {
      return res.status(404).json({ error: 'Audio buffer expired or unavailable' });
    }

    res.set({
      'Content-Type': storedAudio.contentType,
      'Content-Disposition': `inline; filename="audio-${sessionId}.mp3"`,
      'Cache-Control': 'no-store'
    });
    res.send(storedAudio.buffer);
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
