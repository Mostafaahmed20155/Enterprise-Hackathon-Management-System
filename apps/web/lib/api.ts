import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const locale = localStorage.getItem('locale') || 'ar';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Accept-Language'] = locale;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Redirect to login and return a promise that never resolves.
// This prevents 401 errors from propagating to callers while the browser
// is mid-redirect (the page is about to be replaced anyway).
function redirectToLogin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  const locale = localStorage.getItem('locale') || 'ar';
  window.location.href = `/${locale}/auth/login`;
  return new Promise<never>(() => {});
}

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return redirectToLogin();
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        return redirectToLogin();
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Events API
export const eventsApi = {
  list: (params?: any) => api.get('/events', { params }),
  get: (id: string) => api.get(`/events/${id}`),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  publish: (id: string) => api.post(`/events/${id}/publish`),
  register: (id: string) => api.post(`/events/${id}/register`),
  triggerTransition: (id: string) => api.post(`/events/${id}/transition`),
  advanceState: (id: string) => api.post(`/events/${id}/advance-state`),
  getTeams: (id: string) => api.get(`/events/${id}/teams`),
  getSubmissions: (id: string) => api.get(`/events/${id}/submissions`),
  getRegistrations: (id: string) => api.get(`/events/${id}/registrations`),
};

// Teams API
export const teamsApi = {
  list: (params?: any) => api.get('/teams', { params }),
  get: (id: string) => api.get(`/teams/${id}`),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: string, data: any) => api.patch(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  invite: (id: string, email: string) => api.post(`/teams/${id}/invite`, { email }),
  respondToInvite: (inviteId: string, accept: boolean) =>
    api.post(`/teams/invites/${inviteId}/respond`, {}, { params: { accept } }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/teams/${id}/members/${userId}`),
  getInvites: () => api.get('/teams/invites'),
};

// Submissions API
export const submissionsApi = {
  list: (params?: any) => api.get('/submissions', { params }),
  get: (id: string) => api.get(`/submissions/${id}`),
  getById: (id: string) => api.get(`/submissions/${id}`),
  create: (data: any) => api.post('/submissions', data),
  update: (id: string, data: any) => api.patch(`/submissions/${id}`, data),
  delete: (id: string) => api.delete(`/submissions/${id}`),
  submit: (id: string) => api.post(`/submissions/${id}/submit`),
  submitFinal: (id: string) => api.post(`/submissions/${id}/submit`),
  uploadFile: (id: string, file: File): Promise<{ data: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    // Use native fetch so the browser sets Content-Type: multipart/form-data
    // with the correct boundary automatically (axios instance default
    // 'application/json' cannot be reliably removed per-request).
    const token = localStorage.getItem('accessToken');
    const locale = localStorage.getItem('locale') || 'ar';
    return fetch(`${API_URL}/submissions/${id}/files`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept-Language': locale,
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const err: any = new Error(
          (typeof data?.error?.message === 'object'
            ? data.error.message[locale] || data.error.message.en
            : data?.error?.message) ||
          (typeof data?.message === 'object'
            ? data.message[locale] || data.message.en
            : data?.message) ||
          'Upload failed',
        );
        err.response = { status: res.status, data };
        return Promise.reject(err);
      }
      return { data };
    });
  },
  deleteFile: (id: string, fileId: string) =>
    api.delete(`/submissions/${id}/files/${fileId}`),
};

// Judging API
export const judgingApi = {
  createAssignment: (data: any) => api.post('/judging/assignments', data),
  getAssignments: (eventId?: string) => api.get('/judging/assignments', { params: eventId ? { eventId } : undefined }),
  getAssignment: (assignmentId: string) => api.get(`/judging/assignments/${assignmentId}`),
  getSubmissionsForJudge: (assignmentId: string) =>
    api.get(`/judging/assignments/${assignmentId}/submissions`),
  submitScore: (data: any) => api.post('/judging/scores', data),
  updateScore: (id: string, data: any) => api.patch(`/judging/scores/${id}`, data),
  getLeaderboard: (eventId: string, limit?: number) =>
    api.get(`/judging/events/${eventId}/leaderboard`, { params: { limit } }),
  getStats: (eventId: string) => api.get(`/judging/events/${eventId}/stats`),
};

// Users API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  getProfile: () => api.get('/users/me'),
  updateMe: (data: any) => api.patch('/users/me', data),
  updateProfile: (data: any) => api.patch('/users/me', data),
  getMyTeams: () => api.get('/users/me/teams'),
  search: (params: any) => api.get('/users/search', { params }),

  // Admin methods
  listAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  assignRole: (id: string, role: string) => api.post(`/users/${id}/roles`, { role }),
  removeRole: (id: string, roleName: string) => api.delete(`/users/${id}/roles/${roleName}`),
  toggleStatus: (id: string, active: boolean) => api.patch(`/users/${id}/status`, { active }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Notifications API
export interface NotificationItem {
  id: string;
  type: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<{ data: NotificationItem[]; hasUnread: boolean }>('/notifications'),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<void>('/notifications/read-all'),
};
