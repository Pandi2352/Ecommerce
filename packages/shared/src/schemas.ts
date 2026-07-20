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

export const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  slug: z.string().optional(),
  logo: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(100),
  code: z.string().min(1, 'Vendor code is required').max(50),
  contactName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  commissionRate: z.number().min(0).max(100).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']).default('ACTIVE'),
  notes: z.string().optional().or(z.literal('')),
});
export type VendorInput = z.infer<typeof vendorSchema>;

