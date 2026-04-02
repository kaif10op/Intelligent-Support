import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { generateEmbeddings } from '../utils/jina.js';
import { formatPaginatedResponse, parsePaginationParams, calculateSkipTake } from '../utils/pagination.js';
import { exportChatsToCSV, getExportFilename } from '../utils/export.js';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';
import { DynamicTool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { logger } from '../utils/logger.js';

// 1. LLM Definitions with Fallbacks
const llmGroq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama-3.1-8b-instant',
  temperature: 0,
});

const llmCerebras = new ChatOpenAI({
  apiKey: process.env.CEREBRAS_API_KEY!,
  model: 'llama3.1-8b',
  configuration: { baseURL: 'https://api.cerebras.ai/v1' },
  temperature: 0,
});

const llmOpenRouter = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'meta-llama/llama-3.1-8b-instruct',
  configuration: { baseURL: 'https://openrouter.ai/api/v1' },
  temperature: 0,
});

const llmGemini = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_KEY!,
  model: 'gemini-1.5-flash',
  temperature: 0,
});

const llmXAI = new ChatOpenAI({
  apiKey: process.env.XAI_API_KEY!,
  model: 'grok-2-latest',
  configuration: { baseURL: 'https://api.x.ai/v1' },
  temperature: 0,
});

// Primary: Groq, Fallbacks: Cerebras -> OpenRouter -> Gemini -> xAI
const llmProviders = [
  { name: 'Groq', llm: llmGroq },
  { name: 'Cerebras', llm: llmCerebras },
  { name: 'OpenRouter', llm: llmOpenRouter },
  { name: 'Gemini', llm: llmGemini },
  { name: 'xAI', llm: llmXAI }
];

