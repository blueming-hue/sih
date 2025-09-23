import { auth } from '../firebase/config';

const BASE_URL = process.env.REACT_APP_PYTHON_BACKEND_URL || 'http://localhost:5000';

export async function withAuthFetch(path, options = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken(/* forceRefresh */ false) : null;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const resp = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  return resp;
}

export async function apiJson(path, method = 'GET', body = null) {
  const opts = { method };
  if (body != null) opts.body = JSON.stringify(body);
  const res = await withAuthFetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
