import { apiFetch } from './client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const chatApi = {
  // Patient
  startSession: (sessionId, userData) => apiFetch(`${BACKEND_URL}/patient/chat/sessions`, { 
      method: 'POST',
      body: JSON.stringify({ 
        session_id: sessionId || undefined,
        ...(userData || {}) 
      })
  }),
  sendPatientMessage: (sessionId, content) => apiFetch(`${BACKEND_URL}/patient/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  getPatientMessages: (sessionId) => apiFetch(`${BACKEND_URL}/patient/chat/sessions/${sessionId}/messages`),
  closePatientSession: (sessionId) => apiFetch(`${BACKEND_URL}/patient/chat/sessions/${sessionId}/close`, { method: 'POST', body: JSON.stringify({}) }),

  // Admin
  getSessions: (status) => {
    const q = status ? `?status=${status}` : '';
    return apiFetch(`${BACKEND_URL}/chat/sessions${q}`);
  },
  deleteSessions: (ids) => apiFetch(`${BACKEND_URL}/chat/sessions`, { 
      method: 'DELETE',
      body: JSON.stringify({ session_ids: ids })
  }),
  getAdminMessages: (sessionId) => apiFetch(`${BACKEND_URL}/chat/sessions/${sessionId}/messages`),
  validateSession: (sessionId, action) => apiFetch(`${BACKEND_URL}/chat/sessions/${sessionId}/validate`, {
    method: 'POST',
    body: JSON.stringify({ accion: action }) // Note: Backend expects 'accion'
  }),
  closeSession: (sessionId) => apiFetch(`${BACKEND_URL}/chat/sessions/${sessionId}/close`, { method: 'POST', body: JSON.stringify({}) }),
  sendAdminMessage: (sessionId, content) => apiFetch(`${BACKEND_URL}/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  
  // Notifications
  getNotifications: () => apiFetch(`${BACKEND_URL}/chat/notifications`),
  markRead: (id) => apiFetch(`${BACKEND_URL}/chat/notifications/${id}/read`, { method: 'POST' }),
  clearNotifications: () => apiFetch(`${BACKEND_URL}/chat/notifications/clear`, { method: 'POST' })
};
