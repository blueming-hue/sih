// Frontend helper for Assessment APIs
// Uses REACT_APP_PYTHON_BACKEND_URL or defaults to http://localhost:5000

const BASE_URL = process.env.REACT_APP_PYTHON_BACKEND_URL || 'http://localhost:5000';

async function http(method, path, body) {
  const opts = { method };
  if (body !== undefined && body !== null) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchQuestions(type) {
  const t = (type || '').toLowerCase();
  return http('GET', `/api/assessment/questions?type=${encodeURIComponent(t)}`);
}

export async function submitPHQ9(responses, userId) {
  return http('POST', '/api/assessment/phq9', { responses, user_id: userId });
}

export async function submitGAD7(responses, userId) {
  return http('POST', '/api/assessment/gad7', { responses, user_id: userId });
}

export async function submitGHQ12(responses, userId) {
  return http('POST', '/api/assessment/ghq12', { responses, user_id: userId });
}

export async function fetchHistory(userId, limit = 20) {
  const url = `/api/assessment/history?user_id=${encodeURIComponent(userId)}&limit=${limit}`;
  return http('GET', url);
}
