/**
 * Pagination helper utilities
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Parse pagination query parameters
 */
export const parsePaginationParams = (query: any): PaginationParams => {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 20;

  // Validate bounds
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(100, limit)); // Max 100 items per page

  return { page, limit };
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMetadata = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Format paginated response
 */
export const formatPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: getPaginationMetadata(total, page, limit)
  };
};

/**
 * Calculate skip and take for Prisma
 */
export const calculateSkipTake = (page: number, limit: number) => {
  return {
    skip: (page - 1) * limit,
    take: limit
  };
};
