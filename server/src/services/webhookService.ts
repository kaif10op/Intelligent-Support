import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

type WebhookEvent =
  | 'chat.created'
  | 'chat.message.created'
  | 'ticket.created'
  | 'ticket.status.changed'
  | 'feedback.submitted'
  | 'ticket.escalated';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

  /**
   * Emit a webhook event - broadcasts to all subscribed webhooks
   */
  static async emit(event: WebhookEvent, data: Record<string, any>) {
    try {
      // Get all active webhooks subscribed to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          active: true,
          events: { has: event },
        },
      });

      if (webhooks.length === 0) {
        return; // No webhooks subscribed
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      // Deliver to all webhooks (async, don't wait for response)
      webhooks.forEach(webhook => {
        this.deliverWebhook(webhook.id, payload).catch(err => {
          logger.error(`Webhook delivery failed for ${webhook.id}:`, err);
        });
      });
    } catch (error) {
      logger.error('Error emitting webhook event:', error);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private static async deliverWebhook(
    webhookId: string,
    payload: WebhookPayload,
    attempt: number = 0
  ) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        logger.warn(`Webhook not found: ${webhookId}`);
        return;
      }

      // Create delivery record
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: payload.event,
          payload: payload as any,
          status: 'pending',
          attempts: attempt + 1,
        },
      });

      // Build request with optional signature
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      headers['X-Webhook-Delivery-Id'] = delivery.id;

      // Send webhook
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const success = response.ok;

      // Update delivery status
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: success ? 'delivered' : 'failed',
          responseCode: response.status,
          lastError: success ? null : `HTTP ${response.status}`,
        },
      });

      if (success) {
        logger.info(`Webhook delivered: ${webhookId} (${payload.event})`);
      } else if (attempt < this.MAX_RETRIES) {
        // Retry after delay
        const delay = this.RETRY_DELAYS[attempt] || 60000;
        setTimeout(
          () => this.deliverWebhook(webhookId, payload, attempt + 1),
          delay
        );
        logger.info(
          `Webhook retry scheduled: ${webhookId} (attempt ${attempt + 2}/${this.MAX_RETRIES})`
        );
      } else {
        logger.error(`Webhook delivery failed permanently: ${webhookId}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      const delivery = await prisma.webhookDelivery.findFirst({
        where: {
          webhookId,
          event: payload.event,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (delivery) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            lastError: errorMsg,
          },
        });
      }

      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[attempt] || 60000;
        setTimeout(
          () => this.deliverWebhook(webhookId, payload, attempt + 1),
          delay
        );
      }
    }
  }

  /**
   * Get webhook delivery history
   */
  static async getDeliveryHistory(webhookId: string, limit: number = 50) {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry failed webhook deliveries
   */
  static async retryFailedDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const payload: WebhookPayload = {
      event: delivery.event as WebhookEvent,
      timestamp: delivery.createdAt.toISOString(),
      data: delivery.payload as Record<string, any>,
    };

    // Reset delivery for retry
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'pending',
        attempts: delivery.attempts + 1,
        lastError: null,
      },
    });

    await this.deliverWebhook(delivery.webhookId, payload);
  }
}
