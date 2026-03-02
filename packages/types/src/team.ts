import { LocalizedString } from './localized';

export interface Team {
  id: string;
  name: LocalizedString;
  description?: LocalizedString;
  eventId: string;
  leaderId: string;
  isLocked: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lockedAt?: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    skills: Array<{ name: LocalizedString; level?: string }>;
  };
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  userId?: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
}

export interface TeamRecommendation {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  skills: Array<{ name: LocalizedString; level?: string }>;
  matchScore: number;
  matchedSkills: LocalizedString[];
}
