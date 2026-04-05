/**
 * Human-in-Loop Chat Controller
 */

import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Support agent or admin sends a human message
 */
export const addHumanMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user!.id;
    const userName = req.user!.name || 'Support Agent';
    const userRole = req.user!.role;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (userRole !== 'SUPPORT_AGENT' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only support agents and admins can send messages' });
    }

    const chat = await (prisma as any).chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const humanMessage = await (prisma as any).message.create({
      data: {
        role: 'human',
        content: message.trim(),
        chatId: chatId as string,
        userId,
        senderName: userName,
        senderRole: userRole
      }
    });

    logger.info('Human message sent', { chatId, userId, userRole });
    res.json({ success: true, message: humanMessage });
  } catch (error: any) {
    logger.error('Add human message error', { error: error.message });
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Customer requests human assistance for an AI chat
 */
export const requestHumanHandoff = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { reason } = req.body;

    const chat = await prisma.chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const canRequest = chat.userId === req.user!.id || req.user!.role === 'ADMIN' || req.user!.role === 'SUPPORT_AGENT';
    if (!canRequest) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const currentMetadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? (chat as any).metadata
      : {};

    const updatedChat = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        metadata: {
          ...currentMetadata,
          humanHandoffRequested: true,
          handoffRequestedAt: new Date().toISOString(),
          handoffRequestedBy: req.user!.id,
          handoffReason: reason || 'Customer requested human support'
        }
      }
    });

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Human support requested${reason ? `: ${reason}` : ''}`,
        senderName: 'System',
        senderRole: 'SYSTEM'
      }
    });

    logger.info('Human handoff requested', { chatId, requestedBy: req.user!.id });
    res.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    logger.error('Request human handoff error', { error: error.message });
    res.status(500).json({ error: 'Failed to request human handoff' });
  }
};

/**
 * Support agent requests AI assistance
 */
export const generateAgentAssistance = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { context, mode = 'draft_reply' } = req.body;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only support agents and admins can use this' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 5 } }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const recentConversation = (chat.messages || [])
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(-1500);

    const mergedContext = context || recentConversation || 'No conversation context available.';
    const outputByMode: Record<string, string> = {
      draft_reply: `Suggested response draft:\nI understand your concern. Thanks for explaining the issue. Based on your message, here are the exact steps we should try next, and I will stay with you until this is resolved.`,
      summary: `Conversation summary:\n${mergedContext}`,
      sentiment: `Sentiment analysis:\nCustomer tone appears neutral to concerned.\nRecommendation: acknowledge impact, reassure ownership, provide concrete ETA.`,
      next_steps: `Recommended next steps:\n1) Confirm issue scope and impact\n2) Validate account/environment details\n3) Apply fix or workaround\n4) Confirm customer outcome\n5) Offer escalation path if unresolved`,
      escalation_check: `Escalation check:\nEscalate if issue is security-sensitive, revenue-impacting, repeated after fix, or blocked by engineering dependency.`,
      root_cause: `Root cause hypotheses:\n1) Configuration mismatch\n2) Missing dependency/state sync\n3) Role/permission inconsistency\n4) Intermittent backend timeout\nUse logs + recent deploy diff to validate.`,
      priority_assessment: `Priority recommendation:\nSet HIGH if customer is blocked from core workflow, affects multiple users, or has SLA risk.\nOtherwise set MEDIUM with active monitoring.`,
      sla_risk: `SLA risk view:\nRisk is elevated if first response > target window or no owner assigned.\nAction: assign immediately and post a progress update.`,
      response_tone: `Tone improvement:\nUse empathetic, concise wording.\nTemplate: “I understand how this impacts your work. I’ve started investigating and here is the immediate next step…”`,
      knowledge_gaps: `Knowledge base gaps detected:\n- Missing troubleshooting checklist for this pattern\n- Missing known-issues entry\n- Missing escalation criteria\nRecommend adding article after resolution.`,
      followup_questions: `Suggested follow-up questions:\n1) When did this start?\n2) Is it reproducible consistently?\n3) Any recent account/config changes?\n4) Exact error text or screenshot?\n5) Affected users or scope?`,
      resolution_plan: `Resolution plan:\n1) Triage and reproduce\n2) Apply shortest safe workaround\n3) Validate with customer\n4) Document root cause\n5) Publish KB update and close with summary`,
      concise_reply: `Concise reply:\nThanks for reporting this. I can help now. Please share the exact error text and when it started so I can resolve this quickly.`,
      empathetic_reply: `Empathetic reply:\nI’m sorry this disrupted your work. I’m taking ownership and will guide you step-by-step until we get this fixed.`,
      deescalation_reply: `De-escalation reply:\nI understand this is frustrating. Let’s stabilize this first with a quick workaround, then I’ll provide a full fix and final update.`,
      executive_summary: `Executive summary:\nIssue impact, current status, owner, risk level, and immediate next action in one paragraph for leadership visibility.`,
      intent_detection: `Intent detection:\nPrimary intent appears to be issue resolution. Secondary intent may include urgency reassurance and ETA clarity.`,
      blocker_identification: `Blocker identification:\nLikely blockers: missing permissions, unavailable dependency, environment mismatch, or unresolved upstream incident.`,
      verification_steps: `Verification checklist:\n1) Reproduce issue\n2) Apply change\n3) Validate expected behavior\n4) Confirm with customer\n5) Record evidence`,
      workaround_generation: `Workaround options:\n- Temporary permission override\n- Alternate workflow path\n- Retry with safe reset sequence\n- Roll back recent risky change`,
      bug_report_draft: `Bug report draft:\nTitle, reproducible steps, expected vs actual result, environment, logs, impact, and urgency classification.`,
      incident_update: `Incident status update:\nWe identified the issue scope, mitigation is in progress, and next update will include root cause and permanent fix.`,
      action_items: `Action items:\n- Assign owner\n- Confirm customer impact\n- Execute workaround\n- Validate fix\n- Publish closure summary`,
      customer_update_short: `Customer update (short):\nQuick update: we’re actively working on your issue, have identified likely cause, and will share the next progress update shortly.`,
      customer_update_detailed: `Customer update (detailed):\nWe reproduced the problem, isolated probable cause, and started remediation. Current ETA is based on validation status; we’ll confirm exact closure timing next.`,
      rca_template: `RCA template:\n1) What happened\n2) Why it happened\n3) Detection gaps\n4) Corrective actions\n5) Preventive controls`,
      policy_compliance_check: `Policy compliance check:\nVerify data handling, authorization scope, escalation policy, audit trail, and communication standards are followed.`,
      refund_eligibility_check: `Refund/credit eligibility check:\nAssess SLA breach, service impact duration, policy terms, and prior compensation history before proposing credits.`,
      upsell_opportunity: `Upsell opportunity signal:\nIf issue reveals missing feature fit, suggest a relevant plan/add-on only after resolution and customer recovery.`,
      churn_risk_assessment: `Churn risk assessment:\nRisk rises with repeated incidents, delayed response, and unclear ownership. Counter with proactive updates and fast resolution.`,
      language_simplify: `Language simplify:\nUse plain, non-technical wording. Replace jargon with direct, step-based guidance customers can execute quickly.`,
      translation_ready: `Translation-ready rewrite:\nShort sentences, unambiguous terms, and locale-neutral phrasing for easier translation and consistent meaning.`,
      qa_test_scenarios: `QA test scenarios:\nHappy path, permission edge case, timeout case, stale session case, and recovery validation after reconnect.`,
      kb_article_draft: `KB article draft:\nProblem statement, symptoms, root causes, fix steps, verification checklist, and escalation guidance.`,
      handoff_note: `Handoff note:\nCurrent status, attempted fixes, customer sentiment, pending actions, and exact next owner action for smooth transfer.`,
      staffing_recommendation: `Staffing recommendation:\nAssign to specialist if repeat incident pattern, high business impact, or complexity exceeds frontline scope.`,
      time_to_resolve_estimate: `Time-to-resolve estimate:\nInitial estimate depends on reproduction + validation. Provide risk-adjusted ETA with checkpoint updates.`,
      confidence_score: `Confidence estimate:\nCurrent confidence is moderate until validation evidence confirms root cause and durable fix.`,
      risk_matrix: `Risk matrix:\nLikelihood: medium. Impact: medium to high if unresolved. Mitigation: prioritize ownership, workaround, and transparent updates.`,
      closure_checklist: `Closure checklist:\nIssue resolved, customer confirmed, documentation updated, follow-up scheduled, and prevention action logged.`
    };

    const suggestion = outputByMode[mode] || outputByMode.draft_reply;

    logger.info('AI assistance generated', { chatId });
    res.json({ success: true, suggestion, mode, supportedModes: Object.keys(outputByMode) });
  } catch (error: any) {
    logger.error('Generate assistance error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate assistance' });
  }
};

/**
 * Support agent/admin takes ownership of an active chat
 */
export const takeOverChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const chat = await (prisma as any).chat.findUnique({ where: { id: chatId as string } });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const currentMetadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? (chat as any).metadata
      : {};

    const updatedChat = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        assignedAgentId: req.user!.id,
        metadata: {
          ...currentMetadata,
          humanHandoffRequested: false,
          takenOverAt: new Date().toISOString(),
          takenOverBy: req.user!.id
        }
      }
    });

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `${req.user!.name || 'Support agent'} has joined and taken over this chat.`,
        senderName: 'System',
        senderRole: 'SYSTEM'
      }
    });

    logger.info('Chat taken over by human agent', { chatId, agentId: req.user!.id });
    res.json({ success: true, chat: updatedChat });
  } catch (error: any) {
    logger.error('Takeover error', { error: error.message });
    res.status(500).json({ error: 'Failed to take over chat' });
  }
};

/**
 * Transfer chat to another support agent
 */
export const transferChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, targetAgentId } = req.params;
    const { reason } = req.body;

    if (req.user!.role !== 'SUPPORT_AGENT' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [chat, targetAgent] = await Promise.all([
      prisma.chat.findUnique({ where: { id: chatId as string } }),
      prisma.user.findUnique({ where: { id: targetAgentId as string } })
    ]);

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!targetAgent) return res.status(404).json({ error: 'Agent not found' });

    const agentName = targetAgent.name || targetAgent.email;

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Transferred to ${agentName}. Reason: ${reason || 'N/A'}`,
        senderName: 'System'
      }
    });

    const updated = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: { assignedAgentId: targetAgentId as string }
    });

    logger.info('Chat transferred', { chatId, toAgent: targetAgentId });
    res.json({ success: true, chat: updated });
  } catch (error: any) {
    logger.error('Transfer error', { error: error.message });
    res.status(500).json({ error: 'Failed to transfer' });
  }
};

