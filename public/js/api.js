// api.js — Centralized fetch wrapper for all backend API calls

const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('re_token');
}

async function request(method, endpoint, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

const api = {
  // Auth
  register: (name, email, password) => request('POST', '/auth/register', { name, email, password }, false),
  login: (email, password) => request('POST', '/auth/login', { email, password }, false),
  me: () => request('GET', '/auth/me'),

  // Chat
  sendMessage: (message, sessionId = null) => request('POST', '/chat/message', { message, sessionId }),
  getSessions: () => request('GET', '/chat/sessions'),
  getSession: (id) => request('GET', `/chat/sessions/${id}`),
  deleteSession: (id) => request('DELETE', `/chat/sessions/${id}`),

  // Market
  getCities: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/market/cities${q ? '?' + q : ''}`, null, false);
  },
  getCity: (slug) => request('GET', `/market/cities/${slug}`, null, false),
  compareCities: (slugs) => request('GET', `/market/compare?cities=${slugs.join(',')}`, null, false),

  // Recommend
  generateRecommendation: (data) => request('POST', '/recommend', data),
  getRecommendationHistory: () => request('GET', '/recommend/history'),
};

window.api = api;
