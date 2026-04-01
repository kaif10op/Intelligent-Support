import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { getAdminStats, getAllUsers, getUserActivity, getAnalytics, changeUserRole } from '../controllers/admin.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserActivity);
router.put('/users/:id/role', changeUserRole);

export default router;
