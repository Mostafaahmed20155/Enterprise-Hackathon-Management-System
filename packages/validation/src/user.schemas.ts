import { z } from 'zod';
import { emailSchema, localeSchema, localizedStringSchema } from './common';

/**
 * Skill schema
 */
export const skillSchema = z.object({
  name: localizedStringSchema,
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  preferredLocale: localeSchema.optional(),
  timezone: z.string().optional(),
  skills: z.array(skillSchema).optional(),
});

/**
 * Search users schema
 */
export const searchUsersSchema = z.object({
  q: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  locale: localeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SkillInput = z.infer<typeof skillSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
