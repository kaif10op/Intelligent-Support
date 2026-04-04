/**
 * Intelligent Ticket Assignment Service
 * Automatically assigns tickets to support agents based on workload and performance metrics
 */

import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

interface AgentMetrics {
  id: string;
  name: string;
  email: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number; // in hours
  loadScore: number; // 0-100 (lower is better)
  isAvailable: boolean;
}

interface ReassignmentResult {
  ticketId: string;
  oldAgentId: string | null;
  newAgentId: string;
  reason: string;
}

export class TicketAssignmentService {
  /**
   * Get all active support agents with metrics
   */
  static async getSupportAgentMetrics(): Promise<AgentMetrics[]> {
    try {
      const agents = await prisma.user.findMany({
        where: { role: 'SUPPORT_AGENT' },
        select: { id: true, name: true, email: true }
      });

      const metricsPromises = agents.map(async (agent) => {
        // Get assigned tickets
        const assignedTickets = await prisma.ticket.count({
          where: {
            assignedToId: agent.id,
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        });

        // Get resolved tickets (last 30 days)
        const resolvedTickets = await prisma.ticket.findMany({
          where: {
            assignedToId: agent.id,
            status: { in: ['RESOLVED', 'CLOSED'] },
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          select: { createdAt: true, updatedAt: true }
        });

        // Calculate average resolution time
        let avgResolutionTime = 0;
        if (resolvedTickets.length > 0) {
          const totalTime = resolvedTickets.reduce((acc, ticket) => {
            const time = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
            return acc + time;
          }, 0);
          avgResolutionTime = totalTime / resolvedTickets.length;
        }

        // Calculate load score (0-100, lower is better)
        const maxTickets = 15; // Consider 15 tickets as max load
        const ticketLoad = Math.min(100, (assignedTickets / maxTickets) * 50);
        const speedLoad = Math.min(100, (avgResolutionTime / 24) * 50); // 24 hours = 50 load score
        const loadScore = ticketLoad + speedLoad;

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          assignedTickets,
          resolvedTickets: resolvedTickets.length,
          avgResolutionTime,
          loadScore,
          isAvailable: assignedTickets < 10 // Consider available if < 10 tickets
        };
      });

      return Promise.all(metricsPromises);
    } catch (error: any) {
      logger.error('Error getting agent metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Find best agent for ticket assignment
   */
  static async findBestAgent(): Promise<AgentMetrics | null> {
    try {
      const metrics = await this.getSupportAgentMetrics();

      if (metrics.length === 0) return null;

      // Sort by load score (ascending - lower load = better)
      const sorted = metrics.sort((a, b) => a.loadScore - b.loadScore);

      logger.info('Agent ranking', {
        agents: sorted.map(a => ({
          name: a.name,
          tickets: a.assignedTickets,
          resolved: a.resolvedTickets,
          avgTime: `${a.avgResolutionTime.toFixed(1)}h`,
          loadScore: a.loadScore.toFixed(1)
        }))
      });

      return sorted[0];
    } catch (error: any) {
      logger.error('Error finding best agent', { error: error.message });
      return null;
    }
  }

  /**
   * Auto-assign unassigned tickets to best available agent
   */
  static async autoAssignUnassignedTickets(): Promise<{ assigned: number; errors: number }> {
    try {
      const unassignedTickets = await prisma.ticket.findMany({
        where: {
          assignedToId: null,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        orderBy: { createdAt: 'asc' }
      });

      let assigned = 0;
      let errors = 0;

      for (const ticket of unassignedTickets) {
        try {
          const bestAgent = await this.findBestAgent();
          if (!bestAgent) {
            logger.warn('No available support agents for ticket assignment', {
              ticketId: ticket.id
            });
            errors++;
            continue;
          }

          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              assignedToId: bestAgent.id,
              status: 'IN_PROGRESS'
            }
          });

          assigned++;
          logger.info('Ticket auto-assigned', {
            ticketId: ticket.id,
            agentId: bestAgent.id,
            agentName: bestAgent.name
          });
        } catch (err: any) {
          logger.error('Error assigning ticket', {
            ticketId: ticket.id,
            error: err.message
          });
          errors++;
        }
      }

      return { assigned, errors };
    } catch (error: any) {
      logger.error('Error in auto-assign process', { error: error.message });
      return { assigned: 0, errors: 1 };
    }
  }

  /**
   * Rebalance tickets among agents
   * - Move tickets from overloaded agents to available agents
   * - Prioritize tickets from slow agents to faster agents
   */
  static async rebalanceTickets(): Promise<ReassignmentResult[]> {
    try {
      const metrics = await this.getSupportAgentMetrics();
      const reassignments: ReassignmentResult[] = [];

      // Sort agents by load (ascending)
      const sortedAgents = metrics.sort((a, b) => a.loadScore - b.loadScore);

      // Find overloaded agents (top 30% by load)
      const overloadThreshold = sortedAgents.length > 2
        ? sortedAgents[Math.floor(sortedAgents.length * 0.7)].loadScore
        : Infinity;

      const overloadedAgents = sortedAgents.filter(a => a.loadScore > overloadThreshold);

      // For each overloaded agent, move their oldest open tickets to available agents
      for (const overloadedAgent of overloadedAgents) {
        const availableAgent = sortedAgents.find(
          a => a.id !== overloadedAgent.id && a.isAvailable
        );

        if (!availableAgent) continue;

        // Get oldest 2 open tickets from overloaded agent
        const ticketsToMove = await prisma.ticket.findMany({
          where: {
            assignedToId: overloadedAgent.id,
            status: 'OPEN'
          },
          orderBy: { createdAt: 'asc' },
          take: 2
        });

        for (const ticket of ticketsToMove) {
          try {
            await prisma.ticket.update({
              where: { id: ticket.id },
              data: { assignedToId: availableAgent.id }
            });

            reassignments.push({
              ticketId: ticket.id,
              oldAgentId: overloadedAgent.id,
              newAgentId: availableAgent.id,
              reason: `Rebalanced from overloaded agent ${overloadedAgent.name} to available agent ${availableAgent.name}`
            });

            logger.info('Ticket rebalanced', {
              ticketId: ticket.id,
              from: overloadedAgent.name,
              to: availableAgent.name,
              reason: 'Load balancing'
            });
          } catch (err: any) {
            logger.error('Error rebalancing ticket', {
              ticketId: ticket.id,
              error: err.message
            });
          }
        }
      }

      return reassignments;
    } catch (error: any) {
      logger.error('Error in rebalance process', { error: error.message });
      return [];
    }
  }

  /**
   * Reassign slow tickets to faster agents
   * Looks for tickets in progress for >12 hours and reassigns to faster agents
   */
  static async reassignSlowTickets(): Promise<ReassignmentResult[]> {
    try {
      const metrics = await this.getSupportAgentMetrics();
      const reassignments: ReassignmentResult[] = [];

      // Find slow tickets (in progress for > 12 hours)
      const slowThresholdTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const slowTickets = await prisma.ticket.findMany({
        where: {
          status: 'IN_PROGRESS',
          updatedAt: { lt: slowThresholdTime }
        },
        orderBy: { updatedAt: 'asc' },
        take: 5
      });

      for (const ticket of slowTickets) {
        // Find faster agents (with lower avg resolution time)
        const fasterAgents = metrics
          .filter(a => a.id !== ticket.assignedToId && a.isAvailable)
          .sort((a, b) => a.avgResolutionTime - b.avgResolutionTime);

        if (fasterAgents.length === 0) continue;

        const fasterAgent = fasterAgents[0];

        try {
          const oldAgentId = ticket.assignedToId;
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { assignedToId: fasterAgent.id }
          });

          reassignments.push({
            ticketId: ticket.id,
            oldAgentId,
            newAgentId: fasterAgent.id,
            reason: `Reassigned from slow agent (avg ${metrics.find(m => m.id === oldAgentId)?.avgResolutionTime.toFixed(1)}h) to faster agent ${fasterAgent.name} (avg ${fasterAgent.avgResolutionTime.toFixed(1)}h)`
          });

          logger.info('Slow ticket reassigned', {
            ticketId: ticket.id,
            oldAgent: oldAgentId,
            newAgent: fasterAgent.id,
            reason: 'Performance optimization'
          });
        } catch (err: any) {
          logger.error('Error reassigning slow ticket', {
            ticketId: ticket.id,
            error: err.message
          });
        }
      }

      return reassignments;
    } catch (error: any) {
      logger.error('Error reassigning slow tickets', { error: error.message });
      return [];
    }
  }

  /**
   * Get assignment statistics for admin dashboard
   */
  static async getAssignmentStats() {
    try {
      const agents = await this.getSupportAgentMetrics();

      const totalTickets = await prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
      });

      const totalResolved = await prisma.ticket.count({
        where: { status: { in: ['RESOLVED', 'CLOSED'] } }
      });

      const unassigned = await prisma.ticket.count({
        where: {
          assignedToId: null,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      });

      return {
        agents,
        totalTickets,
        totalResolved,
        unassigned,
        averageLoadScore: agents.reduce((sum, a) => sum + a.loadScore, 0) / (agents.length || 1),
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error('Error getting assignment stats', { error: error.message });
      throw error;
    }
  }
}
