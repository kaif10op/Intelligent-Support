import { z } from 'zod';

// Knowledge Base Validators
export const createKBSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const updateKBSchema = createKBSchema.partial();

export const deleteKBSchema = z.object({
  id: z.string().uuid('Invalid KB ID'),
});

export type CreateKBInput = z.infer<typeof createKBSchema>;
export type UpdateKBInput = z.infer<typeof updateKBSchema>;
