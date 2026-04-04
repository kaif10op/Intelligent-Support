import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

interface TagAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  issueType: string;
  confidence: number;
}

export class TagService {
  /**
   * Auto-tag a message based on content analysis
   */
  static async autoTagMessage(
    messageId: string,
    content: string,
    role: string
  ): Promise<void> {
    try {
      // Only analyze AI responses
      if (role !== 'assistant') {
        return;
      }

      const analysis = this.analyzeContent(content);

      const tags: Array<{
        tag: string;
        category: string;
        confidence: number;
      }> = [];

      // Sentiment tag
      tags.push({
        tag: analysis.sentiment,
        category: 'sentiment',
        confidence: analysis.confidence,
      });

      // Category tag
      tags.push({
        tag: analysis.category,
        category: 'category',
        confidence: analysis.confidence,
      });

      // Issue type tag
      tags.push({
        tag: analysis.issueType,
        category: 'issue_type',
        confidence: analysis.confidence,
      });

      // Create tags in database
      for (const tag of tags) {
        await prisma.conversationTag.create({
          data: {
            tag: tag.tag,
            category: tag.category,
            messageId,
            confidence: tag.confidence,
            source: 'ai_analysis',
          },
        });
      }

      logger.info(`Auto-tagged message ${messageId} with ${tags.length} tags`);
    } catch (error) {
      logger.error('Error auto-tagging message:', error);
    }
  }

  /**
   * Auto-tag a chat based on its conversation
   */
  static async autoTagChat(chatId: string): Promise<void> {
    try {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chat || chat.messages.length === 0) {
        return;
      }

      // Analyze overall conversation
      const fullContent = chat.messages
        .map(m => m.content)
        .join(' ');

      const analysis = this.analyzeContent(fullContent);

      // Create chat-level tags
      const tags: Array<{
        tag: string;
        category: string;
        confidence: number;
      }> = [
        {
          tag: analysis.sentiment,
          category: 'sentiment',
          confidence: analysis.confidence,
        },
        {
          tag: analysis.category,
          category: 'category',
          confidence: analysis.confidence,
        },
        {
          tag: analysis.issueType,
          category: 'issue_type',
          confidence: analysis.confidence,
        },
      ];

      for (const tag of tags) {
        await prisma.conversationTag.create({
          data: {
            tag: tag.tag,
            category: tag.category,
            chatId,
            confidence: tag.confidence,
            source: 'ai_analysis',
          },
        });
      }

      logger.info(`Auto-tagged chat ${chatId} with ${tags.length} tags`);
    } catch (error) {
      logger.error('Error auto-tagging chat:', error);
    }
  }

  /**
   * Analyze content for sentiment, category, and issue type
   */
  private static analyzeContent(content: string): TagAnalysis {
    const lowerContent = content.toLowerCase();

    // Sentiment analysis
    const positiveKeywords = [
      'thank',
      'great',
      'excellent',
      'perfect',
      'love',
      'amazing',
      'helpful',
      'satisfied',
      'resolved',
      'solved',
    ];
    const negativeKeywords = [
      'error',
      'fail',
      'broken',
      'issue',
      'problem',
      'bug',
      'crash',
      'not work',
      'frustrated',
      'upset',
    ];

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = 0.5;

    const posCount = positiveKeywords.filter(kw =>
      lowerContent.includes(kw)
    ).length;
    const negCount = negativeKeywords.filter(kw =>
      lowerContent.includes(kw)
    ).length;

    if (posCount > negCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + posCount * 0.1);
    } else if (negCount > posCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + negCount * 0.1);
    }

    // Category analysis
    const categories: Record<string, string[]> = {
      billing: [
        'charge',
        'payment',
        'invoice',
        'price',
        'cost',
        'refund',
        'subscription',
      ],
      technical: [
        'error',
        'bug',
        'crash',
        'slow',
        'lag',
        'not work',
        'feature',
        'api',
      ],
      account: [
        'login',
        'password',
        'account',
        'profile',
        'settings',
        'email',
        'verify',
      ],
      feature: [
        'how to',
        'guide',
        'tutorial',
        'feature',
        'can i',
        'request',
      ],
    };

    let category = 'general';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        category = cat;
        break;
      }
    }

    // Issue type analysis
    let issueType = 'simple_faq';

    if (lowerContent.length > 500 || negCount > 2) {
      issueType = 'complex';
    } else if (confidence < 0.4) {
      issueType = 'low_confidence';
    } else if (posCount > 0) {
      issueType = 'resolved';
    }

    return {
      sentiment,
      category,
      issueType,
      confidence,
    };
  }

  /**
   * Get tags for a chat
   */
  static async getTagsForChat(chatId: string) {
    return prisma.conversationTag.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get tags for a message
   */
  static async getTagsForMessage(messageId: string) {
    return prisma.conversationTag.findMany({
      where: { messageId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search chats by tag
   */
  static async searchByTag(
    userId: string,
    tag: string,
    limit: number = 20
  ) {
    const tags = await prisma.conversationTag.findMany({
      where: {
        tag: { contains: tag, mode: 'insensitive' },
        chat: { userId },
      },
      include: { chat: true },
      distinct: ['chatId'],
      take: limit,
    });

    return tags.map(t => t.chat).filter(Boolean);
  }

  /**
   * Get tag statistics
   */
  static async getTagStats() {
    const tags = await prisma.conversationTag.groupBy({
      by: ['tag', 'category'],
      _count: true,
    });

    return tags;
  }
}
