import { prisma } from '../prisma.js';
import { generateEmbeddings } from '../utils/jina.js';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { logger } from '../utils/logger.js';

export interface ChatSession {
  userId: string;
  kbId: string;
  chatId?: string;
  onToken: (token: string, chatId: string) => void;
  onComplete: (fullAnswer: string, chatId: string) => void;
  onError: (error: any) => void;
}

export class AIService {
  private static llmInstances: any[] = AIService.createLLMInstances();

  private static formatTimestamp(value?: Date | string | null) {
    if (!value) return 'unknown-time';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? 'unknown-time' : date.toISOString();
  }

  private static clip(value: string, max = 600) {
    const compact = value.replace(/\s+/g, ' ').trim();
    return compact.length > max ? `${compact.slice(0, max)}…` : compact;
  }

  private static async buildSupportContext(session: ChatSession, message: string, kbId: string, currentChatId?: string) {
    const currentUserId = session.userId;
    const now = new Date().toISOString();
    const [chat, userTickets, recentChats, kb, kbDocs] = await Promise.all([
      currentChatId
        ? prisma.chat.findUnique({
            where: { id: currentChatId },
            include: {
              user: { select: { id: true, name: true, email: true } },
              assignedAgent: { select: { id: true, name: true, email: true, role: true } },
              tickets: {
                include: {
                  assignedTo: { select: { id: true, name: true, email: true, role: true } }
                },
                orderBy: { updatedAt: 'desc' },
                take: 1
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 4
              }
            }
          })
        : Promise.resolve(null),
      prisma.ticket.findMany({
        where: { userId: currentUserId },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } }
        }
      }),
      prisma.chat.findMany({
        where: { userId: currentUserId },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        include: {
          kb: { select: { id: true, title: true } },
          assignedAgent: { select: { id: true, name: true, email: true, role: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      kbId
        ? prisma.knowledgeBase.findFirst({
            where: { id: kbId },
            include: {
                documents: {
                  orderBy: { createdAt: 'desc' },
                  take: 3,
                  select: { id: true, filename: true, type: true, createdAt: true }
                }
              }
          })
        : Promise.resolve(null),
      kbId
        ? prisma.document.findMany({
            where: { kbId },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, filename: true, type: true, createdAt: true }
          })
        : Promise.resolve([])
    ]);

    const activeTickets = userTickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes((ticket as any).status));
    const resolvedTickets = userTickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes((ticket as any).status));

    const currentTranscript = chat
      ? (chat.messages || [])
          .slice(0, 4)
          .reverse()
          .map((m: any) => `[${AIService.formatTimestamp(m.createdAt)}] ${m.senderName || m.role}: ${AIService.clip(m.content, 120)}`)
          .join('\n')
      : '';

    const activeTicketSummary = activeTickets
      .map((ticket: any) => {
        return `- [${AIService.formatTimestamp(ticket.updatedAt)}] ${ticket.title} (${ticket.status}/${ticket.priority})${ticket.assignedTo?.name ? ` assigned to ${ticket.assignedTo.name}` : ''}`;
      })
      .join('\n');

    const historicalResolvedSummary = resolvedTickets
      .slice(0, 2)
      .map((ticket: any) => {
        return `- [${AIService.formatTimestamp(ticket.updatedAt)}] ${ticket.title} (${ticket.status})`;
      })
      .join('\n');

    const recentChatSummary = recentChats
      .map((c: any) => {
        const lastMessage = c.messages?.[0];
        return `- [${AIService.formatTimestamp(c.updatedAt)}] ${c.kb?.title || 'No KB'}${c.assignedAgent?.name ? ` | agent: ${c.assignedAgent.name}` : ''}${lastMessage?.content ? ` | latest: ${AIService.clip(lastMessage.content, 60)}` : ''}`;
      })
      .join('\n');

    const kbSummary = kb
        ? `KB: ${kb.title}${kb.description ? ` — ${AIService.clip(kb.description, 90)}` : ''}\nDocs: ${kbDocs.map((doc: any) => doc.filename).join(', ') || 'none'}`
      : 'KB: unavailable';

