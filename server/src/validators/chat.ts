import { z } from 'zod';

// Chat Validators
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
  kbId: z.string().uuid('Invalid KB ID'),
  chatId: z.string().uuid('Invalid chat ID').optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(-1).max(1, 'Rating must be -1 or 1'),
});

export const clearChatSchema = z.object({
  id: z.string().uuid('Invalid chat ID'),
});

export const regenerateSchema = z.object({
  id: z.string().uuid('Invalid chat ID'),
});

export const suggestionsSchema = z.object({
  id: z.string().uuid('Invalid chat ID'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
