import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { createTicket, getMyTickets, getAllTickets, updateTicket, addTicketNote } from '../controllers/ticket.js';

const router = Router();

// User Routes
router.post('/', requireAuth, createTicket);
router.get('/my', requireAuth, getMyTickets);

// Admin Routes
router.get('/all', requireAuth, requireAdmin, getAllTickets);
router.put('/:id', requireAuth, requireAdmin, updateTicket);
router.post('/:id/notes', requireAuth, requireAdmin, addTicketNote);

export default router;