    return {
      summary: [
        `Current timestamp: ${now}`,
        `Current user message: ${message}`,
        chat ? `Current chat: ${chat.id}${chat.assignedAgent?.name ? ` | assigned agent: ${chat.assignedAgent.name}` : ''}` : 'Current chat: not yet created',
        currentTranscript ? `Latest chat transcript:\n${currentTranscript}` : 'Latest chat transcript: none',
        activeTicketSummary ? `Active tickets:\n${activeTicketSummary}` : 'Active tickets: none',
        historicalResolvedSummary ? `Recent resolved tickets:\n${historicalResolvedSummary}` : 'Recent resolved tickets: none',
        recentChatSummary ? `Recent chats:\n${recentChatSummary}` : 'Recent chats: none',
        kbSummary,
        'Instruction: answer from the latest unresolved context. Treat older items as historical unless the current thread confirms them.'
      ].join('\n\n'),
      chat
    };
  }

  private static async buildKnowledgeContext(kbId: string, message: string) {
    if (!kbId) return '';

    const queryEmbeddings = await generateEmbeddings([message]);
    const queryVector = queryEmbeddings?.[0];
    if (!queryVector) return '';

    const topChunks: any[] = await prisma.$queryRaw`
      SELECT
        dc.content,
        d.filename,
        1 - (dc.embedding::vector <=> ${queryVector}::vector) as similarity
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."docId" = d.id
      WHERE d."kbId" = ${kbId}
      ORDER BY dc.embedding::vector <=> ${queryVector}::vector
      LIMIT 2
    `;

    if (!topChunks.length) return '';

    return topChunks
      .map((chunk: any) => `- ${chunk.filename}: ${AIService.clip(chunk.content, 220)}`)
      .join('\n');
  }

  private static extractChunkText(chunk: any) {
    const content = chunk?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part === 'string' ? part : part?.text || ''))
        .join('');
    }
    return '';
  }

  private static createLLMInstances() {
    const instances: any[] = [];
    try {
      if (process.env.GROQ_API_KEY) {
        instances.push(new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: 'llama-3.1-8b-instant',
          temperature: 0,
        }));
      }
      if (process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENAI_API_KEY) {
        instances.push(new ChatGoogleGenerativeAI({
          apiKey: (process.env.GOOGLE_AI_KEY || process.env.GOOGLE_GENAI_API_KEY)!,
          model: 'gemini-1.5-flash',
          temperature: 0,
        }));
      }
      // Add other providers if needed...
    } catch (error) {
      logger.error('Error initializing LLM instances:', error);
    }
    return instances;
  }

  static async processMessage(message: string, session: ChatSession) {
    const { userId, chatId, onToken, onComplete, onError } = session;
    let { kbId } = session;
    let kbMode = true; // Whether to use KB search tool

    try {
      // If kbId is missing or empty, try to find a default KB
      if (!kbId || kbId.trim() === '') {
        // Try to find user's own KB first
        let defaultKb = await prisma.knowledgeBase.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' }
        });

        // If user has no KB, find any available KB (fallback to admin/system KB)
        if (!defaultKb) {
          defaultKb = await prisma.knowledgeBase.findFirst({
            orderBy: { createdAt: 'asc' } // Use the first/oldest KB in system
          });
        }

        if (defaultKb) {
          kbId = defaultKb.id;
          logger.info('Auto-selected default KB', { kbId, userId, kbTitle: defaultKb.title });
        } else {
          // No KB available - operate in KB-free mode
          kbMode = false;
          logger.info('Operating in KB-free mode (no knowledge base available)', { userId });
        }
      }

      let kb = null;
      if (kbMode && kbId) {
        kb = await prisma.knowledgeBase.findFirst({
          where: { id: kbId }
        });
        if (!kb) {
          logger.warn('KB not found, switching to KB-free mode', { kbId });
          kbMode = false;
        }
      }

      const richContext = await AIService.buildSupportContext(session, message, kbId || '', chatId);
      const agentModifier = kbMode 
        ? `You are a professional customer support agent. Be concise, helpful, and context-aware. Do not repeat historical resolved answers unless the latest timestamped evidence matches.`
        : `You are a helpful AI customer support assistant. Provide general helpful guidance and suggest contacting a human support agent for detailed questions. Be friendly, professional, and concise.`;

      const provider = this.llmInstances[0]; 
      if (!provider) throw new Error('No LLM providers configured');

      // Save user message and create chat if needed
      let currentChatId = chatId;
      if (!currentChatId) {
        const chat = await prisma.chat.create({
          data: { 
            title: message.substring(0, 50), 
            userId, 
            kbId: kbId || (kb?.id || '') // Use kbId if available, or empty string
          }
        });
        currentChatId = chat.id;
      }
      await prisma.message.create({ data: { role: 'user', content: message, chatId: currentChatId } });

      const knowledgeContext = kbMode && kbId
        ? await AIService.buildKnowledgeContext(kbId, message).catch((error) => {
            logger.warn('Failed to build knowledge context', { error, userId, chatId: currentChatId, kbId });
            return '';
          })
        : '';

      const buildMessages = (includeContext: boolean) => {
        const systemPrompt = includeContext
          ? [
              agentModifier,
              `Support context: ${AIService.clip(richContext.summary, 650)}`,
              knowledgeContext ? `Relevant KB evidence:\n${knowledgeContext}` : 'Relevant KB evidence: none'
            ].join('\n\n')
          : agentModifier;

        return [
          new SystemMessage(systemPrompt),
          new HumanMessage(`[${new Date().toISOString()}] ${AIService.clip(message, 180)}`)
        ];
      };

      const runStream = async (includeContext: boolean) => {
        let fullAnswer = '';
        const stream = await provider.stream(buildMessages(includeContext) as any);

        for await (const chunk of stream as any) {
          const content = AIService.extractChunkText(chunk);
          if (!content) continue;
          fullAnswer += content;
          onToken(content, currentChatId);
        }

        return fullAnswer;
      };

      // Stream response with a compact context first, then a bare fallback only on 413.
      let fullAnswer = '';
      try {
        fullAnswer = await runStream(true);
      } catch (streamError: any) {
        const status = streamError?.status || streamError?.response?.status;
        const messageText = String(streamError?.message || '');
        if (status === 413 || messageText.includes('413') || messageText.toLowerCase().includes('payload too large')) {
          logger.warn('Retrying AI stream with bare prompt after 413', { userId, chatId: currentChatId, kbId });
          fullAnswer = await runStream(false);
        } else {
          throw streamError;
        }
      }

      // Save AI message
      await prisma.message.create({
        data: { role: 'ai', content: fullAnswer, chatId: currentChatId }
      });

      onComplete(fullAnswer, currentChatId);

    } catch (error) {
      logger.error('AIService Error', { error });
      onError(error);
    }
  }
}
