import { z } from 'zod';

/**
 * LocalizedString schema
 * Both English and Arabic are required
 */
export const localizedStringSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  ar: z.string().min(1, 'Arabic text is required'),
});

/**
 * Locale schema
 */
export const localeSchema = z.enum(['ar', 'en']);

/**
 * Email schema with normalization
 */
export const emailSchema = z.string().email().toLowerCase().trim();

/**
 * Password schema
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * URL schema (optional)
 */
export const urlSchema = z.string().url().optional().or(z.literal(''));

/**
 * CUID schema for IDs
 */
export const cuidSchema = z.string().cuid();

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
