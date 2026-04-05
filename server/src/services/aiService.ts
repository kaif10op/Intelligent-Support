import { prisma } from '../prisma.js';
import { generateEmbeddings } from '../utils/jina.js';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';
import { DynamicTool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
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

      const agentModifier = kbMode 
        ? `You are a professional customer support agent. Be concise and helpful. Use the search_knowledge_base tool to find relevant information from our documentation.`
        : `You are a helpful AI customer support assistant. While you don't have access to specific documentation, provide general helpful guidance and suggest contacting a human support agent for detailed questions. Be friendly, professional, and concise.`;

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
          msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );
      }
      messageHistory.push(new HumanMessage(message));

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
