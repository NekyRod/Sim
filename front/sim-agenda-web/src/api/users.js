import { apiFetch } from "./client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const usersApi = {
  getAllUsers: () => apiFetch(`${BACKEND_URL}/admin/users/`),
  getUserById: (id) => apiFetch(`${BACKEND_URL}/admin/users/${id}`),
  createUser: (data) => apiFetch(`${BACKEND_URL}/admin/users/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUserRole: (id, roleId) => apiFetch(`${BACKEND_URL}/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role_id: roleId })
  }),
  changePassword: (id, newPassword) => apiFetch(`${BACKEND_URL}/admin/users/${id}/password`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword })
  }),
  toggleUserStatus: (id) => apiFetch(`${BACKEND_URL}/admin/users/${id}/toggle`, {
    method: 'POST'
  }),
  deleteUser: (id) => apiFetch(`${BACKEND_URL}/admin/users/${id}`, {
    method: 'DELETE'
  })
};
