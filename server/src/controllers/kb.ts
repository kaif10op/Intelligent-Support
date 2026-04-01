import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

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
