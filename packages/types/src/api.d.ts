import { LocalizedString } from './localized';
export interface ApiResponse<T = unknown> {
    data?: T;
    error?: ApiError;
    message?: LocalizedString;
    success: boolean;
}
export interface ApiError {
    code: string;
    message: LocalizedString;
    details?: Record<string, unknown>;
    statusCode: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchParams extends PaginationParams {
    q?: string;
    filters?: Record<string, unknown>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    name: string;
    preferredLocale: 'ar' | 'en';
}
//# sourceMappingURL=api.d.ts.map