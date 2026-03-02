import { LocalizedString } from './localized';

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  preferredLocale: 'ar' | 'en';
  timezone: string;
  skills: Skill[];
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  name: LocalizedString;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Role {
  id: string;
  name: RoleName;
  displayName: LocalizedString;
  description?: LocalizedString;
}

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  JUDGE = 'JUDGE',
}

export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  description?: LocalizedString;
}

export enum ResourceType {
  EVENT = 'EVENT',
  TEAM = 'TEAM',
  SUBMISSION = 'SUBMISSION',
  JUDGING = 'JUDGING',
  USER = 'USER',
}

export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PUBLISH = 'PUBLISH',
  ASSIGN = 'ASSIGN',
  SCORE = 'SCORE',
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  eventId?: string; // Event-scoped role
  role: Role;
}

export interface UserProfile extends User {
  roles: UserRole[];
}
