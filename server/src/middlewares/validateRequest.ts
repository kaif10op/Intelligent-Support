import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, params, or query against a Zod schema
 * Returns 400 with field errors if validation fails
 */
export function validateRequest(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'params' ? req.params : req.query;

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          errors[path || 'root'] = issue.message;
        });

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: { errors },
        });
      }

      // Replace the source object with validated data
      if (source === 'body') req.body = result.data;
      else if (source === 'params') req.params = result.data;
      else if (source === 'query') req.query = result.data;

      next();
    } catch (err) {
      res.status(500).json({
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  };
}
