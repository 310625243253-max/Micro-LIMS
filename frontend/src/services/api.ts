import {
  MOCK_USERS,
  MOCK_SAMPLES,
  MOCK_DASHBOARD_METRICS,
  MOCK_INCUBATIONS,
  MOCK_AST_RECORDS,
  MOCK_REVIEWS,
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

let isOfflineMode = false;
let localSamplesState = [...MOCK_SAMPLES];

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

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 404 && !import.meta.env.VITE_API_URL) {
      // Backend not running (e.g. GitHub Pages static hosting)
      throw new Error(`API_OFFLINE_FALLBACK`);
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
    }

    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    // If backend is unavailable (GitHub Pages or disconnected), provide mock fallback
    if (err.message === 'API_OFFLINE_FALLBACK' || err.name === 'TypeError' || err.message?.includes('Failed to fetch')) {
      isOfflineMode = true;
      return handleMockFallback<T>(endpoint, options);
    }
    throw err;
  }
}

function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = options.method?.toUpperCase() || 'GET';

  if (endpoint.startsWith('/auth/login') && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const matchedUser = MOCK_USERS.find((u) => u.email === body.email) || MOCK_USERS[0];
    return {
      accessToken: 'demo-mock-token-gh-pages',
      refreshToken: 'demo-mock-refresh',
      user: matchedUser,
    } as unknown as T;
  }

  if (endpoint.startsWith('/auth/me')) {
    return MOCK_USERS[0] as unknown as T;
  }

  if (endpoint.startsWith('/dashboard/metrics')) {
    return MOCK_DASHBOARD_METRICS as unknown as T;
  }

  if (endpoint.startsWith('/dashboard/activity')) {
    return [
      { id: '1', action: 'INCUBATION_START', details: 'Culture plate INC-901 loaded', timestamp: new Date().toISOString() },
      { id: '2', action: 'AST_COMPLETED', details: 'Vitek-2 Panel completed for SMP-2026-0082', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ] as unknown as T;
  }

  if (endpoint.startsWith('/samples') && method === 'GET') {
    const parts = endpoint.split('/');
    if (parts.length > 2 && parts[2]) {
      const sample = localSamplesState.find((s) => s.id === parts[2]) || localSamplesState[0];
      return sample as unknown as T;
    }
    return localSamplesState as unknown as T;
  }

  if (endpoint.startsWith('/samples') && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const newSample = {
      id: `SMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      accession_number: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'ACCESSIONED',
      collection_date: new Date().toISOString(),
      received_date: new Date().toISOString(),
      ...body,
    };
    localSamplesState = [newSample, ...localSamplesState];
    return newSample as unknown as T;
  }

  if (endpoint.startsWith('/incubations')) {
    return MOCK_INCUBATIONS as unknown as T;
  }

  if (endpoint.startsWith('/ast')) {
    return MOCK_AST_RECORDS as unknown as T;
  }

  if (endpoint.startsWith('/reviews')) {
    return MOCK_REVIEWS as unknown as T;
  }

  if (endpoint.startsWith('/media')) {
    return [
      { id: 'MED-1', media_name: 'Blood Agar (BAP 5% Sheep)', lot_number: 'LOT-BAP-2026A', expiration_date: '2026-11-30', qc_status: 'PASSED' },
      { id: 'MED-2', media_name: 'MacConkey Agar (MAC)', lot_number: 'LOT-MAC-2026B', expiration_date: '2026-12-15', qc_status: 'PASSED' },
    ] as unknown as T;
  }

  if (endpoint.startsWith('/reports')) {
    return [] as unknown as T;
  }

  if (endpoint.startsWith('/audit')) {
    return [
      { id: 'aud-1', user_name: 'Dr. Sarah Chen', action: 'SYSTEM_LOGIN', target: 'Auth Module', timestamp: new Date().toISOString() },
    ] as unknown as T;
  }

  return [] as unknown as T;
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

