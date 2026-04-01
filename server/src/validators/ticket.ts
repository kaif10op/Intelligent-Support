import { z } from 'zod';

// Ticket Validators
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  priority: priorityEnum.default('MEDIUM'),
  chatId: z.string().uuid('Invalid chat ID').optional(),
});

export const updateTicketSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignedToId: z.string().uuid('Invalid user ID').optional(),
}).refine(obj => Object.keys(obj).length > 0, 'At least one field must be updated');

export const addTicketMessageSchema = z.object({
  content: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
});

export const deleteTicketMessageSchema = z.object({
  noteId: z.string().uuid('Invalid message ID'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
