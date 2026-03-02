import { z } from 'zod';
import { localizedStringSchema, cuidSchema } from './common';

/**
 * Judging criterion schema
 */
export const judgingCriterionSchema = z.object({
  name: localizedStringSchema,
  weight: z.number().min(0).max(1),
  maxScore: z.number().int().min(1).max(100),
});

/**
 * Create judging assignment schema
 */
export const createJudgingAssignmentSchema = z.object({
  eventId: cuidSchema,
  judgeId: cuidSchema,
  criteria: z.array(judgingCriterionSchema).min(1),
});

/**
 * Submit score schema
 */
export const submitScoreSchema = z.object({
  submissionId: cuidSchema,
  assignmentId: cuidSchema,
  scores: z.record(z.string(), z.number()),
  feedback: localizedStringSchema.optional(),
});

/**
 * Update score schema
 */
export const updateScoreSchema = z.object({
  scores: z.record(z.string(), z.number()).optional(),
  feedback: localizedStringSchema.optional(),
});

/**
 * Get leaderboard schema
 */
export const getLeaderboardSchema = z.object({
  eventId: cuidSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type JudgingCriterionInput = z.infer<typeof judgingCriterionSchema>;
export type CreateJudgingAssignmentInput = z.infer<typeof createJudgingAssignmentSchema>;
export type SubmitScoreInput = z.infer<typeof submitScoreSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;
export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;
