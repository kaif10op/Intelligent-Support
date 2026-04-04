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
    const { userId, kbId, chatId, onToken, onComplete, onError } = session;

    try {
      const kb = await prisma.knowledgeBase.findFirst({
        where: { id: kbId, userId }
      });
      if (!kb) throw new Error('Unauthorized or missing KB');

      // 1. Tool Definitions (Simplified for the service)
      const kbSearchTool = new DynamicTool({
        name: 'search_knowledge_base',
        description: 'Searches the user documents for info.',
        func: async (query: string) => {
          const queryEmbeddings = await generateEmbeddings([query]);
          if (!queryEmbeddings || !queryEmbeddings[0]) return 'Failed to generate search embeddings.';
          const qVec = queryEmbeddings[0];

          const allChunks = await prisma.documentChunk.findMany({
            where: { document: { kbId } },
            include: { document: { select: { filename: true } } }
          });

          const cosineSimilarity = (vecA: number[], vecB: number[]) => {
            let dotProduct = 0, normA = 0, normB = 0;
            for (let i = 0; i < vecA.length; i++) {
              dotProduct += (vecA[i] || 0) * (vecB[i] || 0);
              normA += (vecA[i] || 0) ** 2;
              normB += (vecB[i] || 0) ** 2;
            }
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          };

          const scoredChunks = allChunks.map(chunk => ({
            content: chunk.content,
            filename: chunk.document.filename,
            similarity: cosineSimilarity(qVec, chunk.embedding as number[])
          }));

          const topChunks = scoredChunks.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
          if (topChunks.length === 0) return 'No relevant info found.';
          return topChunks.map(c => `File: ${c.filename}\nContent: ${c.content}`).join('\n\n');
        }
      });

      const tools = [kbSearchTool];
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

      const agentModifier = `You are a professional customer support agent. Be concise and helpful.`;

      // 2. Execute Agent
      const provider = this.llmInstances[0]; // Simplification for the example
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

      const result = await agent.invoke({ messages: messageHistory });
      const lastMsg = result.messages[result.messages.length - 1];
      const fullAnswer = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);

      // Save user message
      let currentChatId = chatId;
      if (!currentChatId) {
        const chat = await prisma.chat.create({
          data: { title: message.substring(0, 50), userId, kbId }
        });
        currentChatId = chat.id;
      }
      await prisma.message.create({ data: { role: 'user', content: message, chatId: currentChatId } });

      // Stream to client
      const tokens = fullAnswer.split(' ');
      for (const token of tokens) {
        onToken(token + ' ', currentChatId);
        await new Promise(r => setTimeout(r, 20)); // Subtle delay for streaming effect
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
