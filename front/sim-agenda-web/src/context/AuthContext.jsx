import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '../api/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const AuthContext = createContext(null);

// TIMEOUTS DE PRODUCCIÓN (Aviso a los 14 mins, Expiración a los 15 mins)
const TIMEOUT_MS = 15 * 60 * 1000; 
const WARNING_MS = 14 * 60 * 1000;

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    profesional: null,
    role: null,
    permissions: [],
    token: null
  });

  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_role');
    sessionStorage.clear();
    
    setAuth({
      isAuthenticated: false,
      user: null,
      profesional: null,
      role: null,
      permissions: [],
      token: null
    });
    setShowWarning(false);
    clearTimeouts();
  }, []);

  const clearTimeouts = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  };

  const resetTimer = useCallback(() => {
    if (!auth.isAuthenticated) return;
    
    setShowWarning(false);
    clearTimeouts();

    // Timeout de Advertencia Modal
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_MS);

    // Timeout Funcional de Logout Forzoso
    timerRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [auth.isAuthenticated, logout]);

  // Manejador centralizado de Inactividad (Registra Eventos de Input)
  useEffect(() => {
    if (!auth.isAuthenticated) {
      clearTimeouts();
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    // Throttle para no reiniciar timers 1000 veces por segundo en mousemove
    let throttleTimeout = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000);
      }
    };

    resetTimer(); // init
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      clearTimeouts();
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [auth.isAuthenticated, resetTimer]);

  // Manejar el evento 401 (token expirado real en el Backend)
  useEffect(() => {
    const handleUnauthorized = () => {
      // Se detectó uso de Token Inválido o Expirado
      logout();
    };
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, [logout]);


  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Podemos verificar exp date acá localmente para un bootstrap seguro
        if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token already expired on startup");
        }
        
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
        console.error('Initial Token Validation Failed:', error);
        logout();
      }
    }
  }, [logout]);

  const login = (tokenData) => {
    const { access_token, role, user_id, permissions } = tokenData;
    
    sessionStorage.setItem('auth_token', access_token);
    sessionStorage.setItem('auth_role', role);
    sessionStorage.setItem('auth_user', tokenData.username || '');

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

  const hasPermission = (group, action) => {
    if (auth.role === 'Administrador') {
      return true;
    }
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

      {/* MODAL DE ADVERTENCIA DE INACTIVIDAD */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl max-w-sm mx-auto animate-fade-in-up">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advertencia de Inactividad</h3>
              <p className="text-sm text-gray-500 mb-6">
                Por seguridad, tu sesión expira pronto por falta de actividad. Mueve el cursor o presiona alguna tecla para continuar trabajando.
              </p>
              <button
                onClick={resetTimer}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
              >
                Mantener Sesión Activa
              </button>
            </div>
          </div>
        </div>
      )}

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
