import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
// In this specific environment, pdf-parse seems to export an object with PDFParse class
const PDFParse = pdf.PDFParse;
import mammoth from 'mammoth';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { generateEmbeddings } from '../utils/jina.js';
import { autoCreateVersionInternalVersion } from './kb.js';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { kbId } = req.body;
    
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!kbId) return res.status(400).json({ error: 'kbId is required' });

    // Validate KB ownership
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: kbId, userId: req.user!.id }
    });
    if (!kb) return res.status(403).json({ error: 'Invalid or unauthorized Knowledge Base' });

    let rawText = '';

    if (file.mimetype === 'application/pdf') {
      try {
          if (typeof pdf === 'function') {
              const data = await (pdf as any)(file.buffer);
              rawText = data.text;
          } else if (PDFParse) {
              const parser = new (PDFParse as any)({ data: file.buffer } as any);
              const textResult = await (parser as any).getText();
              rawText = textResult.text;
          } else {
              throw new Error('PDF parser not found in package');
          }
      } catch (e: any) {
          logger.error('PDF Parse failed', { error: e.message, stack: e.stack });
          throw new Error('Failed to parse PDF: ' + e.message);
      }
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {


      rawText = file.buffer.toString('utf-8');
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = result.value;
    } else if (file.mimetype.startsWith('image/')) {
        // For images, we just store the filename for now, or could use OCR. 
        // For this task, let's just say we don't support content extraction from images yet but accept them.
        rawText = `Image File: ${file.originalname}`;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, TXT, DOCX, or MD' });
    }

    if (!rawText.trim()) return res.status(400).json({ error: 'File is empty' });

    // Sanitize text: remove null bytes and invalid UTF-8 sequences
    rawText = rawText
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n, \r, \t
      .trim();

    if (!rawText.trim()) return res.status(400).json({ error: 'File is empty after sanitization' });

    // Create Document record
    const document = await prisma.document.create({
      data: {
        filename: file.originalname,
        type: file.mimetype,
        size: file.size,
        kbId: kb.id
      }
    });

    // Chunking
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.createDocuments([rawText]);
    const chunkTexts = chunks.map(chunk => chunk.pageContent);

    // Embeddings
    const embeddings = await generateEmbeddings(chunkTexts);

    // Save to Postgres as standard Float[] arrays
    for (let i = 0; i < chunkTexts.length; i++) {
        const embedding = embeddings[i];
        if (!embedding) continue;
        
        await (prisma.documentChunk as any).create({
          data: {
            content: chunkTexts[i],
            embedding: embedding,
            docId: document.id
          }
        });
    }

    // Auto-create version snapshot after document upload
    await autoCreateVersionInternalVersion(kb.id, `Document added: ${file.originalname}`);

    res.json({ message: 'Document uploaded and processed successfully', document });
  } catch (error: any) {
    logger.error('Upload Error', { error: error.message, stack: error.stack });
    const isEmbeddingFailure =
      typeof error?.message === 'string' &&
      (error.message.includes('Failed to generate embeddings') ||
        error.message.includes('JINA_API_KEY'));

    if (isEmbeddingFailure) {
      return res.status(502).json({
        error: 'Embedding service configuration is invalid. Please verify JINA_API_KEY and try again.'
      });
    }

    res.status(500).json({ error: 'Failed to process document' });
  }
};

