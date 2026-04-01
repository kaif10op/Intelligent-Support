/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent response format
 * Should be registered LAST in middleware chain
 */

import type { Express, Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function registerErrorHandler(app: Express) {
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not found',
      code: 'NOT_FOUND',
      statusCode: 404,
      path: req.path,
    });
  });

  // Global error handler
  app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    // Log error
    if (err instanceof AppError) {
      logger.warn(`AppError: ${err.code}`, {
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }

    // Handle AppError
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        statusCode: err.statusCode,
        ...(err.details && { details: err.details }),
      });
    }

    // Handle other errors
    const statusCode = (err as any).statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

    res.status(statusCode).json({
      error: message,
      code: 'INTERNAL_ERROR',
      statusCode,
    });
  });
}
