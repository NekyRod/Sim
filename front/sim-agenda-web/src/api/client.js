// src/api/client.js
export function getAuthToken() {
  return sessionStorage.getItem('auth_token');
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(url, { ...options, headers });
  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg = data.detail || `Error ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}
