/**
 * Role-Based AI Tools Service
 * Provides different AI tools based on user role for enhanced functionality
 */

import { DynamicTool } from '@langchain/core/tools';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export class RoleBasedToolsService {
  /**
   * Get AI tools based on user role
   * Supports: USER, SUPPORT_AGENT, ADMIN
   */
  static getToolsByRole(
    role: string,
    userId: string,
    kbId: string
  ): DynamicTool[] {
    const tools: DynamicTool[] = [];

    if (role === 'USER') {
      // Users get basic tools
      tools.push(this.getSuggestionTool());
    } else if (role === 'SUPPORT_AGENT') {
      // Support agents get enhanced tools
      tools.push(this.getCustomerHistoryTool(userId));
      tools.push(this.getTicketHistoryTool(userId));
      tools.push(this.getKBManagementTool(kbId));
      tools.push(this.getAISuggestionTool(userId));
      tools.push(this.getTransferTool());
    } else if (role === 'ADMIN') {
      // Admins get all tools
      tools.push(this.getCustomerHistoryTool(userId));
      tools.push(this.getTicketHistoryTool(userId));
      tools.push(this.getKBManagementTool(kbId));
      tools.push(this.getAISuggestionTool(userId));
      tools.push(this.getTransferTool());
      tools.push(this.getSystemMetricsTool());
      tools.push(this.getUserManagementTool());
    }

    return tools;
  }

  /**
   * Get customer conversation history
   * For support agents and admins
   */
  private static getCustomerHistoryTool(userId: string): DynamicTool {
    return new DynamicTool({
      name: 'get_customer_history',
      description: 'Get customer previous conversations and chat history',
      func: async (customerId: string) => {
        try {
          const chats = await prisma.chat.findMany({
            where: { userId: customerId },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            },
            take: 3,
            orderBy: { createdAt: 'desc' }
          });

          if (chats.length === 0) return 'No previous chat history found for this customer.';

          return chats.map(c => ({
            date: c.createdAt.toLocaleDateString(),
            kb: c.kbId,
            messageCount: c.messages.length,
            lastMessage: c.messages[0]?.content.slice(0, 100)
          })).map(c => `${c.date}: ${c.lastMessage}...`).join('\n');
        } catch (err: any) {
          logger.error('Customer history tool error', { error: err.message });
          return 'Unable to retrieve customer history.';
        }
      }
    });
  }

  /**
   * Get ticket history for this customer
   * Shows open and recent tickets
   */
  private static getTicketHistoryTool(userId: string): DynamicTool {
    return new DynamicTool({
      name: 'get_ticket_history',
      description: 'View customer support tickets (open and recent)',
      func: async (customerId: string) => {
        try {
          const tickets = await prisma.ticket.findMany({
            where: { userId: customerId },
            orderBy: { createdAt: 'desc' },
            take: 5
          });

          if (tickets.length === 0) return 'No tickets found for this customer.';

          return tickets.map(t => ({
            id: t.id.slice(0, 8),
            title: t.title,
            status: t.status,
            priority: t.priority,
            created: t.createdAt.toLocaleDateString()
          })).map(t => `[${t.status}] ${t.title} (Priority: ${t.priority})`).join('\n');
        } catch (err: any) {
          logger.error('Ticket history tool error', { error: err.message });
          return 'Unable to retrieve ticket history.';
        }
      }
    });
  }

  /**
   * Knowledge base management for agents
   * View and search KB documents
   */
  private static getKBManagementTool(kbId: string): DynamicTool {
    return new DynamicTool({
      name: 'manage_knowledge_base',
      description: 'Search and manage knowledge base documents',
      func: async (query: string) => {
        try {
          const kb = await prisma.knowledgeBase.findUnique({
            where: { id: kbId },
            include: {
              documents: {
                take: 5,
                orderBy: { createdAt: 'desc' }
              }
            }
          });

          if (!kb) return 'Knowledge base not found.';

          return `KB: ${kb.title}\nDocuments: ${kb.documents.map(d => d.filename).join(', ')}`;
        } catch (err: any) {
          logger.error('KB management tool error', { error: err.message });
          return 'Unable to access knowledge base.';
        }
      }
    });
  }

  /**
   * AI suggestion tool for support agents
   * Get AI-generated response suggestions
   */
  private static getAISuggestionTool(userId: string): DynamicTool {
    return new DynamicTool({
      name: 'get_ai_suggestion',
      description: 'Get AI-generated response suggestion for customer query',
      func: async (query: string) => {
        try {
          // In production, this would call your LLM to generate suggestions
          // For now, return a placeholder
          return `AI Suggestion: Consider addressing:\n- Customer concern about: ${query.slice(0, 50)}...\n- Relevant KB section: General troubleshooting`;
        } catch (err: any) {
          logger.error('AI suggestion tool error', { error: err.message });
          return 'Unable to generate suggestion.';
        }
      }
    });
  }

  /**
   * Transfer to another agent or escalate
   * For support team coordination
   */
  private static getTransferTool(): DynamicTool {
    return new DynamicTool({
      name: 'transfer_ticket',
      description: 'Mark ticket for transfer to another agent or escalate to admin',
      func: async (escalationType: string) => {
        try {
          // This would integrate with ticket system
          if (escalationType.toLowerCase().includes('admin')) {
            return 'Ticket marked for admin escalation. Admin will be notified.';
          }
          return 'Ticket marked for reassignment to another agent.';
        } catch (err: any) {
          logger.error('Transfer tool error', { error: err.message });
          return 'Unable to transfer ticket.';
        }
      }
    });
  }

  /**
   * System metrics for admins
   * Real-time system health and statistics
   */
  private static getSystemMetricsTool(): DynamicTool {
    return new DynamicTool({
      name: 'get_system_metrics',
      description: 'View real-time system metrics and health statistics',
      func: async (metric: string) => {
        try {
          const [userCount, ticketCount, chatCount] = await Promise.all([
            prisma.user.count(),
            (prisma as any).ticket.count(),
            prisma.chat.count()
          ]);

          return `System Metrics:\n- Users: ${userCount}\n- Tickets: ${ticketCount}\n- Chats: ${chatCount}`;
        } catch (err: any) {
          logger.error('System metrics tool error', { error: err.message });
          return 'Unable to retrieve system metrics.';
        }
      }
    });
  }

  /**
   * User management for admins
   * Quick access to user operations
   */
  private static getUserManagementTool(): DynamicTool {
    return new DynamicTool({
      name: 'manage_users',
      description: 'Manage users and roles (admin only)',
      func: async (action: string) => {
        try {
          if (action.toLowerCase().includes('list')) {
            const users = await prisma.user.findMany({ take: 5 });
            return `Active Users: ${users.length}\nRecent: ${users.map(u => u.name).join(', ')}`;
          }
          return 'User management available. Specify action: list, role-update, disable';
        } catch (err: any) {
          logger.error('User management tool error', { error: err.message });
          return 'Unable to access user management.';
        }
      }
    });
  }

  /**
   * Basic suggestion tool for regular users
   */
  private static getSuggestionTool(): DynamicTool {
    return new DynamicTool({
      name: 'get_suggestions',
      description: 'Get suggestions for follow-up questions',
      func: async (topic: string) => {
        try {
          return `Suggested follow-up questions:\n- Can you tell me more about...?\n- Have you tried...?\n- When did this issue start?`;
        } catch (err: any) {
          logger.error('Suggestion tool error', { error: err.message });
          return 'Unable to generate suggestions.';
        }
      }
    });
  }
}
