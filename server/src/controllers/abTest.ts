import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.js';
import { prisma } from '../prisma.js';

/**
 * A/B Test management for AI prompt optimization
 * Allows admins to test different prompts and track which performs better
 */

/**
 * Create a new A/B test
 * POST /api/ab-tests
 */
export const createABTest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, variant_a, variant_b, metric_type, status } = req.body;

    if (!name || !variant_a || !variant_b || !metric_type) {
      return res.status(400).json({
        error: 'name, variant_a, variant_b, and metric_type are required'
      });
    }

    // Store A/B test as audit log with custom metadata
    const abTest = await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'ab_test_created',
        resourceType: 'ab_test',
        description: description || `A/B Test: ${name}`,
        changes: {
          test_name: name,
          variant_a,
          variant_b,
          metric_type,
          status: status || 'active',
          created_at: new Date().toISOString(),
          results: { a_count: 0, b_count: 0, a_score: 0, b_score: 0 }
        } as any
      }
    });

    res.status(201).json({
      success: true,
      test_id: abTest.id,
      name,
      variant_a,
      variant_b,
      metric_type,
      status: status || 'active'
    });
  } catch (error) {
    console.error('Create AB Test Error:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
};

/**
 * Record an A/B test result
 * POST /api/ab-tests/:testId/record
 */
export const recordABTestResult = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { variant, score, metadata } = req.body;

    if (!variant) {
      return res.status(400).json({ error: 'variant (a or b) is required' });
    }

    if (variant !== 'a' && variant !== 'b') {
      return res.status(400).json({ error: 'variant must be either a or b' });
    }

    // Get the test
    const test = await prisma.auditLog.findUnique({
      where: { id: testId as string }
    });

    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (test.action !== 'ab_test_created') {
      return res.status(400).json({ error: 'Invalid A/B test' });
    }

    const changes = test.changes as any || {};
    const results = changes.results || { a_count: 0, b_count: 0, a_score: 0, b_score: 0 };

    // Update results
    if (variant === 'a') {
      results.a_count += 1;
      results.a_score += score || 0;
    } else {
      results.b_count += 1;
      results.b_score += score || 0;
    }

    // Update test with new results
    await prisma.auditLog.update({
      where: { id: testId as string },
      data: {
        changes: {
          ...changes,
          results,
          last_recorded: new Date().toISOString(),
          recorded_metadata: metadata
        } as any
      }
    });

    res.json({
      success: true,
      message: `Result recorded for variant ${variant.toUpperCase()}`,
      results: {
        variant,
        total_variant_a: results.a_count,
        total_variant_b: results.b_count,
        avg_score_a: results.a_count > 0 ? (results.a_score / results.a_count).toFixed(2) : 0,
        avg_score_b: results.b_count > 0 ? (results.b_score / results.b_count).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Record AB Test Result Error:', error);
    res.status(500).json({ error: 'Failed to record A/B test result' });
  }
};

/**
 * Get A/B test results
 * GET /api/ab-tests/:testId/results
 */
export const getABTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;

    const test = await prisma.auditLog.findUnique({
      where: { id: testId as string }
    });

    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    const changes = test.changes as any || {};
    const results = changes.results || { a_count: 0, b_count: 0, a_score: 0, b_score: 0 };

    const totalTests = results.a_count + results.b_count;
    const avgScoreA = results.a_count > 0 ? results.a_score / results.a_count : 0;
    const avgScoreB = results.b_count > 0 ? results.b_score / results.b_count : 0;

    // Determine winner (highest average score)
    let winner = 'tie';
    if (avgScoreA > avgScoreB) winner = 'a';
    else if (avgScoreB > avgScoreA) winner = 'b';

    // Calculate confidence (based on sample size)
    const confidence = Math.min(
      Math.round((totalTests / 100) * 100),
      100
    );

    res.json({
      test_id: testId,
      name: changes.test_name || 'Unknown',
      metric_type: changes.metric_type || 'unknown',
      status: changes.status || 'active',
      results: {
        total_tests: totalTests,
        variant_a: {
          count: results.a_count,
          average_score: avgScoreA.toFixed(2),
          percentage: totalTests > 0 ? ((results.a_count / totalTests) * 100).toFixed(1) : 0
        },
        variant_b: {
          count: results.b_count,
          average_score: avgScoreB.toFixed(2),
          percentage: totalTests > 0 ? ((results.b_count / totalTests) * 100).toFixed(1) : 0
        },
        winner,
        confidence: `${confidence}%`,
        recommendation:
          confidence < 30
            ? 'Insufficient data (run more tests)'
            : winner === 'tie'
            ? 'No clear winner yet'
            : `Variant ${winner.toUpperCase()} is ${Math.abs(avgScoreA - avgScoreB).toFixed(2)} points better`
      },
      created_at: test.createdAt,
      last_recorded: changes.last_recorded || null
    });
  } catch (error) {
    console.error('Get AB Test Results Error:', error);
    res.status(500).json({ error: 'Failed to fetch A/B test results' });
  }
};

