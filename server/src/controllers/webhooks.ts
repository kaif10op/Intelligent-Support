import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Advanced Webhook Management
 * Allow admins to subscribe to system events and route to custom endpoints
 */

/**
 * Create a webhook subscription
 * POST /api/webhooks
 */
export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, url, events, active, secret } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'name and url are required' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'At least one event must be subscribed' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid webhook URL' });
    }

    // Create webhook record in AuditLog
    const webhook = await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'webhook_created',
        resourceType: 'webhook',
        description: `Webhook created: ${name}`,
        changes: {
          name,
          url,
          events,
          active: active ?? true,
          secret,
          created_at: new Date().toISOString(),
          webhook_id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        } as any
      }
    });

    res.status(201).json({
      success: true,
      message: 'Webhook created successfully',
      webhook: {
        id: webhook.id,
        name,
        url,
        events,
        active: active ?? true,
        secret: secret ? '****' : null,
        created_at: webhook.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Create Webhook Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

/**
 * Get all webhooks
 * GET /api/webhooks
 */
export const getWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const webhooks = await prisma.auditLog.findMany({
      where: { action: 'webhook_created' },
      orderBy: { createdAt: 'desc' }
    });

    const formattedWebhooks = webhooks.map(w => {
      const changes = w.changes as any || {};
      return {
        id: w.id,
        name: changes.name,
        url: changes.url,
        events: changes.events,
        active: changes.active,
        created_at: w.createdAt,
        status: changes.active ? 'active' : 'inactive'
      };
    });

    res.json({
      webhooks: formattedWebhooks,
      total: formattedWebhooks.length,
      active: formattedWebhooks.filter(w => w.active).length
    });
  } catch (error: any) {
    logger.error('Get Webhooks Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
};

/**
 * Update webhook
 * PUT /api/webhooks/:webhookId
 */
export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { webhookId } = req.params;
    const { name, url, events, active } = req.body;

    const webhook = await prisma.auditLog.findUnique({
      where: { id: webhookId as string }
    });

    if (!webhook || webhook.action !== 'webhook_created') {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const changes = webhook.changes as any || {};

    const updated = await prisma.auditLog.update({
      where: { id: webhookId as string },
      data: {
        changes: {
          ...changes,
          name: name || changes.name,
          url: url || changes.url,
          events: events || changes.events,
          active: active !== undefined ? active : changes.active,
          updated_at: new Date().toISOString()
        } as any
      }
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'webhook_updated',
        resourceType: 'webhook',
        resourceId: webhookId as string,
        description: `Webhook updated: ${changes.name}`,
        changes: { name, url, events, active }
      }
    });

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      webhook: {
        id: updated.id,
        name: (updated.changes as any).name,
        url: (updated.changes as any).url,
        events: (updated.changes as any).events,
        active: (updated.changes as any).active
      }
    });
  } catch (error: any) {
    logger.error('Update Webhook Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

/**
 * Delete webhook
 * DELETE /api/webhooks/:webhookId
 */
export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { webhookId } = req.params;

    const webhook = await prisma.auditLog.findUnique({
      where: { id: webhookId as string }
    });

    if (!webhook || webhook.action !== 'webhook_created') {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const changes = webhook.changes as any || {};

    // Log deletion
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'webhook_deleted',
        resourceType: 'webhook',
        resourceId: webhookId as string,
        description: `Webhook deleted: ${changes.name}`
      }
    });

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete Webhook Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

/**
 * Get webhook events
 * GET /api/webhooks/events/list
 */
