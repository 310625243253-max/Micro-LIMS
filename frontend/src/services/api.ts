const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getToken(): string | null {
  return localStorage.getItem('microlims_token');
}

export function getReportPreviewUrl(reportId: string): string {
  const token = getToken();
  return `${API_BASE}/reports/${reportId}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export function getReportDownloadUrl(reportId: string): string {
  const token = getToken();
  return `${API_BASE}/reports/${reportId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }

  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardMetrics: () => request<any>('/dashboard/metrics'),
  getDashboardActivity: (limit = 10) => request<any[]>(`/dashboard/activity?limit=${limit}`),

  // Samples
  getSamples: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/samples${qs ? '?' + qs : ''}`);
  },
  getSampleById: (id: string) => request<any>(`/samples/${id}`),
  getSampleLineage: (id: string) => request<any>(`/samples/${id}/lineage`),
  createSample: (data: any) => request<any>('/samples', { method: 'POST', body: JSON.stringify(data) }),
  updateSample: (id: string, data: any) => request<any>(`/samples/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateSampleStatus: (id: string, data: any) => request<any>(`/samples/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Cultures
  getCultures: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/cultures${qs ? '?' + qs : ''}`);
  },
  getCultureById: (id: string) => request<any>(`/cultures/${id}`),
  createCulture: (data: any) => request<any>('/cultures', { method: 'POST', body: JSON.stringify(data) }),
  updateCultureStatus: (id: string, data: any) => request<any>(`/cultures/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Media
  getMediaLots: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/media${qs ? '?' + qs : ''}`);
  },
  createMediaLot: (data: any) => request<any>('/media', { method: 'POST', body: JSON.stringify(data) }),

  // Incubations
  getIncubations: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/incubations${qs ? '?' + qs : ''}`);
  },
  createIncubation: (data: any) => request<any>('/incubations', { method: 'POST', body: JSON.stringify(data) }),
  updateIncubationStatus: (id: string, data: any) => request<any>(`/incubations/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Observations
  getObservations: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/observations${qs ? '?' + qs : ''}`);
  },
  createObservation: (data: any) => request<any>('/observations', { method: 'POST', body: JSON.stringify(data) }),

  // Tests
  getTests: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/tests${qs ? '?' + qs : ''}`);
  },
  createTest: (data: any) => request<any>('/tests', { method: 'POST', body: JSON.stringify(data) }),

  // AST
  getAstRecords: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/ast${qs ? '?' + qs : ''}`);
  },
  createAst: (data: any) => request<any>('/ast', { method: 'POST', body: JSON.stringify(data) }),
  createAstBatch: (data: any) => request<any>('/ast/batch', { method: 'POST', body: JSON.stringify(data) }),

  // Contamination
  getContaminationIncidents: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/contamination${qs ? '?' + qs : ''}`);
  },
  createContaminationIncident: (data: any) => request<any>('/contamination', { method: 'POST', body: JSON.stringify(data) }),
  updateContaminationIncident: (id: string, data: any) => request<any>(`/contamination/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Reviews
  getPendingReviews: () => request<any[]>('/reviews/pending'),
  getReviews: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/reviews${qs ? '?' + qs : ''}`);
  },
  submitForReview: (data: any) => request<any>('/reviews/submit', { method: 'POST', body: JSON.stringify(data) }),
  signOffReview: (data: any) => request<any>('/reviews/sign-off', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getReports: (page = 1, limit = 50) => request<any[]>(`/reports?page=${page}&limit=${limit}`),
  generateReport: (sampleId: string) => request<any>(`/reports/generate/${sampleId}`, { method: 'POST' }),
  verifyChecksum: (checksum: string) => request<any>('/reports/verify', { method: 'POST', body: JSON.stringify({ checksum }) }),

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/audit${qs ? '?' + qs : ''}`);
  },
};
