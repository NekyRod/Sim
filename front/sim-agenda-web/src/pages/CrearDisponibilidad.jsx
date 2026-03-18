import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { showToast, showConfirm } from '../utils/ui';
import { FaClock, FaTrash, FaMagic, FaSave, FaUserMd, FaPlus } from 'react-icons/fa';
import { Card, Input, Select, Button, Badge } from '../components/ui';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function CrearDisponibilidad() {
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalId, setProfesionalId] = useState('');
  const [disponibilidades, setDisponibilidades] = useState({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const [loading, setLoading] = useState(false);
  
  // Estados para los inputs de cada día
  const [inputs, setInputs] = useState({
    1: { desde: '', hasta: '' },
    2: { desde: '', hasta: '' },
    3: { desde: '', hasta: '' },
    4: { desde: '', hasta: '' },
    5: { desde: '', hasta: '' },
    6: { desde: '', hasta: '' },
  });

  const [showWizard, setShowWizard] = useState(null); 

  useEffect(() => {
    cargarProfesionales();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarDisponibilidadProfesional(profesionalId);
    } else {
      setDisponibilidades({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
    }
  }, [profesionalId]);

  async function cargarProfesionales() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/profesionales/`);
      setProfesionales(resp.data || []);
    } catch (err) { console.error(err); }
  }

  async function cargarDisponibilidadProfesional(id) {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/disponibilidades/profesional/${id}`);
      const data = resp.data || {};
      const baseDispo = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      
      Object.keys(baseDispo).forEach(dia => {
        if (data[dia]) {
          baseDispo[dia] = data[dia].map(d => ({
            ...d,
            hora_inicio: d.hora_inicio.substring(0, 5),
            hora_fin: d.hora_fin.substring(0, 5)
          }));
        }
      });
      
      setDisponibilidades(baseDispo);
    } catch (err) {
      showToast('Error al cargar la disponibilidad', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (dia, field, value) => {
    setInputs(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value }
    }));
  };

  const aplicarPreset = (dia, tipo) => {
    let desde = '';
    let hasta = '';
    if (tipo === 'Mañana') { desde = '08:00'; hasta = '12:00'; } 
    else if (tipo === 'Tarde') { desde = '13:00'; hasta = '17:40'; }
    
    setInputs(prev => ({ ...prev, [dia]: { desde, hasta } }));
    setShowWizard(null);
  };

  const agregarRango = (dia) => {
    const { desde, hasta } = inputs[dia];
    
    if (!desde || !hasta) return showToast('Seleccione inicio y fin', 'error');
    if (desde >= hasta) return showToast('Inicio debe ser menor a fin', 'error');

    const rangosDia = disponibilidades[dia];
    const existeIgual = rangosDia.find(r => r.hora_inicio === desde && r.hora_fin === hasta);
    if (existeIgual) return showToast(`Rango duplicado`, 'error');

    const traslape = rangosDia.find(r => (desde < r.hora_fin && r.hora_inicio < hasta));
    if (traslape) return showToast('Cruce con otros rangos', 'error');

    const nuevoRango = { hora_inicio: desde, hora_fin: hasta };

    setDisponibilidades(prev => ({
      ...prev,
      [dia]: [...prev[dia], nuevoRango].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }));

    setInputs(prev => ({ ...prev, [dia]: { desde: '', hasta: '' } }));
  };

  const eliminarRango = (dia, index) => {
    setDisponibilidades(prev => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== index)
    }));
  };

  async function guardarDisponibilidad() {
    if (!profesionalId) return showToast('Seleccione un profesional', 'error');
    if (!await showConfirm('¿Guardar cambios? Se reemplazarán los datos anteriores.')) return;

    const payload = [];
    Object.keys(disponibilidades).forEach(dia => {
      disponibilidades[dia].forEach(r => {
        payload.push({
          dia_semana: parseInt(dia),
          hora_inicio: r.hora_inicio,
          hora_fin: r.hora_fin
        });
      });
    });

    try {
      setLoading(true);
      await apiFetch(`${BACKEND_URL}/disponibilidades/profesional/${profesionalId}/lote`, {
        method: 'POST',
        body: JSON.stringify({ disponibilidades: payload })
      });
      showToast('Disponibilidad guardada correctamente');
    } catch (err) {
      showToast('Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  }

  const diasNombres = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

  function toAmPm(time) {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hh = parseInt(h, 10);
    const suf = hh >= 12 ? 'p.m.' : 'a.m.';
    if (hh === 0) hh = 12; else if (hh > 12) hh -= 12;
    return `${hh}:${m} ${suf}`;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-brand-primary)]">Disponibilidad Profesional</h1>
          <p className="text-[var(--color-text-secondary)]">Configure los horarios de atención por semana.</p>
        </div>
        <Button 
          onClick={guardarDisponibilidad} 
          disabled={loading || !profesionalId}
          className="flex items-center gap-2"
        >
          <FaSave /> {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Card>
        <div className="max-w-md">
           <Select
              label="Seleccione Profesional"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              options={[{value:'', label:'Seleccione...'}, ...profesionales.map(p => ({value:p.id, label:`${p.nombre_completo} - ${p.numero_identificacion}`}))]}
           />
        </div>
      </Card>

      {/* Grid Dias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(dia => (
          <Card key={dia} className="flex flex-col h-full !p-0 overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Header Dia */}
            <div className="bg-slate-50 border-b border-gray-200 p-3 text-center font-bold text-slate-700 uppercase tracking-wide text-sm flex justify-between items-center group">
              <span>{diasNombres[dia]}</span>
              <div className="relative">
                 <button 
                   onClick={() => setShowWizard(showWizard === dia ? null : dia)}
                   className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                   title="Presets rápidos"
                 >
                   <FaMagic />
                 </button>
                 {showWizard === dia && (
                   <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border border-gray-100 z-50 w-32 py-1 text-left">
                      <div onClick={() => aplicarPreset(dia, 'Mañana')} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-700">Mañana (8-12)</div>
                      <div onClick={() => aplicarPreset(dia, 'Tarde')} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs font-medium text-gray-700">Tarde (1-5:40)</div>
                   </div>
                 )}
              </div>
            </div>

            {/* Lista Rangos */}
            <div className="flex-1 p-3 space-y-2 min-h-[120px] bg-white">
              {disponibilidades[dia].length === 0 ? (
                <div className="text-center py-6 text-gray-300 text-xs italic">Sin horarios</div>
              ) : (
                disponibilidades[dia].map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-blue-50 text-blue-800 px-3 py-2 rounded-md border border-blue-100">
                    <span className="font-mono text-xs font-semibold">{toAmPm(r.hora_inicio)} - {toAmPm(r.hora_fin)}</span>
                    <button 
                      onClick={() => eliminarRango(dia, idx)}
                      className="text-blue-300 hover:text-red-500 transition-colors"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Input */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2">
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Inicio</label>
                   <input 
                     type="time" 
                     className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                     value={inputs[dia].desde}
                     onChange={(e) => handleInputChange(dia, 'desde', e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Fin</label>
                   <input 
                     type="time" 
                     className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                     value={inputs[dia].hasta}
                     onChange={(e) => handleInputChange(dia, 'hasta', e.target.value)}
                   />
                 </div>
               </div>
               <Button 
                 variant="secondary" 
                 size="sm" 
                 className="w-full justify-center !text-xs !py-1.5"
                 onClick={() => agregarRango(dia)}
               >
                 <FaPlus size={10} className="mr-1" /> Agregar
               </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
