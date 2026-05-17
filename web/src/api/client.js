const BASE = '/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Applications
  getApplications: () => fetchJSON('/applications'),
  updateStatus: (reportNumber, status) =>
    fetchJSON(`/applications/${reportNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Profile
  getProfile: () => fetchJSON('/profile'),
  updateProfile: (data) =>
    fetchJSON('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // CV
  getCv: () => fetchJSON('/cv'),
  updateCv: (content) =>
    fetchJSON('/cv', { method: 'PUT', body: JSON.stringify({ content }) }),

  // Reports
  getReports: () => fetchJSON('/reports'),
  getReport: (filename) => fetchJSON(`/reports/${filename}`),

  // Portals
  getPortals: () => fetchJSON('/portals'),
  updatePortals: (data) =>
    fetchJSON('/portals', { method: 'PUT', body: JSON.stringify(data) }),

  // Pipeline
  getPipeline: () => fetchJSON('/pipeline'),
  addToPipeline: (url, company, title) =>
    fetchJSON('/pipeline', { method: 'POST', body: JSON.stringify({ url, company, title }) }),

  // Scanner
  streamScan: () => {
    const evtSource = new EventSource(`${BASE}/scanner/stream`);
    return evtSource;
  },
  getScanHistory: () => fetchJSON('/scanner/history'),

  // PDF
  getPdfList: () => fetchJSON('/pdf/list'),
  getPdfUrl: (filename) => `${BASE}/pdf/${filename}`,

  // States
  getStates: () => fetchJSON('/states'),

  // Metrics
  getMetrics: () => fetchJSON('/metrics'),

  // Health
  health: () => fetchJSON('/health'),
};
