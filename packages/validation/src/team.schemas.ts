import { z } from 'zod';
import { localizedStringSchema, cuidSchema, emailSchema } from './common';

/**
 * Create team schema
 */
export const createTeamSchema = z.object({
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  eventId: cuidSchema,
});

/**
 * Update team schema
 */
export const updateTeamSchema = z.object({
  name: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
});

/**
 * Invite team member schema
 */
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  expiresIn: z.number().int().min(1).max(30).default(7), // days
});

/**
 * Respond to team invite schema
 */
export const respondToInviteSchema = z.object({
  inviteId: cuidSchema,
  accept: z.boolean(),
});

/**
 * Remove team member schema
 */
export const removeTeamMemberSchema = z.object({
  userId: cuidSchema,
});

/**
 * Query teams schema
 */
export const queryTeamsSchema = z.object({
  eventId: cuidSchema.optional(),
  isLocked: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type RespondToInviteInput = z.infer<typeof respondToInviteSchema>;
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>;
export type QueryTeamsInput = z.infer<typeof queryTeamsSchema>;
