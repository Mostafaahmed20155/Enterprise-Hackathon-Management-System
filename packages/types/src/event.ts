import { LocalizedString } from './localized';

export enum EventState {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  TEAM_FORMATION = 'TEAM_FORMATION',
  HACKING_PHASE = 'HACKING_PHASE',
  SUBMISSION_CLOSED = 'SUBMISSION_CLOSED',
  JUDGING = 'JUDGING',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Event {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  state: EventState;
  registrationStart: Date;
  registrationEnd: Date;
  hackingStart: Date;
  hackingEnd: Date;
  judgingEnd?: Date;
  resultsDate?: Date;
  maxTeamSize: number;
  minTeamSize: number;
  allowLateSubmissions: boolean;
  isPublished: boolean;
  rules?: LocalizedString;
  prizes?: Prize[];
  requirements?: LocalizedString;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface Prize {
  place: number;
  name: LocalizedString;
  amount?: number;
  currency?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'REGISTERED' | 'WITHDRAWN';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventTimeline {
  registrationStart: Date;
  registrationEnd: Date;
  hackingStart: Date;
  hackingEnd: Date;
  judgingEnd?: Date;
  resultsDate?: Date;
}

export interface EventSettings {
  maxTeamSize: number;
  minTeamSize: number;
  allowLateSubmissions: boolean;
}

// State transition types
export interface StateTransition {
  from: EventState;
  to: EventState;
  guards: StateGuard[];
  sideEffects?: SideEffect[];
}

export type StateGuard = (event: Event) => boolean;
export type SideEffect = (event: Event) => Promise<void>;
