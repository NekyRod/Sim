import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes, FaStethoscope, FaClipboardList } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function AlertCenter() {
  const [alertas, setAlertas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch alertas
  const loadAlertas = async () => {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/alertas/`);
      setAlertas(resp.data || []);
    } catch (err) {
      console.error('Error cargando alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertas();
    // Poll every 30 seconds
    const interval = setInterval(loadAlertas, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDesactivar = async (id, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`${BACKEND_URL}/alertas/${id}/desactivar`, { method: 'PUT' });
      setAlertas(alertas.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error desactivando alerta', err);
    }
  };

  const count = alertas.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campana Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-blue-100 focus:outline-none transition-colors group"
        title="Centro de Alertas"
      >
        <FaBell className="text-2xl group-hover:rotate-12 transition-transform origin-top" />
        {count > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm shadow-red-500/50 min-w-[18px]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] origin-top-right flex flex-col max-h-[80vh]"
          >
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center z-10 sticky top-0">
              <h3 className="font-bold text-gray-800 text-base">Alertas Activas</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {count} {count === 1 ? 'alerta' : 'alertas'}
              </span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-gray-50/50">
              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
              ) : count === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-2 opacity-20">🔕</span>
                  <p className="text-gray-500 text-sm">No hay alertas registradas.</p>
                </div>
              ) : (
                alertas.map(alerta => (
                  <div 
                    key={alerta.id} 
                    className={`relative p-4 rounded-lg border-l-4 shadow-sm bg-white transition-all hover:shadow-md ${
                      alerta.tipo === 'Médica' ? 'border-red-500 hover:border-red-600' : 'border-blue-500 hover:border-blue-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                       <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                          {alerta.tipo === 'Médica' ? <FaStethoscope className="text-red-500" /> : <FaClipboardList className="text-blue-500" />}
                          {alerta.tipo}
                       </div>
                       <button 
                         onClick={(e) => handleDesactivar(alerta.id, e)}
                         className="text-gray-400 hover:text-gray-600 p-1 -mr-2 -mt-2 transition-colors"
                         title="Descartar"
                       >
                         <FaTimes size={12} />
                       </button>
                    </div>
                    
                    <div className="text-xs text-blue-600 font-medium mb-2 truncate">
                      👤 {alerta.paciente_nombre}
                    </div>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                      {alerta.texto}
                    </p>

                    <div className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                       <span>{new Date(alerta.created_at).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
