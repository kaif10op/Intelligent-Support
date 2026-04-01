import { Router } from 'express';
import { googleAuth, logout, getMe } from '../controllers/auth.js';

const router = Router();

router.post('/google', googleAuth);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
