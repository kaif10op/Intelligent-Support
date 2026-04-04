import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { createTicket, getMyTickets, getAllTickets, updateTicket, addTicketNote, getTicketMessages, deleteTicketMessage, suggestReply, exportMyTicketsAsCSV, exportAllTicketsAsCSV, assignTicket } from '../controllers/ticket.js';

const router = Router();

// User Routes
router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, getMyTickets); // GET /api/tickets - get user's tickets
router.get('/my', requireAuth, getMyTickets); // Alternative endpoint
router.get('/export/csv', requireAuth, exportMyTicketsAsCSV); // Export user's tickets

// Ticket Message Routes (bidirectional - both users and admins can add messages)
router.get('/:id/messages', requireAuth, getTicketMessages);
router.post('/:id/messages', requireAuth, addTicketNote); // Users and admins can add messages
router.delete('/:id/messages/:noteId', requireAuth, deleteTicketMessage); // Users can delete own, admins can delete any

// Admin Routes
router.get('/all', requireAuth, requireAdmin, getAllTickets);
router.get('/export/all/csv', requireAuth, requireAdmin, exportAllTicketsAsCSV); // Export all tickets
router.put('/:id', requireAuth, requireAdmin, updateTicket);
router.put('/:id/assign', requireAuth, requireAdmin, assignTicket); // Assign ticket to support agent
router.post('/:id/suggest-reply', requireAuth, requireAdmin, suggestReply); // AI suggestion for admin replies

// Legacy note endpoint (kept for compatibility, but users should use /messages)
router.post('/:id/notes', requireAuth, requireAdmin, addTicketNote);

export default router;
