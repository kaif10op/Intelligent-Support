/**
 * Email notification service
 * For development: uses console logging
 * For production: integrate with Sendgrid/Mailgun
 */

import { logger } from './logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Send email notification
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (isDevelopment) {
      logger.info('Development Mode - Email would be sent', {
        to: options.to,
        subject: options.subject,
        bodyPreview: options.text || options.html.substring(0, 100)
      });
      return true;
    }

    // In production, integrate with Sendgrid or similar
    // Example: await sgMail.send(options);
    logger.info('Production mode - implement email service');
    return true;
  } catch (error: any) {
    logger.error('Email send error', { error: error.message, stack: error.stack });
    return false;
  }
};

/**
 * Ticket reply notification email
 */
export const sendTicketReplyEmail = async (
  userEmail: string,
  ticketTitle: string,
  adminName: string,
  replyPreview: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8a2be2 0%, #00d2ff 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Reply</h1>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #eee;">
        <p>Hello,</p>
        <p><strong>${adminName}</strong> has replied to your ticket:</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #333;">${ticketTitle}</h3>
          <p style="color: #666; margin: 0;">${replyPreview}...</p>
        </div>

        <p style="color: #666;">Please log in to view the full reply and respond if needed.</p>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated email from our support system. Please do not reply to this email.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Reply to your ticket: ${ticketTitle}`,
    html,
    text: `${adminName} replied to your ticket: ${ticketTitle}\n\n${replyPreview}`
  });
};

/**
 * Ticket status change notification
 */
export const sendTicketStatusChangedEmail = async (
  userEmail: string,
  ticketTitle: string,
  newStatus: string
): Promise<boolean> => {
  const statusEmoji: Record<string, string> = {
    OPEN: '🔴',
    IN_PROGRESS: '🟡',
    RESOLVED: '🟢',
    CLOSED: '⚫'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8a2be2 0%, #00d2ff 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Status Updated</h1>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #eee;">
        <p>Hello,</p>
        <p>Your ticket status has been updated:</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #8a2be2;">
          <h3 style="margin-top: 0; color: #333;">${ticketTitle}</h3>
          <p style="color: #666; font-size: 18px; margin: 0;">
            ${statusEmoji[newStatus] || '📌'} Status: <strong>${newStatus}</strong>
          </p>
        </div>

        <p style="color: #666;">Please log in to view more details about your ticket.</p>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated email from our support system.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Ticket status updated: ${ticketTitle}`,
    html,
    text: `Your ticket "${ticketTitle}" status is now: ${newStatus}`
  });
};

/**
 * Ticket assigned notification
 */
export const sendTicketAssignedEmail = async (
  userEmail: string,
  ticketTitle: string,
  adminName: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8a2be2 0%, #00d2ff 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Ticket Assigned</h1>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #eee;">
        <p>Hello,</p>
        <p>Your ticket has been assigned to <strong>${adminName}</strong>:</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin-top: 0; color: #333;">${ticketTitle}</h3>
          <p style="color: #666; margin: 0;">Your support specialist is now reviewing your issue.</p>
        </div>

        <p style="color: #666;">You should expect a response within 24 hours. Thank you for your patience!</p>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated email from our support system.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Your ticket has been assigned: ${ticketTitle}`,
    html,
    text: `Your ticket "${ticketTitle}" has been assigned to ${adminName}.`
  });
};

export default {
  sendEmail,
  sendTicketReplyEmail,
  sendTicketStatusChangedEmail,
  sendTicketAssignedEmail
};
