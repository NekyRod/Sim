// src/api/procedimientos.js
import { apiFetch } from './client';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const procedimientosApi = {
    getAll: async () => {
        return await apiFetch(`${BASE_URL}/config/procedimientos/`);
    },
    
    create: async (data) => {
        return await apiFetch(`${BASE_URL}/config/procedimientos/`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    update: async (id, data) => {
        return await apiFetch(`${BASE_URL}/config/procedimientos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    remove: async (id) => {
        return await apiFetch(`${BASE_URL}/config/procedimientos/${id}`, {
            method: 'DELETE'
        });
    }
};
