import { LocalizedString } from './localized';
export declare enum SubmissionStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    DISQUALIFIED = "DISQUALIFIED",
    WINNER = "WINNER"
}
export interface Submission {
    id: string;
    teamId: string;
    eventId: string;
    authorId: string;
    title: LocalizedString;
    description: LocalizedString;
    demoUrl?: string;
    repoUrl?: string;
    videoUrl?: string;
    status: SubmissionStatus;
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
}
export interface SubmissionFile {
    id: string;
    submissionId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    uploadedBy: string;
}
export interface SubmissionWithFiles extends Submission {
    files: SubmissionFile[];
}
export interface FileUploadProgress {
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}
//# sourceMappingURL=submission.d.ts.map