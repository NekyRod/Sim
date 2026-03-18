// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Card, Input, Button, Badge } from '../components/ui';
import { FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

import logoGOI from '../img/logo_goi.jpg';
export default function LoginPage({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const TOKEN_URL = import.meta.env.VITE_TOKEN_URL || 'http://localhost:8000/auth/token';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!resp.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await resp.json();
      
      // Use AuthContext login with full token data
      login({
        access_token: data.access_token,
        role: data.role,
        user_id: data.user_id,
        permissions: data.permissions,
        username
      });

      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, var(--color-surface-background) 0%, var(--color-brand-primary-light) 100%)'
      }}
    >
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <img 
            src={logoGOI} 
            alt="GOI Logo" 
            className="h-16 mx-auto mb-4 object-contain"
          />
          <p className="text-[var(--color-text-secondary)]">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={<span className="flex items-center gap-2"><FaUser className="text-lg" /> <span>Usuario o Correo Electrónico</span></span>} 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu usuario o correo"
            required
            autoFocus
            icon={<FaUser />}
          />

          <Input
            label={<span className="flex items-center gap-2"><FaLock className="text-lg" /> <span>Contraseña</span></span>}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
            icon={<FaLock />}
          />

          {error && (
            <div 
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-status-danger-bg)] border border-[var(--color-status-danger-border)] flex items-start gap-2"
              role="alert"
            >
              <svg className="w-5 h-5 text-[var(--color-status-danger)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-[var(--color-status-danger)] font-medium">
                {error}
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </Button>


        </form>

        <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)] text-center">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Wolf Medic v1.0
          </p>
        </div>
      </Card>
    </div>
  );
}
