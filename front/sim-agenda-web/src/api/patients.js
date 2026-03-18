import { apiFetch } from './client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const patientsApi = {
  create: (data) => apiFetch(`${BACKEND_URL}/pacientes/`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
