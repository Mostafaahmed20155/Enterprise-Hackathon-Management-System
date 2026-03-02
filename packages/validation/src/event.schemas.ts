import { z } from 'zod';
import { localizedStringSchema, cuidSchema } from './common';
import { EventState } from '@ehms/types';

/**
 * Prize schema
 */
export const prizeSchema = z.object({
  place: z.number().int().min(1),
  name: localizedStringSchema,
  amount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency code
});

/**
 * Base event schema (without refinements)
 */
const baseEventSchema = z.object({
  name: localizedStringSchema,
  description: localizedStringSchema,
  registrationStart: z.coerce.date(),
  registrationEnd: z.coerce.date(),
  hackingStart: z.coerce.date(),
  hackingEnd: z.coerce.date(),
  judgingEnd: z.coerce.date().optional(),
  resultsDate: z.coerce.date().optional(),
  maxTeamSize: z.number().int().min(2).max(20).default(5),
  minTeamSize: z.number().int().min(1).max(10).default(2),
  allowLateSubmissions: z.boolean().default(false),
  rules: localizedStringSchema.optional(),
  prizes: z.array(prizeSchema).optional(),
  requirements: localizedStringSchema.optional(),
});

/**
 * Create event schema
 */
export const createEventSchema = baseEventSchema
  .refine((data) => data.registrationEnd > data.registrationStart, {
    message: 'Registration end must be after registration start',
    path: ['registrationEnd'],
  })
  .refine((data) => data.hackingStart >= data.registrationEnd, {
    message: 'Hacking start must be after registration end',
    path: ['hackingStart'],
  })
  .refine((data) => data.hackingEnd > data.hackingStart, {
    message: 'Hacking end must be after hacking start',
    path: ['hackingEnd'],
  })
  .refine((data) => data.minTeamSize <= data.maxTeamSize, {
    message: 'Minimum team size must be less than or equal to maximum team size',
    path: ['minTeamSize'],
  });

/**
 * Update event schema
 */
export const updateEventSchema = baseEventSchema.partial();

/**
 * Event state transition schema
 */
export const eventStateTransitionSchema = z.object({
  toState: z.nativeEnum(EventState),
});

/**
 * Register for event schema
 */
export const registerForEventSchema = z.object({
  eventId: cuidSchema,
});

/**
 * Query events schema
 */
export const queryEventsSchema = z.object({
  state: z.nativeEnum(EventState).optional(),
  organizerId: cuidSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'registrationStart', 'hackingStart', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventStateTransitionInput = z.infer<typeof eventStateTransitionSchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type QueryEventsInput = z.infer<typeof queryEventsSchema>;
