import { Router } from 'express';
import { requireAuth, requireAdmin, requireSupportAgent } from '../middlewares/auth.js';
import { createTicket, getMyTickets, getAllTickets, getTicketById, getTicketContext, updateTicket, addTicketNote, getTicketMessages, deleteTicketMessage, suggestReply, exportMyTicketsAsCSV, exportAllTicketsAsCSV, assignTicket, getAssignmentMetrics, autoAssignTickets, rebalanceTickets, optimizeTicketAssignment } from '../controllers/ticket.js';

const router = Router();

// User Routes
router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, getMyTickets); // GET /api/tickets - get user's tickets

// Admin Routes (must come BEFORE dynamic routes)
router.get('/admin/assignment-metrics', requireAuth, requireAdmin, getAssignmentMetrics);
router.post('/admin/auto-assign', requireAuth, requireAdmin, autoAssignTickets);
router.post('/admin/rebalance', requireAuth, requireAdmin, rebalanceTickets);
router.post('/admin/optimize', requireAuth, requireAdmin, optimizeTicketAssignment);
router.get('/all', requireAuth, requireAdmin, getAllTickets);
router.get('/export/all/csv', requireAuth, requireAdmin, exportAllTicketsAsCSV); // Export all tickets

// User Routes (continued - static paths)
router.get('/my', requireAuth, getMyTickets); // Alternative endpoint
router.get('/export/csv', requireAuth, exportMyTicketsAsCSV); // Export user's tickets

// Dynamic Routes (MUST come AFTER all static routes)
router.get('/:id/context', requireAuth, getTicketContext);
router.get('/:id/messages', requireAuth, getTicketMessages);
router.post('/:id/messages', requireAuth, addTicketNote); // Users and admins can add messages
router.delete('/:id/messages/:noteId', requireAuth, deleteTicketMessage); // Users can delete own, admins can delete any
router.get('/:id', requireAuth, getTicketById);
router.put('/:id', requireSupportAgent, updateTicket); // Support agents can update status, admins full access
router.put('/:id/assign', requireAuth, requireAdmin, assignTicket); // Assign ticket to support agent (admin only)
router.post('/:id/suggest-reply', requireAuth, requireAdmin, suggestReply); // AI suggestion for admin replies

// Legacy note endpoint (kept for compatibility, but users should use /messages)
router.post('/:id/notes', requireAuth, requireAdmin, addTicketNote);

export default router;
