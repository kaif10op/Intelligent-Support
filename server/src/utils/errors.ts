/**
 * Centralized Error Handling
 * All errors should be thrown as AppError for consistent response format
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common error factory functions
export const errors = {
  badRequest: (message: string, details?: any) =>
    new AppError(400, message, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new AppError(401, message, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new AppError(403, message, 'FORBIDDEN'),

  notFound: (resource: string) =>
    new AppError(404, `${resource} not found`, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(409, message, 'CONFLICT'),

  validationError: (message: string, errors: any) =>
    new AppError(400, message, 'VALIDATION_ERROR', { errors }),

  internal: (message: string = 'Internal server error') =>
    new AppError(500, message, 'INTERNAL_ERROR'),

  notImplemented: () =>
    new AppError(501, 'Not implemented', 'NOT_IMPLEMENTED'),
};
