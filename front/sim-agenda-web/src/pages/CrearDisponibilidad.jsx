// src/pages/CrearDisponibilidad.jsx
import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { showToast, showConfirm } from '../utils/ui';
import { FaClock, FaTrash, FaMagic, FaSave, FaUserMd } from 'react-icons/fa';
import '../styles/estilos.css';

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

  const [showWizard, setShowWizard] = useState(null); // ID del día que muestra el wizard

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
      const resp = await apiFetch(`${BACKEND_URL}/profesionales`);
      setProfesionales(resp.data || []);
    } catch (err) {
      console.error('Error cargando profesionales', err);
    }
  }

  async function cargarDisponibilidadProfesional(id) {
    setLoading(true);
    try {
      const resp = await apiFetch(`${BACKEND_URL}/disponibilidades/profesional/${id}`);
      // El backend devuelve un objeto con los días como llaves (1-6)
      const data = resp.data || {};
      const baseDispo = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      
      // Asegurarse de que cada día tenga su array
      Object.keys(baseDispo).forEach(dia => {
        if (data[dia]) {
          baseDispo[dia] = data[dia].map(d => ({
            ...d,
            // Asegurarse de que las horas tengan formato HH:mm para comparar
            hora_inicio: d.hora_inicio.substring(0, 5),
            hora_fin: d.hora_fin.substring(0, 5)
          }));
        }
      });
      
      setDisponibilidades(baseDispo);
    } catch (err) {
      console.error('Error cargando disponibilidad', err);
      showToast('Error al cargar la disponibilidad del profesional', 'error');
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
    
    if (tipo === 'Mañana') {
      desde = '08:00';
      hasta = '12:00';
    } else if (tipo === 'Tarde') {
      desde = '13:00';
      hasta = '17:40';
    }
    
    setInputs(prev => ({
      ...prev,
      [dia]: { desde, hasta }
    }));
    setShowWizard(null);
  };

  const agregarRango = (dia) => {
    const { desde, hasta } = inputs[dia];
    
    if (!desde || !hasta) {
      showToast('Debe seleccionar hora de inicio y fin', 'error');
      return;
    }
    
    if (desde >= hasta) {
      showToast('La hora de inicio debe ser menor a la hora de fin', 'error');
      return;
    }

    const rangosDia = disponibilidades[dia];
    
    // Validar si ya existe el mismo rango
    const existeIgual = rangosDia.find(r => r.hora_inicio === desde && r.hora_fin === hasta);
    if (existeIgual) {
      showToast(`Ya existe este rango para el día seleccionado`, 'error');
      return;
    }

    // Validar traslapes: (start1 < end2) AND (start2 < end1)
    const traslape = rangosDia.find(r => (desde < r.hora_fin && r.hora_inicio < hasta));
    if (traslape) {
      showToast('El rango se cruza con otros rangos del mismo día', 'error');
      return;
    }

    // Agregar el rango localmente
    const nuevoRango = {
      hora_inicio: desde,
      hora_fin: hasta
    };

    setDisponibilidades(prev => ({
      ...prev,
      [dia]: [...prev[dia], nuevoRango].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }));

    // Limpiar inputs del día
    setInputs(prev => ({
      ...prev,
      [dia]: { desde: '', hasta: '' }
    }));
  };

  const eliminarRango = (dia, index) => {
    setDisponibilidades(prev => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== index)
    }));
  };

  async function guardarDisponibilidad() {
    if (!profesionalId) {
      showToast('Debe seleccionar un profesional', 'error');
      return;
    }

    const ok = await showConfirm('¿Está seguro de guardar la disponibilidad actual para este profesional? Se reemplazarán los datos anteriores.');
    if (!ok) return;

    // Aplanar las disponibilidades para el lote
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
      console.error('Error al guardar', err);
      showToast('Error al guardar la disponibilidad', 'error');
    } finally {
      setLoading(false);
    }
  }

  const diasNombres = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  function toAmPm(time) {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hh = parseInt(h, 10);
    const suf = hh >= 12 ? 'p. m.' : 'a. m.';
    if (hh === 0) hh = 12;
    else if (hh > 12) hh -= 12;
    return `${hh}:${m} ${suf}`;
  }

  return (
    <section id="crear-disponibilidad-section" className="crear-dispo-wrapper">
      <div className="crear-dispo-panel">
        <h2>
          <FaClock style={{ marginRight: '10px' }} />
          Crear Disponibilidad
        </h2>

        <div className="crear-disponibilidad-prof" style={{ marginBottom: '20px' }}>
          <label className="crear-dispo-label">
            Profesional
            <select 
              id="crear-disponibilidad-profesional"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
            >
              <option value="">Seleccione uno</option>
              {profesionales.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_completo} {p.numero_identificacion}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="crear-disponibilidad-tabla-wrapper">
          <table className="dispo-tabla">
            <thead>
              <tr>
                {Object.values(diasNombres).map(nombre => (
                  <th key={nombre}>{nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[1, 2, 3, 4, 5, 6].map(dia => (
                  <td key={dia} className="dispo-dia-col">
                    <div className="dispo-celda-rangos">
                      {disponibilidades[dia].length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '10px 0' }}>
                          Sin rangos
                        </p>
                      ) : (
                        disponibilidades[dia].map((r, idx) => (
                          <div key={idx} className="dispo-rango-item">
                            <span className="dispo-rango-texto">
                              {toAmPm(r.hora_inicio)} - {toAmPm(r.hora_fin)}
                            </span>
                            <FaTrash 
                              className="dispo-rango-x" 
                              onClick={() => eliminarRango(dia, idx)}
                              title="Eliminar rango"
                            />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="dispo-control-dia" style={{ marginTop: '15px', borderTop: '1px solid #d4d9e6', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="dispo-subtitulo">Agregar rango</span>
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="btn-wizard" 
                            title="Ayuda / Presets"
                            onClick={() => setShowWizard(showWizard === dia ? null : dia)}
                            style={{ background: 'none', border: 'none', color: '#295080', cursor: 'pointer', fontSize: '16px' }}
                          >
                            <FaMagic />
                          </button>
                          {showWizard === dia && (
                            <div className="wizard-dropdown" style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              background: '#fff',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              borderRadius: '4px',
                              zIndex: 10,
                              minWidth: '100px',
                              padding: '5px 0'
                            }}>
                              <div 
                                className="wizard-item" 
                                onClick={() => aplicarPreset(dia, 'Mañana')}
                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                              >
                                Mañana
                              </div>
                              <div 
                                className="wizard-item" 
                                onClick={() => aplicarPreset(dia, 'Tarde')}
                                style={{ padding: '8px 12px', cursor: 'pointer' }}
                              >
                                Tarde
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="dispo-rango-linea">
                        <span>Desde</span>
                        <input 
                          type="time" 
                          value={inputs[dia].desde}
                          onChange={(e) => handleInputChange(dia, 'desde', e.target.value)}
                        />
                      </div>
                      <div className="dispo-rango-linea">
                        <span>Hasta</span>
                        <input 
                          type="time" 
                          value={inputs[dia].hasta}
                          onChange={(e) => handleInputChange(dia, 'hasta', e.target.value)}
                        />
                      </div>
                      <button 
                        className="btn-agregar-rango" 
                        onClick={() => agregarRango(dia)}
                        style={{ width: '100%', marginTop: '5px' }}
                      >
                        Agregar rango
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="crear-dispo-footer">
          <button 
            className="btn-guardar-disponibilidad"
            onClick={guardarDisponibilidad}
            disabled={loading || !profesionalId}
          >
            <FaSave style={{ marginRight: '8px' }} />
            {loading ? 'Guardando...' : 'Guardar Disponibilidad'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .dispo-dia-col {
          width: 16.66%;
          background: #f0f7e5; /* Verde muy claro para las celdas */
        }
        .wizard-item:hover {
          background: #f1f5f9;
        }
        .dispo-rango-item {
          border: 1px solid #b3d9ff;
          background: #fff;
        }
      `}</style>
    </section>
  );
}
