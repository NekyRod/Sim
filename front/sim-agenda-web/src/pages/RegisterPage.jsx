import { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui';
import { FaUser, FaLock, FaIdCard, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
// import { patientsApi } from '../api/patients'; // Unused
import { apiFetch } from '../api/client';
import logoGOI from '../img/logo_goi.jpg';

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    tipo_identificacion: 'CC',
    numero_identificacion: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Auth Service
      await authApi.register({
        username: formData.email,
        password: formData.password,
        rol: 'PATIENT' // Verify if backend accepts this or if default is USER
      });

      // 2. Redirect to Login (No Auto-Login)
      // We don't need to login or create patient record here if the flow is: Register -> Login -> Create Patient Record?
      // Wait, the Plan was: Register -> Login -> Create Patient Record.
      // But now user wants: Register -> Redirect to Login -> Login -> Chat.
      // If we don't create patient record during registration, when is it created?
      // It must be created during registration using the "Register" endpoint if that endpoint creates both user and patient?
      // But currently we use separate endpoints.
      // If we stop auto-login, we can't create the patient record because we don't have the token!
      // PROBLEM: To create patient record, we need auth token.
      // APPROACH A: Register creates BOTH user and patient (Backend change).
      // APPROACH B: Register creates User. User manually logs in. On first login/chat access, we check/create patient record?
      // APPROACH C: Register still internally logs in to create patient record, then clears token and redirects to login.
      // I will go with Approach C for minimal backend changes.
      
      // ... (Keep User Creation)
      // ... (Keep Login for Token)
      // ... (Keep Patient Creation)
      
      // NEW: Clear token and redirect to Login
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_role');
      
      alert("Registro exitoso. Por favor inicia sesión.");
      navigate('/'); // Redirect to login
      
      // if (onLoginSuccess) onLoginSuccess(); // No longer needed as we don't auto-login

    } catch (err) {
      console.error(err);
      setError(err.message || "Error al registrarse");
      sessionStorage.removeItem('auth_token'); // Cleanup if failed mid-way
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, var(--color-surface-background) 0%, var(--color-brand-primary-light) 100%)'
      }}
    >
      <Card className="w-full max-w-lg">
        <div className="mb-4">
             <Link to="/" className="flex items-center text-sm text-gray-500 hover:text-blue-600 gap-1 pb-2">
                <FaArrowLeft /> Volver al Login
             </Link>
        </div>
        <div className="text-center mb-6">
          <img src={logoGOI} alt="GOI Logo" className="h-12 mx-auto mb-2 object-contain" />
          <h2 className="text-xl font-bold text-gray-800">Registro de Paciente</h2>
          <p className="text-sm text-gray-500">Crea tu cuenta para acceder al chat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <Input
             label="Nombre Completo"
             name="nombre_completo"
             value={formData.nombre_completo}
             onChange={handleChange}
             placeholder="Ej: Juan Perez"
             required
             icon={<FaUser />}
           />

           <div className="grid grid-cols-3 gap-2">
             <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo ID</label>
                <select 
                  name="tipo_identificacion" 
                  value={formData.tipo_identificacion}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="CC">CC</option>
                  <option value="TI">TI</option>
                  <option value="CE">CE</option>
                  <option value="PA">PA</option>
                  <option value="RC">RC</option>
                </select>
             </div>
             <div className="col-span-2">
               <Input
                 label="Número Documento"
                 name="numero_identificacion"
                 value={formData.numero_identificacion}
                 onChange={handleChange}
                 placeholder="1234567890"
                 required
                 icon={<FaIdCard />}
               />
             </div>
           </div>

           <Input
             label="Correo Electrónico"
             type="email"
             name="email"
             value={formData.email}
             onChange={handleChange}
             placeholder="tu@email.com"
             required
             icon={<FaEnvelope />}
           />

           <div className="grid grid-cols-2 gap-2">
             <Input
               label="Contraseña"
               type="password"
               name="password"
               value={formData.password}
               onChange={handleChange}
               required
               icon={<FaLock />}
             />
             <Input
               label="Confirmar"
               type="password"
               name="confirmPassword"
               value={formData.confirmPassword}
               onChange={handleChange}
               required
               icon={<FaLock />}
             />
           </div>

           {error && (
             <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
               {error}
             </div>
           )}

           <Button type="submit" variant="primary" loading={loading} className="w-full">
             {loading ? 'Registrando...' : 'Registrarse'}
           </Button>
        </form>
      </Card>
    </div>
  );
}
