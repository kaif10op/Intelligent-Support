import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

// Get all users (admin only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Verify admin
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can manage users' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err: any) {
    logger.error('Get users failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { targetUserId, role } = req.body;

    // Validate role
    if (!['ADMIN', 'SUPPORT_AGENT', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, SUPPORT_AGENT, or USER' });
    }

    // Verify admin
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can manage users' });
    }

    // Don't allow non-admin to demote themselves
    if (userId === targetUserId && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    logger.info(`User role updated: ${targetUserId} -> ${role}`, { adminId: userId });
    res.json({ user: updatedUser });
  } catch (err: any) {
    logger.error('Update user role failed', { error: err.message });
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Get user by ID (for profile)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err: any) {
    logger.error('Get user profile failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Delete user (admin only - careful!)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { targetUserId } = req.body;

    // Verify admin
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    // Prevent self-deletion
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    logger.warn(`User deleted: ${targetUserId}`, { adminId: userId });
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Delete user failed', { error: err.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
