import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaServer, FaSave, FaPaperPlane, FaLock, FaUser, FaNetworkWired } from 'react-icons/fa';

export default function SmtpSettings() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'GOI Agenda',
    use_tls: true,
    use_ssl: false,
    enabled: false
  });
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const resp = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/admin/settings/smtp`);
      if (resp) {
        setFormData(prev => ({ ...prev, ...resp }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cargando configuración');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/admin/settings/smtp`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      toast.success('Configuración guardada correctamente');
      loadSettings(); // Reload to get masked password logic right if changed
    } catch (err) {
      toast.error('Error al guardar');
    }
  }

  async function handleTest() {
    if (!testEmail) return toast.error('Ingrese un email para la prueba');
    setTesting(true);
    try {
      const resp = await apiFetch(`${import.meta.env.VITE_BACKEND_URL}/admin/settings/smtp/test`, {
        method: 'POST',
        body: JSON.stringify({ email: testEmail })
      });
      if (resp.success) {
        toast.success(resp.message);
      } else {
        toast.error(resp.message);
      }
    } catch (err) {
      toast.error('Error al enviar prueba');
    } finally {
      setTesting(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Toaster position="top-right" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white flex items-center gap-3">
          <FaServer className="text-2xl text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">Configuración SMTP</h1>
            <p className="text-slate-300 text-sm">Gestiona el servidor de correo para notificaciones.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Main Config */}
          <div className="space-y-4">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FaNetworkWired /> Servidor</h3>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Host SMTP</label>
                <input 
                  type="text" name="host" 
                  value={formData.host} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                  placeholder="smtp.gmail.com" required 
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Puerto</label>
                <input 
                  type="number" name="port" 
                  value={formData.port} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                  placeholder="587" required 
                />
             </div>
             
             <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="use_tls" checked={formData.use_tls} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded bg-white" />
                  <span className="text-sm font-medium text-slate-700">Usar TLS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="use_ssl" checked={formData.use_ssl} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded bg-white" />
                  <span className="text-sm font-medium text-slate-700">Usar SSL</span>
                </label>
             </div>
          </div>

          {/* Auth */}
          <div className="space-y-4">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FaLock /> Autenticación</h3>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Usuario / Email</label>
                <input 
                  type="text" name="username" 
                  value={formData.username} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                  placeholder="usuario@dominio.com" 
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
                <input 
                  type="password" name="password" 
                  value={formData.password} onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                  placeholder={formData.password === "********" ? "******** (Guardada)" : "Nueva contraseña"} 
                />
             </div>
          </div>

          {/* Sender Info */}
          <div className="col-span-1 md:col-span-2 space-y-4 border-t pt-4">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FaUser /> Remitente</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Email Remitente (From)</label>
                  <input 
                    type="email" name="from_email" 
                    value={formData.from_email} onChange={handleChange}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                    placeholder="no-reply@dominio.com" 
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Remitente</label>
                  <input 
                    type="text" name="from_name" 
                    value={formData.from_name} onChange={handleChange}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" 
                    placeholder="Agenda GOI" 
                  />
               </div>
             </div>
          </div>

          {/* Actions */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-between border-t pt-6 mt-2">
             <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                <div className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${formData.enabled ? 'bg-green-500' : ''}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.enabled ? 'translate-x-4' : ''}`}></div>
                </div>
                <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} className="hidden" />
                <span className="font-semibold text-slate-700">{formData.enabled ? 'Servicio Habilitado' : 'Servicio Deshabilitado'}</span>
             </label>

             <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg active:scale-95">
                <FaSave /> Guardar Configuración
             </button>
          </div>

        </form>
      </motion.div>

      {/* Test Panel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-md border border-slate-100 p-6"
      >
        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
           <FaPaperPlane className="text-orange-500" /> Pruebas de Envío
        </h3>
        <div className="flex gap-3">
           <input 
             type="email" 
             value={testEmail} 
             onChange={(e) => setTestEmail(e.target.value)}
             placeholder="Email destinatario para prueba..."
             className="flex-1 p-2.5 border rounded-lg bg-white"
           />
           <button 
             onClick={handleTest}
             disabled={testing || !formData.enabled}
             className="bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {testing ? 'Enviando...' : 'Enviar Prueba'}
           </button>
        </div>
        {!formData.enabled && <p className="text-xs text-orange-500 mt-2">* Habilite y guarde la configuración para probar.</p>}
      </motion.div>
    </div>
  );
}
