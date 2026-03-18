import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { apiFetch } from '../../api/client';
import { showToast } from '../../utils/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function GenerarAlertaModal({ onClose, pacienteId }) {
  const [tipo, setTipo] = useState('Administrativa');
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!texto.trim()) {
      showToast('Por favor escribe el detalle de la alerta', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await apiFetch(`${BACKEND_URL}/alertas/`, {
        method: 'POST',
        body: JSON.stringify({
          paciente_id: pacienteId,
          tipo,
          texto
        })
      });
      showToast('Alerta creada exitosamente');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error al crear alerta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentDate = new Date().toLocaleString('es-CO');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 text-gray-800">
            <h3 className="font-bold text-lg">Generar Alerta</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="tipo-alerta" 
                  value="Administrativa" 
                  checked={tipo === 'Administrativa'}
                  onChange={() => setTipo('Administrativa')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                Alerta Administrativa
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="tipo-alerta" 
                  value="Médica" 
                  checked={tipo === 'Médica'}
                  onChange={() => setTipo('Médica')}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                Alerta Médica
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Registrar la alerta</label>
              <textarea 
                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                rows={4}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe la alerta..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Fecha y hora</label>
              <input 
                type="text" 
                readOnly 
                value={currentDate}
                className="w-full border border-gray-200 bg-gray-50 rounded p-2 text-gray-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md disabled:opacity-50 transition-all"
            >
              {saving ? 'Guardando...' : 'Guardar Alerta'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
