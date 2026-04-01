import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { generateEmbeddings } from '../utils/jina.js';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// 1. Groq (Primary)
const llmGroq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama3-8b-8192',
  temperature: 0,
});

// 2. Cerebras (Fast Fallback)
const llmCerebras = new ChatOpenAI({
  apiKey: process.env.CEREBRAS_API_KEY!,
  model: 'llama3.1-8b',
  configuration: {
    baseURL: 'https://api.cerebras.ai/v1',
  },
  temperature: 0,
});

// 3. OpenRouter (Broad Access)
const llmOpenRouter = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'meta-llama/llama-3-8b-instruct',
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  temperature: 0,
});

// 4. Gemini (Reliable Fallback)
const llmGemini = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_KEY!,
  model: 'gemini-pro',
  temperature: 0,
});

// 5. xAI (Final Fallback)
const llmXAI = new ChatOpenAI({
  apiKey: process.env.XAI_API_KEY!,
  model: 'grok-beta',
  configuration: {
    baseURL: 'https://api.x.ai/v1',
  },
  temperature: 0,
});

const llmWithFallback = llmGroq.withFallbacks([
  llmCerebras,
  llmOpenRouter,
  llmGemini,
  llmXAI
]);


const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful customer support AI. Use the following context from the user's uploaded documents to answer the question.
If the answer is not contained in the context, say "I don't have enough information from the documents to answer that."

Context:
{context}

Question: {question}

Answer:`);

const chain = promptTemplate.pipe(llmWithFallback).pipe(new StringOutputParser());

export const chatWithAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { message, kbId, chatId } = req.body;
    if (!message || !kbId) return res.status(400).json({ error: 'Message and kbId are required' });

    // Validate User & KB
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: kbId, userId: req.user!.id }
    });
    if (!kb) return res.status(403).json({ error: 'Unauthorized or missing KB' });

    // Get vector for User Question
    const embeddings = await generateEmbeddings([message]);
    const questionVector = embeddings[0];
    if (!questionVector) return res.status(500).json({ error: 'Failed to generate question embedding' });
    const vectorStr = `[${questionVector.join(',')}]`;

    // Semantic Search on pgvector using inner product (<#>)
    // Limit to top 5 chunks.
    const chunks: any = await prisma.$queryRaw`
      SELECT c.content, c.id, d.filename, 1 - (c.embedding <=> ${vectorStr}::vector) AS similarity
      FROM "DocumentChunk" c
      JOIN "Document" d ON c."docId" = d.id
      WHERE d."kbId" = ${kbId}
      ORDER BY c.embedding <=> ${vectorStr}::vector
      LIMIT 5
    `;

    const contextText = chunks.map((c: any) => `Document: ${c.filename}\nContent:\n${c.content}`).join('\n\n');
    const sources = chunks.map((c: any) => ({ filename: c.filename, chunkId: c.id, content: c.content, similarity: c.similarity }));

    // Manage Chat History
    let currentChatId = chatId;
    if (!currentChatId) {
      const chat = await prisma.chat.create({
        data: {
          title: message.substring(0, 50),
          userId: req.user!.id,
          kbId: kb.id
        }
      });
      currentChatId = chat.id;
    }

    // Save User Query
    await prisma.message.create({
      data: {
        role: 'user',
        content: message,
        chatId: currentChatId
      }
    });

    // Start Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream LLM Response
    const stream = await chain.stream({
      context: contextText,
      question: message
    });

    let fullAnswer = '';

    for await (const chunk of stream) {
      fullAnswer += chunk;
      // SSE format is data: <payload> \n\n
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
    }

    // Save the final AI response to DB
    await prisma.message.create({
      data: {
        role: 'ai',
        content: fullAnswer,
        sources: sources,
        chatId: currentChatId
      }
    });

    // Send final closing event containing sources and final meta
    res.write(`data: ${JSON.stringify({ event: 'done', sources, chatId: currentChatId })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat completion failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed midway' })}\n\n`);
      res.end();
    }
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        kb: { select: { title: true } },
        _count: { select: { messages: true } }
      }
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

export const getChatDetails = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const chat = await prisma.chat.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        kb: true
      }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat details' });
  }
};
