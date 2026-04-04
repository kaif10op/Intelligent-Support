import { Router } from 'express';
import { googleAuth, clerkAuth, logout, getMe } from '../controllers/auth.js';

const router = Router();

router.post('/google', googleAuth);
router.post('/clerk', clerkAuth);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
