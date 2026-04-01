import { z } from 'zod';

// Auth Validators
export const googleAuthSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const logoutSchema = z.object({});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
