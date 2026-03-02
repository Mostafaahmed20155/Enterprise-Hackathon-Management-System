import { z } from 'zod';
import { localizedStringSchema, cuidSchema, urlSchema } from './common';
import { SubmissionStatus } from '@ehms/types';

/**
 * Create submission schema
 */
export const createSubmissionSchema = z.object({
  teamId: cuidSchema,
  eventId: cuidSchema,
  title: localizedStringSchema,
  description: localizedStringSchema,
  demoUrl: urlSchema,
  repoUrl: urlSchema,
  videoUrl: urlSchema,
});

/**
 * Update submission schema
 */
export const updateSubmissionSchema = z.object({
  title: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  demoUrl: urlSchema,
  repoUrl: urlSchema,
  videoUrl: urlSchema,
});

/**
 * Submit final submission schema
 */
export const submitFinalSchema = z.object({
  submissionId: cuidSchema,
});

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(100 * 1024 * 1024), // Max 100MB
  mimeType: z.string().regex(/^[\w-]+\/[\w-]+$/),
});

/**
 * Query submissions schema
 */
export const querySubmissionsSchema = z.object({
  eventId: cuidSchema.optional(),
  teamId: cuidSchema.optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type SubmitFinalInput = z.infer<typeof submitFinalSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type QuerySubmissionsInput = z.infer<typeof querySubmissionsSchema>;
