import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUserShield, FaKey, FaToggleOn, FaToggleOff, FaUser } from 'react-icons/fa';
import { Card, Button } from '../../components/ui';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { showToast } from '../../utils/ui';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usersResp, rolesResp] = await Promise.all([
        usersApi.getAllUsers(),
        rolesApi.getAllRoles()
      ]);
      console.log("Users Response:", usersResp);
      console.log("Roles Response:", rolesResp);

      // Handle both cases: direct array or objects with data property
      let usersData = Array.isArray(usersResp) ? usersResp : (usersResp?.data || []);
      let rolesData = Array.isArray(rolesResp) ? rolesResp : (rolesResp?.data || []);

      // Force array type to prevent map errors
      if (!Array.isArray(usersData)) {
        console.error("usersData is not an array:", usersData);
        usersData = [];
      }
      if (!Array.isArray(rolesData)) {
        console.error("rolesData is not an array:", rolesData);
        rolesData = [];
      }

      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      showToast('Error cargando datos', 'error');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user) {
    try {
      await usersApi.toggleUserStatus(user.id);
      showToast(`Usuario ${user.activo ? 'desactivado' : 'activado'} exitosamente`, 'success');
      loadData();
    } catch (error) {
      showToast('Error cambiando estado del usuario', 'error');
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario permanentemente? Esta acción NO se puede deshacer y fallará si el usuario tiene registros asociados.')) return;
    
    try {
      await usersApi.deleteUser(userId);
      showToast('Usuario eliminado exitosamente', 'success');
      loadData();
    } catch (error) {
      showToast('Error eliminando usuario', 'error');
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
            <FaUserShield className="text-blue-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema, sus roles y estados via esta interfaz centralizada.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <FaPlus /> Crear Nuevo Usuario
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol Asignado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {user.role_name || 'Sin Rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditRoleModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors inline-block p-1"
                      title="Cambiar Rol"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPasswordModal(true);
                      }}
                      className="text-amber-600 hover:text-amber-900 transition-colors inline-block p-1"
                      title="Cambiar Contraseña"
                    >
                      <FaKey />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`${user.activo ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'} transition-colors inline-block p-1`}
                      title={user.activo ? "Desactivar" : "Activar"}
                    >
                       {user.activo ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 transition-colors inline-block p-1 ml-2"
                      title="Eliminar permanentemente"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODALES */}
      {showCreateModal && (
        <CreateUserModal 
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showEditRoleModal && selectedUser && (
        <EditRoleModal
          user={selectedUser}
          roles={roles}
          onClose={() => {
            setShowEditRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditRoleModal(false);
            setSelectedUser(null);
            loadData();
          }}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// MODAL: CREATE USER
// ==========================================
function CreateUserModal({ roles, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roleId) {
      showToast('Seleccione un rol', 'error');
      return;
    }
    
    try {
      const payload = { 
        username, 
        password, 
        role_id: parseInt(roleId, 10) 
      };
      await usersApi.createUser(payload);
      showToast('Usuario creado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      showToast(error.message || 'Error creando usuario', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[var(--z-index-modal-backdrop)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-[var(--z-index-modal)] animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ej: doctor_perez"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Min. 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Rol Inicial</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              required
            >
              <option value="">Seleccione un rol...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: EDIT ROLE
// ==========================================
function EditRoleModal({ user, roles, onClose, onSuccess }) {
  const [roleId, setRoleId] = useState(user.role_id || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await usersApi.updateUserRole(user.id, parseInt(roleId));
      showToast('Rol actualizado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      showToast('Error actualizando rol', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[var(--z-index-modal-backdrop)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-[var(--z-index-modal)] animate-slideUp">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Rol</h2>
        <p className="text-sm text-gray-600 mb-6">Asigna un nuevo rol para <strong>{user.username}</strong>.</p>
        
        <form onSubmit={handleSubmit}>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white mb-6"
            required
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MODAL: CHANGE PASSWORD
// ==========================================
function ChangePasswordModal({ user, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await usersApi.changePassword(user.id, newPassword);
      showToast('Contraseña actualizada', 'success');
      onSuccess();
    } catch (error) {
      showToast('Error actualizando contraseña', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[var(--z-index-modal-backdrop)] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-[var(--z-index-modal)] animate-slideUp">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Contraseña</h2>
        <p className="text-sm text-gray-600 mb-6">Nueva contraseña para <strong>{user.username}</strong>.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6"
            placeholder="Nueva contraseña"
            required
            minLength={6}
          />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Cambiar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
