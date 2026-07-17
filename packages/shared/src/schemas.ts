import { z } from 'zod';

/**
 * Shared Zod schemas. Both the NestJS DTOs (ZodValidationPipe) and the React forms
 * (React Hook Form) consume these, so client and server validate identically.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  search: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  name: z.string().min(2),
});
export type SignupInput = z.infer<typeof signupSchema>;
