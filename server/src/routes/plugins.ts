import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  installPlugin,
  togglePlugin,
  getPlugins,
  getPluginDetails,
  updatePluginConfig,
  uninstallPlugin,
  getAvailableHooks
} from '../controllers/plugins.js';

const router = Router();

router.use(requireAuth as any);
router.use(requireAdmin as any); // All plugin routes require admin

router.post('/install', installPlugin as any);
router.put('/:pluginId/toggle', togglePlugin as any);
router.get('/', getPlugins as any);
router.get('/:pluginId', getPluginDetails as any);
router.put('/:pluginId/config', updatePluginConfig as any);
router.delete('/:pluginId', uninstallPlugin as any);
router.get('/hooks/list', getAvailableHooks as any);

export default router;
