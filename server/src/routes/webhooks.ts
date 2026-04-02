import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
  getWebhookEvents,
  testWebhook,
  getWebhookLogs
} from '../controllers/webhooks.js';

const router = Router();

router.use(requireAuth as any);
router.use(requireAdmin as any); // All webhook routes require admin

router.post('/', createWebhook as any);
router.get('/', getWebhooks as any);
router.put('/:webhookId', updateWebhook as any);
router.delete('/:webhookId', deleteWebhook as any);
router.get('/events/list', getWebhookEvents as any);
router.post('/:webhookId/test', testWebhook as any);
router.get('/:webhookId/logs', getWebhookLogs as any);

export default router;
