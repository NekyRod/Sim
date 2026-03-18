const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8000'; // Fallback or env
const TOKEN_URL = import.meta.env.VITE_TOKEN_URL || `${AUTH_SERVICE_URL}/auth/token`;

export const authApi = {
  register: async (userData) => {
    // userData: { username, password, rol: 'PATIENT' }
    const res = await fetch(`${AUTH_SERVICE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error en registro');
    }
    return res.json();
  },

  login: async (credentials) => {
    // credentials: { username, password }
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    return res.json();
  }
};
