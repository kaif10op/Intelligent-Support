import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

/**
 * Plugin System for extensibility
 * Allows admin to register and manage custom plugins
 * Plugins can hook into system events and expose webhooks
 */

/**
 * Install a plugin
 * POST /api/plugins/install
 */
export const installPlugin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, displayName, version, author, installUrl, description, hooks, permissions } =
      req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'name and displayName are required' });
    }

    // Check if plugin already installed
    const existing = await prisma.plugin.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({ error: `Plugin "${name}" already installed` });
    }

    // Create plugin record
    const plugin = await prisma.plugin.create({
      data: {
        name,
        displayName,
        version: version || '1.0.0',
        description,
        enabled: false,
        config: {
          author: author || 'Unknown',
          installUrl,
          hooks: hooks || [],
          permissions: permissions || {},
        }
      }
    });

    // Log installation
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'plugin_installed',
        resourceType: 'plugin',
        resourceId: plugin.id,
        description: `Plugin installed: ${displayName} v${version}`
      }
    });

    res.status(201).json({
      success: true,
      message: `Plugin "${displayName}" installed successfully`,
      plugin
    });
  } catch (error: any) {
    logger.error('Install Plugin Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to install plugin' });
  }
};

/**
 * Enable/disable a plugin
 * PUT /api/plugins/:pluginId/toggle
 */
export const togglePlugin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { pluginId } = req.params;
    const { enabled } = req.body;

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId as string }
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const updated = await prisma.plugin.update({
      where: { id: pluginId as string },
      data: { enabled: enabled ?? !plugin.enabled }
    });

    // Log toggle
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: updated.enabled ? 'plugin_enabled' : 'plugin_disabled',
        resourceType: 'plugin',
        resourceId: plugin.id,
        description: `Plugin ${updated.enabled ? 'enabled' : 'disabled'}: ${plugin.displayName}`
      }
    });

    res.json({
      success: true,
      message: `Plugin "${plugin.displayName}" ${updated.enabled ? 'enabled' : 'disabled'}`,
      plugin: updated
    });
  } catch (error: any) {
    logger.error('Toggle Plugin Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to toggle plugin' });
  }
};

/**
 * Get all plugins
 * GET /api/plugins
 */
export const getPlugins = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const plugins = await prisma.plugin.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      plugins,
      total: plugins.length,
      enabled: plugins.filter(p => p.enabled).length,
      disabled: plugins.filter(p => !p.enabled).length
    });
  } catch (error: any) {
    logger.error('Get Plugins Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
};

/**
 * Get plugin details
 * GET /api/plugins/:pluginId
 */
export const getPluginDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { pluginId } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId as string }
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json(plugin);
  } catch (error: any) {
    logger.error('Get Plugin Details Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch plugin details' });
  }
};

/**
 * Update plugin configuration
 * PUT /api/plugins/:pluginId/config
 */
export const updatePluginConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { pluginId } = req.params;
    const { config, webhookUrl } = req.body;

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId as string }
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const updated = await prisma.plugin.update({
      where: { id: pluginId as string },
      data: {
        config: config || plugin.config,
        webhookUrl: webhookUrl || plugin.webhookUrl
      }
    });

    // Log configuration change
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'plugin_configured',
        resourceType: 'plugin',
        resourceId: plugin.id,
        description: `Plugin configuration updated: ${plugin.displayName}`,
        changes: { config, webhookUrl }
      }
    });

    res.json({
      success: true,
      message: 'Plugin configuration updated',
      plugin: updated
    });
  } catch (error: any) {
    logger.error('Update Plugin Config Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update plugin configuration' });
  }
};

/**
 * Uninstall a plugin
 * DELETE /api/plugins/:pluginId
 */
export const uninstallPlugin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { pluginId } = req.params;

    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId as string }
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    await prisma.plugin.delete({
      where: { id: pluginId as string }
    });

    // Log uninstallation
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'plugin_uninstalled',
        resourceType: 'plugin',
        description: `Plugin uninstalled: ${plugin.displayName}`
      }
    });

    res.json({
      success: true,
      message: `Plugin "${plugin.displayName}" uninstalled successfully`
    });
  } catch (error: any) {
    logger.error('Uninstall Plugin Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to uninstall plugin' });
  }
};

/**
 * Trigger a hook event for all enabled plugins
 * Called internally from other controllers
 */
export const triggerPluginHook = async (hookName: string, data: any) => {
  try {
    // Get all enabled plugins and filter by hook support
    const allPlugins = await prisma.plugin.findMany({
      where: {
        enabled: true
      }
    });

    // Filter plugins that support this hook
    const plugins = allPlugins.filter(plugin => {
      const hooks = (plugin.config as any)?.hooks || [];
      return Array.isArray(hooks) && hooks.includes(hookName);
    });

    // Trigger webhook for each plugin
    for (const plugin of plugins) {
      if (plugin.webhookUrl) {
        try {
          await axios.post(plugin.webhookUrl, {
            hook: hookName,
            data,
            pluginId: plugin.id,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          logger.error('Failed to trigger webhook for plugin', { 
            pluginName: plugin.name, 
            error: error.message, 
            stack: error.stack 
          });
        }
      }
    }
  } catch (error: any) {
    logger.error('Trigger Plugin Hook Error', { error: error.message, stack: error.stack });
  }
};

/**
 * Get available hooks
 * GET /api/plugins/hooks/list
 */
export const getAvailableHooks = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const availableHooks = [
      {
        name: 'on_ticket_created',
        description: 'Triggered when a new ticket is created',
        data: { ticketId: 'string', title: 'string', userId: 'string' }
      },
      {
        name: 'on_ticket_updated',
        description: 'Triggered when ticket status or priority changes',
        data: { ticketId: 'string', status: 'string', priority: 'string' }
      },
      {
        name: 'on_chat_started',
        description: 'Triggered when a new chat session starts',
        data: { chatId: 'string', userId: 'string', kbId: 'string' }
      },
      {
        name: 'on_message_generated',
        description: 'Triggered when AI generates a response',
        data: { chatId: 'string', message: 'string', confidence: 'number' }
      },
      {
        name: 'on_feedback_submitted',
        description: 'Triggered when user provides feedback',
        data: { messageId: 'string', rating: 'number', feedback: 'string' }
      },
      {
        name: 'on_document_uploaded',
        description: 'Triggered when a document is added to KB',
        data: { kbId: 'string', docName: 'string', docSize: 'number' }
      },
      {
        name: 'on_user_registered',
        description: 'Triggered when a new user registers',
        data: { userId: 'string', email: 'string', name: 'string' }
      },
      {
        name: 'on_kb_created',
        description: 'Triggered when a new KB is created',
        data: { kbId: 'string', title: 'string', userId: 'string' }
      }
    ];

    res.json({
      hooks: availableHooks,
      total: availableHooks.length
    });
  } catch (error: any) {
    logger.error('Get Available Hooks Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch available hooks' });
  }
};
