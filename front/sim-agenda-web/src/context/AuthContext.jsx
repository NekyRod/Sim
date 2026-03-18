import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '../api/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    profesional: null,
    role: null,
    permissions: [],
    token: null
  });

  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setAuth({
          isAuthenticated: true,
          user: {
            id: decoded.user_id,
            username: decoded.sub
          },
          role: decoded.role_name || null,
          permissions: decoded.permissions || [],
          token,
          profesional: null
        });

        // Fetch professional profile on mount if token exists
        apiFetch(`${BACKEND_URL}/profesionales/me`)
          .then(profData => {
             setAuth(prev => ({ ...prev, profesional: profData }));
          })
          .catch(err => {
             console.warn("No linked professional profile found for this user.");
          });

      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    }
  }, []);

  const login = (tokenData) => {
    const { access_token, role, user_id, permissions } = tokenData;
    
    // Store in sessionStorage
    sessionStorage.setItem('auth_token', access_token);
    sessionStorage.setItem('auth_role', role);
    sessionStorage.setItem('auth_user', tokenData.username || '');

    // Decode JWT to get full payload
    try {
      const decoded = jwtDecode(access_token);
      
      const authState = {
        isAuthenticated: true,
        user: {
          id: decoded.user_id || user_id,
          username: decoded.sub
        },
        role: decoded.role_name || role,
        permissions: decoded.permissions || permissions || [],
        token: access_token,
        profesional: null
      };

      setAuth(authState);

      // Fetch professional profile
      apiFetch(`${BACKEND_URL}/profesionales/me`)
        .then(profData => {
           setAuth(prev => ({ ...prev, profesional: profData }));
        })
        .catch(err => {
           console.warn("No linked professional profile found for this user.");
        });

    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_role');
    sessionStorage.clear();
    
    setAuth({
      isAuthenticated: false,
      user: null,
      role: null,
      permissions: [],
      token: null
    });
  };

  const hasPermission = (group, action) => {
    // Admin has all permissions
    if (auth.role === 'Administrador') {
      return true;
    }
    
    // Check if user has specific permission in format "GROUP:action"
    const requiredPermission = `${group.toUpperCase()}:${action.toLowerCase()}`;
    return auth.permissions.includes(requiredPermission);
  };

  const value = {
    ...auth,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
