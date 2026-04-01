import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { createTicket, getMyTickets, getAllTickets, updateTicket, addTicketNote, getTicketMessages, deleteTicketMessage } from '../controllers/ticket.js';

const router = Router();

// User Routes
router.post('/', requireAuth, createTicket);
router.get('/my', requireAuth, getMyTickets);

// Ticket Message Routes (bidirectional - both users and admins can add messages)
router.get('/:id/messages', requireAuth, getTicketMessages);
router.post('/:id/messages', requireAuth, addTicketNote); // Users and admins can add messages
router.delete('/:id/messages/:noteId', requireAuth, deleteTicketMessage); // Users can delete own, admins can delete any

// Admin Routes
router.get('/all', requireAuth, requireAdmin, getAllTickets);
router.put('/:id', requireAuth, requireAdmin, updateTicket);

// Legacy note endpoint (kept for compatibility, but users should use /messages)
router.post('/:id/notes', requireAuth, requireAdmin, addTicketNote);

export default router;