export const getWebhookEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const events = [
      {
        id: 'ticket.created',
        name: 'Ticket Created',
        description: 'Triggered when a new ticket is created'
      },
      {
        id: 'ticket.updated',
        name: 'Ticket Updated',
        description: 'Triggered when ticket is updated'
      },
      {
        id: 'ticket.resolved',
        name: 'Ticket Resolved',
        description: 'Triggered when ticket is marked resolved'
      },
      {
        id: 'chat.started',
        name: 'Chat Started',
        description: 'Triggered when user starts a chat'
      },
      {
        id: 'chat.message',
        name: 'Chat Message',
        description: 'Triggered when message is sent in chat'
      },
      {
        id: 'kb.document.uploaded',
        name: 'KB Document Uploaded',
        description: 'Triggered when document added to knowledge base'
      },
      {
        id: 'user.registered',
        name: 'User Registered',
        description: 'Triggered when new user registers'
      },
      {
        id: 'feedback.submitted',
        name: 'Feedback Submitted',
        description: 'Triggered when user submits feedback'
      },
      {
        id: 'ai.response',
        name: 'AI Response Generated',
        description: 'Triggered when AI generates response'
      }
    ];

    res.json({
      events,
      total: events.length
    });
  } catch (error: any) {
    logger.error('Get Webhook Events Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
};

/**
 * Test webhook by sending sample event
 * POST /api/webhooks/:webhookId/test
 */
export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { webhookId } = req.params;

    const webhook = await prisma.auditLog.findUnique({
      where: { id: webhookId as string }
    });

    if (!webhook || webhook.action !== 'webhook_created') {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const changes = webhook.changes as any || {};
    const webhookUrl = changes.url;

    // Send test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        webhook_id: webhookId,
        message: 'This is a test payload'
      }
    };

    try {
      const payloadString = JSON.stringify(testPayload);
      const signature = changes.secret
        ? crypto.createHmac('sha256', changes.secret).update(payloadString).digest('hex')
        : null;

      const response = await axios.post(webhookUrl, testPayload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'webhook.test',
          ...(signature ? { 'X-Webhook-Signature': `sha256=${signature}` } : {})
        }
      });

      res.json({
        success: true,
        message: 'Test payload sent successfully',
        response: {
          status: response.status,
          statusText: response.statusText
        }
      });
    } catch (axiosError: any) {
      res.status(200).json({
        success: false,
        message: 'Webhook endpoint failed to respond',
        error: axiosError.message,
        status: axiosError.response?.status
      });
    }
  } catch (error: any) {
    logger.error('Test Webhook Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to test webhook' });
  }
};

/**
 * Get webhook delivery logs
 * GET /api/webhooks/:webhookId/logs
 */
export const getWebhookLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { webhookId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get webhook delivery logs from audit trail
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'webhook_delivered',
        resourceId: webhookId as string
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const formattedLogs = logs.map(log => {
      const changes = log.changes as any || {};
      return {
        id: log.id,
        event: changes.event,
        status: changes.status,
        response_code: changes.response_code,
        timestamp: log.createdAt,
        duration_ms: changes.duration_ms
      };
    });

    res.json({
      logs: formattedLogs,
      total: formattedLogs.length,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    logger.error('Get Webhook Logs Error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
};

/**
 * Trigger webhook delivery for active webhooks
 * Called internally when events occur
 */
export const broadcastWebhookEvent = async (eventId: string, data: any) => {
  try {
    // Get all active webhooks subscribed to this event
    const webhooks = await prisma.auditLog.findMany({
      where: {
        action: 'webhook_created',
        changes: {
          path: ['active'],
          equals: true
        } as any
      }
    });

    for (const webhook of webhooks) {
      const changes = webhook.changes as any || {};
      const events = changes.events || [];

      // Check if webhook is subscribed to this event
      if (events.includes(eventId)) {
        const webhookUrl = changes.url;
        const startTime = Date.now();

        const payload = {
          event: eventId,
          data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id
        };
        const payloadString = JSON.stringify(payload);
        const signature = changes.secret
          ? crypto.createHmac('sha256', changes.secret).update(payloadString).digest('hex')
          : null;

        const maxAttempts = 3;
        let delivered = false;
        let lastError: string | null = null;
        let lastStatusCode: number | null = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await axios.post(webhookUrl, payload, {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Event': eventId,
                'X-Webhook-Attempt': String(attempt),
                ...(signature ? { 'X-Webhook-Signature': `sha256=${signature}` } : {})
              }
            });

            delivered = true;
            lastStatusCode = response.status;

            await prisma.auditLog.create({
              data: {
                adminId: webhook.adminId,
                action: 'webhook_delivered',
                resourceType: 'webhook',
                resourceId: webhook.id,
                description: `Webhook delivered: ${eventId}`,
                changes: {
                  event: eventId,
                  status: 'success',
                  response_code: response.status,
                  attempt,
                  duration_ms: Date.now() - startTime
                } as any
              }
            });
            break;
          } catch (error: any) {
            lastError = error.message;
            lastStatusCode = error.response?.status ?? null;

            if (attempt < maxAttempts) {
              const backoffMs = 500 * Math.pow(2, attempt - 1);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
          }
        }

        if (!delivered) {
          logger.error('Webhook delivery failed', {
            url: webhookUrl,
            event: eventId,
            statusCode: lastStatusCode,
            error: lastError
          });

          await prisma.auditLog.create({
            data: {
              adminId: webhook.adminId,
              action: 'webhook_failed',
              resourceType: 'webhook',
              resourceId: webhook.id,
              description: `Webhook delivery failed: ${eventId}`,
              changes: {
                event: eventId,
                status: 'failed',
                response_code: lastStatusCode,
                error: lastError,
                attempts: maxAttempts,
                duration_ms: Date.now() - startTime
              } as any
            }
          });
        }
      }
    }
  } catch (error: any) {
    logger.error('Broadcast Webhook Event Error', { error: error.message, stack: error.stack });
  }
};
