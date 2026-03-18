// src/pages/admin/RoleManager.jsx
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaShieldAlt } from 'react-icons/fa';
import {Card, Button } from '../../components/ui';
import { rolesApi } from '../../api/roles';
import { showToast } from '../../utils/ui';

export default function RoleManager() {
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [rolesResp, groupsResp, actionsResp] = await Promise.all([
        rolesApi.getAllRoles(),
        rolesApi.getPermissionGroups(),
        rolesApi.getActions()
      ]);

      setRoles(rolesResp.data || rolesResp);
      setPermissionGroups(groupsResp.data || groupsResp);
      setActions(actionsResp.data || actionsResp);
    } catch (error) {
      showToast('Error cargando datos', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditPermissions(role) {
    try {
      const roleDetail = await rolesApi.getRoleById(role.id);
      setSelectedRole(roleDetail.data || roleDetail);
      setShowPermissionsModal(true);
    } catch (error) {
      showToast('Error cargando permisos del rol', 'error');
    }
  }

  async function handleDeleteRole(roleId) {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;
    
    try {
      await rolesApi.deleteRole(roleId);
      showToast('Rol eliminado exitosamente', 'success');
      loadData();
    } catch (error) {
      showToast('Error eliminando rol', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaShieldAlt className="text-blue-600" />
            Gestión de Roles y Permisos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los roles del sistema y sus permisos
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <FaPlus /> Crear Nuevo Rol
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{role.description || 'Sin descripción'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role.permission_count || 0} permisos
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {role.is_system ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Sistema
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Personalizado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleEditPermissions(role)}
                      disabled={role.is_system}
                      className={`${role.is_system ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
                      title={role.is_system ? "Los permisos de sistema están protegidos" : "Editar permisos"}
                    >
                      {role.is_system ? <FaShieldAlt className="inline" /> : <FaEdit className="inline" />}
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-800 transition-colors ml-3"
                        title="Eliminar rol"
                      >
                        <FaTrash className="inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showPermissionsModal && selectedRole && (
        <PermissionsModal
          role={selectedRole}
          permissionGroups={permissionGroups}
          actions={actions}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// CREATE ROLE MODAL
// ============================================================================

function CreateRoleModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setSaving(true);
      await rolesApi.createRole({ name, description });
      showToast('Rol creado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      showToast('Error creando rol', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Rol</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej: Recepcionista"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Descripción del rol"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Creando...' : 'Crear Rol'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// PERMISSIONS MATRIX MODAL
// ============================================================================

function PermissionsModal({ role, permissionGroups, actions, onClose, onSuccess }) {
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize selected permissions from role data
    if (role.permissions) {
      const initialPerms = new Set();
      role.permissions.forEach(perm => {
        const key = `${perm.group_id}-${perm.action_id}`;
        initialPerms.add(key);
      });
      setSelectedPermissions(initialPerms);
    }
  }, [role]);

  function togglePermission(groupId, actionId) {
    const key = `${groupId}-${actionId}`;
    const newPerms = new Set(selectedPermissions);
    
    if (newPerms.has(key)) {
      newPerms.delete(key);
    } else {
      newPerms.add(key);
    }
    
    setSelectedPermissions(newPerms);
  }

  function toggleGroup(groupId) {
    const newPerms = new Set(selectedPermissions);
    const groupPerms = actions.map(action => `${groupId}-${action.id}`);
    const allSelected = groupPerms.every(key => newPerms.has(key));

    if (allSelected) {
      // Deselect all
      groupPerms.forEach(key => newPerms.delete(key));
    } else {
      // Select all
      groupPerms.forEach(key => newPerms.add(key));
    }

    setSelectedPermissions(newPerms);
  }

  async function handleSave() {
    try {
      setSaving(true);
      
      // Convert Set to array of {group_id, action_id} objects
      const permissions = Array.from(selectedPermissions).map(key => {
        const [groupId, actionId] = key.split('-').map(Number);
        return { group_id: groupId, action_id: actionId };
      });

      await rolesApi.assignPermissions(role.id, permissions);
      showToast('Permisos actualizados exitosamente', 'success');
      onSuccess();
    } catch (error) {
      showToast('Error actualizando permisos', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Permisos: {role.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona los permisos para este rol
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2">
                    Módulo
                  </th>
                  {actions.map(action => (
                    <th 
                      key={action.id}
                      className="sticky top-0 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2"
                    >
                      {action.name}
                    </th>
                  ))}
                  <th className="sticky top-0 bg-gray-50 px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b-2">
                    Todo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionGroups.map((group) => {
                  const groupPerms = actions.map(action => `${group.id}-${action.id}`);
                  const allSelected = groupPerms.every(key => selectedPermissions.has(key));
                  const someSelected = groupPerms.some(key => selectedPermissions.has(key));

                  return (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{group.name}</div>
                        <div className="text-xs text-gray-500">{group.code}</div>
                      </td>
                      {actions.map(action => {
                        const key = `${group.id}-${action.id}`;
                        const isChecked = selectedPermissions.has(key);
                        
                        return (
                          <td key={action.id} className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(group.id, action.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={input => {
                            if (input) input.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedPermissions.size} permisos seleccionados
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <FaSave /> {saving ? 'Guardando...' : 'Guardar Permisos'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
