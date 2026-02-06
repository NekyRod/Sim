// src/api/auth.js

export async function login(username, password) {
  const TOKEN_URL = import.meta.env.VITE_TOKEN_URL ;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Credenciales inválidas');
  const data = await res.json(); // { access_token, token_type }
  return data.access_token;
}
