import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  createABTest,
  recordABTestResult,
  getABTestResults,
  listABTests,
  applyABTestWinner
} from '../controllers/abTest.js';

const router = Router();

router.use(requireAuth as any);

// Admin-only endpoints
router.post('/', requireAdmin as any, createABTest as any);
router.get('/', requireAdmin as any, listABTests as any);
router.post('/:testId/record', recordABTestResult as any);
router.get('/:testId/results', getABTestResults as any);
router.post('/:testId/apply-winner', requireAdmin as any, applyABTestWinner as any);

export default router;