// 2. Chat Controller
export const chatWithAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { message, kbId, chatId } = req.body;
    if (!message || !kbId) return res.status(400).json({ error: 'Message and kbId are required' });

    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: kbId, userId: req.user!.id }
    });
    if (!kb) return res.status(403).json({ error: 'Unauthorized or missing KB' });

    // 1. Tool Definitions
    const kbSearchTool = new DynamicTool({
      name: 'search_knowledge_base',
      description: 'Searches the user documents for info. Use this FIRST for user questions.',
      func: async (query: string) => {
        try {
          const queryEmbeddings = await generateEmbeddings([query]);
          if (!queryEmbeddings || !queryEmbeddings[0]) return 'Failed to generate search embeddings.';
          const qVec = queryEmbeddings[0];

          // Fetch all chunks for this KB
          const allChunks = await prisma.documentChunk.findMany({
            where: { document: { kbId } },
            include: { document: { select: { filename: true } } }
          });

          // Manual Cosine Similarity Calculation
          const cosineSimilarity = (vecA: number[], vecB: number[]) => {
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;
            for (let i = 0; i < vecA.length; i++) {
              if (vecA[i] === undefined || vecB[i] === undefined) continue;
              dotProduct += vecA[i]! * vecB[i]!;
              normA += vecA[i]! * vecA[i]!;
              normB += vecB[i]! * vecB[i]!;
            }
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          };

          const scoredChunks = allChunks.map(chunk => ({
            content: chunk.content,
            filename: chunk.document.filename,
            similarity: cosineSimilarity(qVec, (chunk as any).embedding as number[])
          }));

          // Sort by similarity descending and take top 5
          const topChunks = scoredChunks
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);
          
          if (topChunks.length === 0) return 'No relevant info found in documents.';
          const maxSimilarity = Math.max(...topChunks.map(c => c.similarity));
          (req as any).maxSimilarity = maxSimilarity;
          return topChunks.map(c => `File: ${c.filename} (Similarity: ${c.similarity.toFixed(2)})\nContent: ${c.content}`).join('\n\n');
        } catch (err: any) {
            logger.error('KB Search Tool Error', { error: err.message, stack: err.stack });
            return 'Error searching internal KB.';
        }
      }
    });

    const webSearchTool = new DynamicTool({
      name: 'web_search',
      description: 'Searches the real-time internet for information not found in internal documents.',
      func: async (query: string) => {
        if (!process.env.TAVILY_API_KEY) return 'Web search unconfigured.';
        try {
          const search = new TavilySearch({ maxResults: 3 });
          // @ts-ignore - TavilySearch invoke method type mismatch (pre-existing)
          return await search.invoke(query);
        } catch (err: any) {
          logger.error('Web Search Tool Error', { error: err.message, stack: err.stack });
          return 'Web search failed.';
        }
      }
    });

    const tools = [kbSearchTool];
    if (process.env.TAVILY_API_KEY) tools.push(webSearchTool);

    const agentModifier = `You are a helpful customer support agent. 
    1. Search the 'search_knowledge_base' FIRST using the provided query.
    2. If the highest Similarity score from your search is below 0.70, acknowledge this uncertainty and suggest the user creates a support ticket.
    3. If no information is found in documents, you may try 'web_search'.
    4. Be professional and concise. 
    IMPORTANT: Act like a real human customer support agent. NEVER mention your internal thought process, search operations, tools, or similarity scores in your final response. Keep all internal mechanics completely hidden.`;

    // 2. Manual Fallback Loop (Query Rewriting + Agent Execution)
    let result = null;
    let lastError = null;

    for (const provider of llmProviders) {
      try {
        logger.debug('Attempting with provider', { provider: provider.name });

        // Rewrite step with current provider
        let searchSource = message;
        try {
          const rewritePrompt = `Analyze the following user query and rephrase it as a standalone search query for a technical document search.
          Maintain all technical terms and specific requests.
          Query: ${message}
          Search Query:`;
          const rewrittenQueryRes = await provider.llm.invoke(rewritePrompt);
          searchSource = rewrittenQueryRes.content?.toString() || message;
        } catch (e: any) {
          logger.warn('Provider rewriter failed, using original', { provider: provider.name, error: e.message });
        }

        // Agent step with current provider
        const agent = createReactAgent({
          llm: provider.llm as any,
          tools,
          messageModifier: agentModifier
        });

        // CONTEXT MEMORY: Fetch previous messages from this chat
        let messageHistory: any[] = [new HumanMessage(message)];
        if (chatId) {
          try {
            const previousMessages = await prisma.message.findMany({
              where: { chatId },
              orderBy: { createdAt: 'asc' },
              take: 10 // Last 10 messages for context
            });

            // Convert to LangChain message format
            messageHistory = previousMessages
              .map((msg) => {
                if (msg.role === 'user') {
                  return new HumanMessage(msg.content);
                } else {
                  return new AIMessage(msg.content);
                }
              })
              .concat([new HumanMessage(message)]); // Add current message at the end

            logger.debug('Context memory loaded', { messageCount: messageHistory.length });
          } catch (err: any) {
            logger.warn('Failed to load context memory', { error: err.message });
            // Fall back to just current message
            messageHistory = [new HumanMessage(message)];
          }
        }

        result = await agent.invoke({
          messages: messageHistory
        });

        if (result) {
          logger.info('Success with provider', { provider: provider.name });
          break;
        }
      } catch (err: any) {
        logger.error('Provider failed', { 
          provider: provider.name, 
          error: err.message,
          stack: err.stack 
        });
        lastError = err;
        continue; // Try next provider
      }
    }

    if (!result) throw lastError || new Error('All generation attempts failed.');


    // History and SSE setup
    let currentChatId = chatId;
    if (!currentChatId) {
      const chat = await prisma.chat.create({
        data: { title: message.substring(0, 50), userId: req.user!.id, kbId: kb.id }
      });
      currentChatId = chat.id;
    }

    await prisma.message.create({ data: { role: 'user', content: message, chatId: currentChatId } });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const lastMsg = result.messages ? result.messages[result.messages.length - 1] : null;
    if (!lastMsg) throw new Error('No response from agent');

    const fullAnswer = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);


    // Chunked response for streaming feel
    const tokens = fullAnswer.split(' ');
    for (const token of tokens) {
      res.write(`data: ${JSON.stringify({ token: token + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 15));
    }

    await prisma.message.create({
      data: { 
        role: 'ai', 
        content: fullAnswer, 
        chatId: currentChatId,
        confidence: (req as any).maxSimilarity || null
      }
    });

    res.write(`data: ${JSON.stringify({ event: 'done', chatId: currentChatId })}\n\n`);
    res.end();

  } catch (error: any) {
    logger.error('Agent Error', { error: error.message, stack: error.stack });
    if (!res.headersSent) res.status(500).json({ error: 'Agent failed' });
    else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { skip, take } = calculateSkipTake(page, limit);

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId: req.user!.id },
        orderBy: { updatedAt: 'desc' },
        include: { kb: { select: { title: true } } },
        skip,
        take
      }),
      prisma.chat.count({ where: { userId: req.user!.id } })
    ]);

    res.json(formatPaginatedResponse(chats, total, page, limit));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch chats' }); }
};

export const getChatDetails = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const chat = await prisma.chat.findFirst({
      where: { id, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, kb: true }
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch chat details' }); }
};

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { rating } = req.body; // 1 for up, -1 for down

    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({ error: 'Invalid rating. Must be 1 or -1.' });
    }

    // Check if message belongs to user's chat
    const message = await prisma.message.findFirst({
      where: { id, chat: { userId: req.user!.id } }
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    await prisma.message.update({
      where: { id },
      data: { rating }
    });


    res.json({ success: true });
  } catch (error: any) {
    logger.error('Feedback Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

/**
 * Clear all messages from a chat
 * DELETE /api/chat/:id/clear
 */
export const clearChat = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = req.params.id as string;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.user!.id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete all messages in this chat
    await prisma.message.deleteMany({
      where: { chatId }
    });

    res.json({ success: true, message: 'Chat cleared' });
  } catch (error: any) {
    logger.error('Clear Chat Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to clear chat' });
  }
};

/**
 * Regenerate AI response by resending the last user message
 * POST /api/chat/:id/regenerate
 */
export const regenerateResponse = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = req.params.id as string;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.user!.id },
      include: { kb: true }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get the last user message
    const lastUserMessage = await prisma.message.findFirst({
      where: { chatId, role: 'user' },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user message to regenerate' });
    }

    // Delete the last AI message if it exists
    const lastAIMessage = await prisma.message.findFirst({
      where: { chatId, role: 'ai' },
      orderBy: { createdAt: 'desc' }
    });

    if (lastAIMessage) {
      await prisma.message.delete({ where: { id: lastAIMessage.id } });
    }

    // Recreate the request body to call the chat function
    // This triggers a fresh agent response with the same message
    const regenerateReq = {
      ...req,
      body: {
        message: lastUserMessage.content,
        kbId: chat.kbId,
        chatId: chat.id
      }
    };

    // Call the main chat function to regenerate the response
    // This will create a new AI message with potentially different output
    await chatWithAgent(regenerateReq as AuthRequest, res);
  } catch (error: any) {
    logger.error('Regenerate Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to regenerate response' });
  }
};

/**
 * Get suggested follow-up questions based on the last AI message
 * GET /api/chat/:id/suggestions
 */
export const getSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = req.params.id as string;

    // Verify user owns this chat
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.user!.id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get the last AI message
    const lastAIMessage = await prisma.message.findFirst({
      where: { chatId, role: 'ai' },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastAIMessage) {
      return res.status(400).json({ error: 'No AI message to generate suggestions from' });
    }

    // Use LLM to generate 3 follow-up questions
    try {
      const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: 'llama-3.1-8b-instant'
      });

      const suggestionPrompt = `Based on this response, generate exactly 3 natural follow-up questions that a user might ask. Return ONLY the questions as a JSON array of strings, with no other text.

Response: ${lastAIMessage.content}

Return format: ["question 1", "question 2", "question 3"]`;

      const response = await llm.invoke(suggestionPrompt);
      const content = response.content?.toString() || '[]';

      // Parse the JSON array of suggestions
      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(content);
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
          suggestions = [
            'Can you elaborate on that?',
            'How does that apply to my situation?',
            'What are the next steps?'
          ];
        }
      } catch {
        // If parsing fails, provide default suggestions
        suggestions = [
          'Can you tell me more?',
          'How does this work?',
          'What should I do next?'
        ];
      }

      res.json({ suggestions: suggestions.slice(0, 3) });
    } catch (llmError: any) {
      logger.warn('Failed to generate suggestions with LLM, using defaults', { error: llmError.message });
      res.json({
        suggestions: [
          'Can you elaborate on that?',
          'How does that apply to me?',
          'What are the next steps?'
        ]
      });
    }
  } catch (error: any) {
    logger.error('Suggestions Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

/**
 * Export user's chats to CSV
 * GET /api/chat/export/csv
 */
export const exportChatsAsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user!.id },
      include: {
        kb: { select: { title: true } },
        messages: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const csv = exportChatsToCSV(chats);
    const filename = getExportFilename('chats');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    logger.error('Export chats error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to export chats' });
  }
};
