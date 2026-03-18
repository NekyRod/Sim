// src/components/auth/HasPermission.jsx
import { useAuth } from '../../context/AuthContext';

/**
 * HasPermission Component
 * 
 * Wrapper component that only renders children if user has the required permission
 * or if user is an Administrator (has all permissions)
 * 
 * Usage:
 * <HasPermission group="PACIENTES" action="create">
 *   <button>Create Patient</button>
 * </HasPermission>
 */
export default function HasPermission({ group, action, children, fallback = null }) {
  const { hasPermission } = useAuth();

  if (hasPermission(group, action)) {
    return <>{children}</>;
  }

  return fallback;
}
