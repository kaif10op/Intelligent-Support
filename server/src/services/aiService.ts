import { prisma } from '../prisma.js';
import { generateEmbeddings } from '../utils/jina.js';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';
import { DynamicTool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
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
                  assignedTo: { select: { id: true, name: true, email: true, role: true } },
                  notes: { orderBy: { createdAt: 'desc' }, take: 5 }
                },
                orderBy: { updatedAt: 'desc' }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 12
              }
            }
          })
        : Promise.resolve(null),
      prisma.ticket.findMany({
        where: { userId: currentUserId },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          notes: { orderBy: { createdAt: 'desc' }, take: 3 }
        }
      }),
      prisma.chat.findMany({
        where: { userId: currentUserId },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        include: {
          kb: { select: { id: true, title: true } },
          assignedAgent: { select: { id: true, name: true, email: true, role: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 4 }
        }
      }),
      kbId
        ? prisma.knowledgeBase.findFirst({
            where: { id: kbId },
            include: {
              documents: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, filename: true, type: true, createdAt: true }
              }
            }
          })
        : Promise.resolve(null),
      kbId
        ? prisma.document.findMany({
            where: { kbId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, filename: true, type: true, createdAt: true }
          })
        : Promise.resolve([])
    ]);

    const activeTickets = userTickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes((ticket as any).status));
    const resolvedTickets = userTickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes((ticket as any).status));

    const currentTranscript = chat
      ? (chat.messages || [])
          .slice()
          .reverse()
          .map((m: any) => `[${AIService.formatTimestamp(m.createdAt)}] ${m.senderName || m.role}: ${AIService.clip(m.content, 360)}`)
          .join('\n')
      : '';

    const activeTicketSummary = activeTickets
      .map((ticket: any) => {
        const latestNote = ticket.notes?.[0];
        return `- [${AIService.formatTimestamp(ticket.updatedAt)}] ${ticket.title} (${ticket.status}/${ticket.priority})${ticket.assignedTo?.name ? ` assigned to ${ticket.assignedTo.name}` : ''}${latestNote?.content ? ` | latest note: ${AIService.clip(latestNote.content, 180)}` : ''}`;
      })
      .join('\n');

    const historicalResolvedSummary = resolvedTickets
      .slice(0, 6)
      .map((ticket: any) => {
        const latestNote = ticket.notes?.[0];
        return `- [${AIService.formatTimestamp(ticket.updatedAt)}] ${ticket.title} (${ticket.status})${latestNote?.content ? ` | closed with: ${AIService.clip(latestNote.content, 180)}` : ''}`;
      })
      .join('\n');

    const recentChatSummary = recentChats
      .map((c: any) => {
        const lastMessage = c.messages?.[0];
        return `- [${AIService.formatTimestamp(c.updatedAt)}] ${c.kb?.title || 'No KB'} | ${c.messages?.length || 0} recent messages${c.assignedAgent?.name ? ` | agent: ${c.assignedAgent.name}` : ''}${lastMessage?.content ? ` | latest: ${AIService.clip(lastMessage.content, 160)}` : ''}`;
      })
      .join('\n');

    const kbSummary = kb
      ? `KB: ${kb.title}${kb.description ? ` — ${AIService.clip(kb.description, 220)}` : ''}\nRecent documents:\n${kbDocs.map((doc: any) => `- [${AIService.formatTimestamp(doc.createdAt)}] ${doc.filename} (${doc.type})`).join('\n') || '- none'}`
      : 'KB: unavailable';

    return {
      summary: [
        `Current timestamp: ${now}`,
        `Current user message: ${message}`,
        chat ? `Current chat: ${chat.id}${chat.assignedAgent?.name ? ` | assigned agent: ${chat.assignedAgent.name}` : ''}` : 'Current chat: not yet created',
        currentTranscript ? `Latest chat transcript:\n${currentTranscript}` : 'Latest chat transcript: none',
        activeTicketSummary ? `Active tickets for this user:\n${activeTicketSummary}` : 'Active tickets for this user: none',
        historicalResolvedSummary ? `Historical resolved tickets (do not treat as current unless the latest timestamped evidence matches):\n${historicalResolvedSummary}` : 'Historical resolved tickets: none',
        recentChatSummary ? `Recent chats:\n${recentChatSummary}` : 'Recent chats: none',
        kbSummary,
        'Instruction: prefer the latest unresolved context, not stale solved answers. If older notes conflict with current messages, treat older notes as historical only and ask a clarifying question before assuming the issue is solved.'
      ].join('\n\n'),
      chat
    };
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

      // 1. Tool Definitions
      const tools: any[] = [];
      
      // Only add KB search tool if we have a KB
      if (kbMode && kbId) {
        const kbSearchTool = new DynamicTool({
          name: 'search_knowledge_base',
          description: 'Searches the user documents for info.',
          func: async (query: string) => {
            const queryEmbeddings = await generateEmbeddings([query]);
            if (!queryEmbeddings || !queryEmbeddings[0]) return 'Failed to generate search embeddings.';
            const qVec = queryEmbeddings[0];

            // Use PostgreSQL vector similarity search (<=> is cosine distance)
            const topChunks: any[] = await prisma.$queryRaw`
              SELECT 
                dc.content, 
                d.filename,
                1 - (dc.embedding::vector <=> ${qVec}::vector) as similarity
              FROM "DocumentChunk" dc
              JOIN "Document" d ON dc."docId" = d.id
              WHERE d."kbId" = ${kbId}
              ORDER BY dc.embedding::vector <=> ${qVec}::vector
              LIMIT 5
            `;

            if (topChunks.length === 0) return 'No relevant info found.';
            return topChunks.map(c => `File: ${c.filename}\nContent: ${c.content}`).join('\n\n');
          }
        });
        tools.push(kbSearchTool);
      }

      // Add web search if available
      if (process.env.TAVILY_API_KEY) {
        tools.push(new DynamicTool({
          name: 'web_search',
          description: 'Searches the internet.',
          func: async (query: string) => {
            const search = new TavilySearch({ maxResults: 3 });
            // @ts-ignore
            return await search.invoke(query);
          }
        }));
      }

      const richContext = await AIService.buildSupportContext(session, message, kbId || '', chatId);
      const agentModifier = kbMode 
        ? `You are a professional customer support agent. Be concise, helpful, and context-aware. Use the search_knowledge_base tool to find relevant information from our documentation. Do not repeat historical resolved answers unless the latest timestamped evidence matches.`
        : `You are a helpful AI customer support assistant. While you don't have access to specific documentation, provide general helpful guidance and suggest contacting a human support agent for detailed questions. Be friendly, professional, concise, and avoid assuming an issue is solved just because older history mentions a similar fix.`;

      // 2. Execute Agent with Streaming
      const provider = this.llmInstances[0]; 
      if (!provider) throw new Error('No LLM providers configured');

      const agent = createReactAgent({
        llm: provider as any,
        tools,
        messageModifier: agentModifier
      });

      // Load context memory
      let messageHistory: any[] = [];
      if (chatId) {
        const previousMessages = await prisma.message.findMany({
          where: { chatId },
          orderBy: { createdAt: 'asc' },
          take: 10
        });
        messageHistory = previousMessages.map(msg => 
          msg.role === 'user'
            ? new HumanMessage(`[${AIService.formatTimestamp(msg.createdAt)}] ${msg.content}`)
            : msg.role === 'system'
              ? new SystemMessage(`[${AIService.formatTimestamp(msg.createdAt)}] ${msg.content}`)
              : new AIMessage(`[${AIService.formatTimestamp(msg.createdAt)}] ${msg.content}`)
        );
      }
      messageHistory.unshift(new SystemMessage(richContext.summary));
      messageHistory.push(new HumanMessage(`[${new Date().toISOString()}] ${message}`));

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

      // Stream responses
      let fullAnswer = '';
      const stream = await agent.stream(
        { messages: messageHistory },
        { streamMode: 'messages' }
      );

      for await (const [message, metadata] of stream) {
        // Robust check for AI message content
        const isAI = message instanceof AIMessage || (message as any)._getType?.() === 'ai';
        const hasContent = typeof message.content === 'string' && message.content.length > 0;
        
        if (isAI && hasContent) {
          const content = message.content as string;
          fullAnswer += content;
          onToken(content, currentChatId);
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