/**
 * Get handoff and assignment status for chat visibility in UI
 */
export const getHumanHandoffStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const chat = await (prisma as any).chat.findUnique({
      where: { id: chatId as string },
      include: { assignedAgent: true }
    });

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const canAccess = chat.userId === req.user!.id || req.user!.role === 'SUPPORT_AGENT' || req.user!.role === 'ADMIN';
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const metadata = (chat as any)?.metadata && typeof (chat as any).metadata === 'object'
      ? ((chat as any).metadata as Record<string, unknown>)
      : {};
    res.json({
      chatId: chat.id,
      assignedAgent: (chat as any).assignedAgent || null,
      handoffRequested: Boolean(metadata.humanHandoffRequested),
      handoffRequestedAt: metadata.handoffRequestedAt || null,
      handoffReason: metadata.handoffReason || null,
      takenOverAt: metadata.takenOverAt || null
    });
  } catch (error: any) {
    logger.error('Get handoff status error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch handoff status' });
  }
};

/**
 * Get chat transcript
 */
export const getChatTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId as string },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const canAccess = chat.userId === req.user!.id || req.user!.role === 'SUPPORT_AGENT' || req.user!.role === 'ADMIN';
    if (!canAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      chatId,
      createdAt: chat.createdAt,
      messageCount: chat.messages.length,
      messages: chat.messages.map((m: any) => ({
        timestamp: m.createdAt,
        sender: m.senderName || (m.role === 'assistant' ? 'AI' : 'Customer'),
        role: m.role,
        message: m.content
      }))
    });
  } catch (error: any) {
    logger.error('Transcript error', { error: error.message });
    res.status(500).json({ error: 'Failed to get transcript' });
  }
};

/**
 * Close chat
 */
export const closeChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { summary, satisfaction } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId as string } });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const closedByName = req.user!.name || 'Support Agent';

    await (prisma as any).message.create({
      data: {
        chatId: chatId as string,
        role: 'system',
        content: `Closed by ${closedByName}${summary ? '. ' + summary : ''}`,
        senderName: 'System'
      }
    });

    const closed = await (prisma as any).chat.update({
      where: { id: chatId as string },
      data: {
        isClosed: true,
        closedAt: new Date(),
        closedBy: req.user!.id,
        metadata: { summary, satisfaction }
      }
    });

    logger.info('Chat closed', { chatId });
    res.json({ success: true, chat: closed });
  } catch (error: any) {
    logger.error('Close error', { error: error.message });
    res.status(500).json({ error: 'Failed to close chat' });
  }
};