/**
 * List all active A/B tests
 * GET /api/ab-tests?status=active
 */
export const listABTests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status = 'active', limit = 20 } = req.query;

    const tests = await prisma.auditLog.findMany({
      where: {
        action: 'ab_test_created',
        changes: {
          path: ['status'],
          string_contains: status
        } as any
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    const formattedTests = tests.map(t => {
      const changes = t.changes as any || {};
      const results = changes.results || { a_count: 0, b_count: 0, a_score: 0, b_score: 0 };
      const totalTests = results.a_count + results.b_count;
      const avgScoreA = results.a_count > 0 ? results.a_score / results.a_count : 0;
      const avgScoreB = results.b_count > 0 ? results.b_score / results.b_count : 0;

      return {
        id: t.id,
        name: changes.test_name,
        metric_type: changes.metric_type,
        status: changes.status,
        total_tests: totalTests,
        variant_a_avg: avgScoreA.toFixed(2),
        variant_b_avg: avgScoreB.toFixed(2),
        winner: avgScoreA > avgScoreB ? 'a' : avgScoreB > avgScoreA ? 'b' : 'tie',
        created_at: t.createdAt
      };
    });

    res.json({
      tests: formattedTests,
      count: formattedTests.length
    });
  } catch (error) {
    console.error('List AB Tests Error:', error);
    res.status(500).json({ error: 'Failed to list A/B tests' });
  }
};

/**
 * Complete an A/B test and apply winner
 * POST /api/ab-tests/:testId/apply-winner
 */
export const applyABTestWinner = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { testId } = req.params;

    const test = await prisma.auditLog.findUnique({
      where: { id: testId as string }
    });

    if (!test) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    const changes = test.changes as any || {};
    const results = changes.results || { a_count: 0, b_count: 0, a_score: 0, b_score: 0 };

    const avgScoreA = results.a_count > 0 ? results.a_score / results.a_count : 0;
    const avgScoreB = results.b_count > 0 ? results.b_score / results.b_count : 0;
    const winner = avgScoreA > avgScoreB ? 'a' : avgScoreB > avgScoreA ? 'b' : null;

    if (!winner) {
      return res.status(400).json({ error: 'No clear winner detected' });
    }

    // Mark test as completed
    await prisma.auditLog.update({
      where: { id: testId as string },
      data: {
        changes: {
          ...changes,
          status: 'completed',
          winner_variant: winner,
          applied_at: new Date().toISOString()
        } as any
      }
    });

    // Log the application of winner
    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'ab_test_winner_applied',
        resourceType: 'ab_test',
        description: `Applied variant ${winner.toUpperCase()} from test: ${changes.test_name}`,
        changes: {
          test_id: testId,
          winner: winner,
          variant_text: winner === 'a' ? changes.variant_a : changes.variant_b
        } as any
      }
    });

    res.json({
      success: true,
      message: `Applied variant ${winner.toUpperCase()} as the winner`,
      test_id: testId,
      winner,
      stats: {
        variant_a_avg: avgScoreA.toFixed(2),
        variant_b_avg: avgScoreB.toFixed(2),
        improvement: Math.abs(avgScoreA - avgScoreB).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Apply AB Test Winner Error:', error);
    res.status(500).json({ error: 'Failed to apply A/B test winner' });
  }
};
