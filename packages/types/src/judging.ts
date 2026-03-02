import { LocalizedString } from './localized';

export interface JudgingCriterion {
  name: LocalizedString;
  weight: number;
  maxScore: number;
}

export interface JudgingAssignment {
  id: string;
  eventId: string;
  judgeId: string;
  criteria: JudgingCriterion[];
  assignedAt: Date;
}

export interface JudgingScore {
  id: string;
  submissionId: string;
  assignmentId: string;
  judgeId: string;
  scores: Record<string, number>; // criterion name -> score
  totalScore: number;
  feedback?: LocalizedString;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  submissionId: string;
  teamId: string;
  teamName: LocalizedString;
  totalScore: number;
  averageScore: number;
  judgeCount: number;
  rank: number;
}

export interface JudgingStats {
  totalSubmissions: number;
  scoredSubmissions: number;
  pendingSubmissions: number;
  averageScore: number;
  completionPercentage: number;
}
