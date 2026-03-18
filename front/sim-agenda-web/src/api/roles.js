// src/api/roles.js
import { apiFetch } from './client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const rolesApi = {
  // Get all roles
  getAllRoles: async () => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/`);
  },

  // Get role by ID with permissions
  getRoleById: async (roleId) => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/${roleId}`);
  },

  // Create new role
  createRole: async (roleData) => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData)
    });
  },

  // Update role
  updateRole: async (roleId, roleData) => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData)
    });
  },

  // Assign permissions to role
  assignPermissions: async (roleId, permissions) => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions })
    });
  },

  // Delete role
  deleteRole: async (roleId) => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/${roleId}`, {
      method: 'DELETE'
    });
  },

  // Get permission groups metadata
  getPermissionGroups: async () => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/metadata/groups`);
  },

  // Get actions metadata
  getActions: async () => {
    return await apiFetch(`${BACKEND_URL}/admin/roles/metadata/actions`);
  }
};
