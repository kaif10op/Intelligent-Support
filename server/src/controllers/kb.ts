import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { JinaEmbeddings } from '@langchain/community/embeddings/jina';

export const createKB = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const kb = await prisma.knowledgeBase.create({
      data: {
        title,
        description,
        userId: req.user!.id,
      },
    });

    res.json(kb);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create knowledge base' });
  }
};

export const getMyKBs = async (req: AuthRequest, res: Response) => {
  try {
    const kbs = await prisma.knowledgeBase.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(kbs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch knowledge bases' });
  }
};

export const getKBDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: id as string, userId: req.user!.id },
      include: {
        documents: true,
        chats: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!kb) return res.status(404).json({ error: 'Knowledge base not found' });
    res.json(kb);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch knowledge base details' });
  }
};

export const deleteKB = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.knowledgeBase.delete({
      where: { id: id as string, userId: req.user!.id },
    });
    res.json({ message: 'Knowledge base deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete knowledge base' });
  }
};
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Ensure the document belongs to a KB owned by the user
    const doc = await prisma.document.findFirst({
      where: {
        id: id as string,
        kb: { userId: req.user!.id }
      }
    });

    if (!doc) return res.status(404).json({ error: 'Document not found or unauthorized' });

    await prisma.document.delete({
      where: { id: id as string }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

/**
 * Reindex all documents in a knowledge base
 * Regenerates embeddings for better search performance
 * PUT /api/kb/:id/reindex (admin or owner only)
 */
export const reindexDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get KB and verify ownership
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: id as string, userId: req.user!.id },
      include: { documents: { include: { chunks: true } } }
    });

    if (!kb) return res.status(404).json({ error: 'Knowledge base not found' });

    const embeddings = new JinaEmbeddings({
      apiKey: process.env.JINA_API_KEY!,
      model: 'jina-embeddings-v2-base-en'
    });

    let reindexedCount = 0;

    // Reindex all documents and their chunks
    for (const doc of kb.documents) {
      try {
        // Get all chunks for this document
        const chunks = await prisma.documentChunk.findMany({
          where: { docId: doc.id }
        });

        // Regenerate embeddings for each chunk
        for (const chunk of chunks) {
          try {
            const embedding = await embeddings.embedQuery(chunk.content);

            await prisma.documentChunk.update({
              where: { id: chunk.id },
              data: { embedding: embedding }
            });

            reindexedCount++;
          } catch (chunkError) {
            console.error(`Failed to reindex chunk ${chunk.id}:`, chunkError);
            // Continue with next chunk
          }
        }
      } catch (docError) {
        console.error(`Failed to reindex document ${doc.id}:`, docError);
        // Continue with next document
      }
    }

    res.json({
      success: true,
      message: `Reindexed ${reindexedCount} chunks`,
      kbId: id,
      reindexedChunks: reindexedCount,
      totalChunks: kb.documents.reduce((sum, d) => sum + d.chunks.length, 0)
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ error: 'Failed to reindex documents' });
  }
};
