import PDFDocument from 'pdfkit';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export class PDFExportService {
  /**
   * Export a chat as PDF
   */
  static async exportChatPDF(chatId: string): Promise<Buffer> {
    try {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          kb: true,
          user: true,
        },
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Conversation Export', 50, 50);

        doc.fontSize(11).font('Helvetica').moveDown(0.5);

        // Metadata
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`KB: ${chat.kb.title}`)
          .text(`User: ${chat.user.name}`)
          .text(`Date: ${new Date(chat.createdAt).toLocaleString()}`)
          .text(`Messages: ${chat.messages.length}`)
          .moveDown(1);

        // Messages
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Conversation:', { underline: true })
          .moveDown(0.5);

        for (const message of chat.messages) {
          const role = message.role === 'user' ? 'You' : 'Assistant';
          const roleColor = message.role === 'user' ? '#0066cc' : '#00aa00';

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(roleColor)
            .text(`${role}:`)
            .fillColor('#000000');

          doc
            .fontSize(9)
            .font('Helvetica')
            .text(message.content, { align: 'left' });

          if (message.confidence !== undefined && message.confidence !== null) {
            doc
              .fontSize(8)
              .fillColor('#666666')
              .text(`[Confidence: ${(message.confidence * 100).toFixed(0)}%]`);
          }

          if (message.sources && Array.isArray(message.sources)) {
            doc
              .fontSize(8)
              .text(
                `Sources: ${(message.sources as any[])
                  .map((s: any) => s.filename || 'Unknown')
                  .join(', ')}`
              );
          }

          doc.moveDown(0.5);
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            `Export generated on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      });
    } catch (error) {
      logger.error('Error exporting chat to PDF:', error);
      throw error;
    }
  }

  /**
   * Export a ticket as PDF
   */
  static async exportTicketPDF(ticketId: string): Promise<Buffer> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          notes: { orderBy: { createdAt: 'asc' } },
          user: true,
          assignedTo: true,
          chat: true,
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Support Ticket Export', 50, 50);

        doc.fontSize(11).font('Helvetica').moveDown(0.5);

        // Ticket Info
        const statusColor =
          ticket.status === 'RESOLVED' ? '#00aa00' : '#ff6600';
        const priorityColor =
          ticket.priority === 'URGENT' ? '#ff0000' : '#0066cc';

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Ticket Information:', { underline: true })
          .moveDown(0.5);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`ID: ${ticket.id}`)
          .text(`Title: ${ticket.title}`)
          .text(`Description: ${ticket.description}`)
          .fillColor(statusColor)
          .text(`Status: ${ticket.status}`)
          .fillColor(priorityColor)
          .text(`Priority: ${ticket.priority}`)
          .fillColor('#000000')
          .text(`User: ${ticket.user.name}`)
          .text(
            `Assigned To: ${ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}`
          )
          .text(`Created: ${new Date(ticket.createdAt).toLocaleString()}`)
          .text(`Updated: ${new Date(ticket.updatedAt).toLocaleString()}`);

        if (ticket.dueAt) {
          doc.text(
            `Due: ${new Date(ticket.dueAt).toLocaleString()} ${
              ticket.isOverdue ? '(OVERDUE)' : ''
            }`
          );
        }

        doc.moveDown(1);

        // SLA Info
        if (ticket.slaBreach) {
          doc
            .fontSize(10)
            .fillColor('#ff0000')
            .font('Helvetica-Bold')
            .text('⚠ SLA BREACH', { underline: true })
            .fillColor('#000000');
          doc.moveDown(0.5);
        }

        // Notes
        if (ticket.notes.length > 0) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Conversation:', { underline: true })
            .moveDown(0.5);

          for (const note of ticket.notes) {
            const noteRole =
              note.role === 'user'
                ? `${ticket.user.name} (Customer)`
                : 'Support Team';
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text(noteRole)
              .fontSize(9)
              .font('Helvetica')
              .text(note.content);

            doc
              .fontSize(8)
              .fillColor('#666666')
              .text(new Date(note.createdAt).toLocaleString());

            doc.moveDown(0.5);
          }
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            `Export generated on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      });
    } catch (error) {
      logger.error('Error exporting ticket to PDF:', error);
      throw error;
    }
  }

  /**
   * Export analytics as PDF
   */
  static async exportAnalyticsPDF(
    analyticsData: Record<string, any>
  ): Promise<Buffer> {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Analytics Report', 50, 50);

        doc.fontSize(11).font('Helvetica').moveDown(0.5);

        // Date
        doc
          .fontSize(10)
          .text(`Generated: ${new Date().toLocaleString()}`)
          .moveDown(1);

        // Summary
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Summary', { underline: true })
          .moveDown(0.5);

        if (analyticsData.messageStats) {
          const stats = analyticsData.messageStats;
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(`Total Messages: ${stats.total}`)
            .text(`AI Responses: ${stats.aiCount} (${stats.aiPercentage}%)`)
            .text(`User Messages: ${stats.userCount} (${stats.userPercentage}%)`)
            .moveDown(0.5);
        }

        if (analyticsData.confidenceDist) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Confidence Distribution', { underline: true })
            .moveDown(0.5)
            .fontSize(9);

          const confDist = analyticsData.confidenceDist;
          Object.entries(confDist).forEach(([level, count]) => {
            doc.text(`${level}: ${count}`);
          });

          doc.moveDown(0.5);
        }

        if (analyticsData.feedbackStats) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Feedback Stats', { underline: true })
            .moveDown(0.5)
            .fontSize(9);

          const feedback = analyticsData.feedbackStats;
          doc
            .text(`Positive: ${feedback.positive}`)
            .text(`Negative: ${feedback.negative}`)
            .text(`Neutral: ${feedback.neutral}`);
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            `End of Report`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      });
    } catch (error) {
      logger.error('Error exporting analytics to PDF:', error);
      throw error;
    }
  }
}
