import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getAdminStats, getAllUsers, getUserActivity } from '../controllers/admin.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserActivity);

export default router;
