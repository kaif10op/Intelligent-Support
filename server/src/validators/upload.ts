import { z } from 'zod';

// File Upload Validators
export const uploadDocumentSchema = z.object({
  kbId: z.string().uuid('Invalid KB ID'),
  // File is validated in middleware, but we include it in the schema for type safety
  file: z.any().optional(), // multer adds this
});

export const fileMetadataSchema = z.object({
  filename: z.string().max(255, 'Filename too long'),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File size exceeds 10MB'),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
