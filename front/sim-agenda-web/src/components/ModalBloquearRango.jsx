// src/components/ModalBloquearRango.jsx
import { useState, useEffect } from 'react';
import ModalBase from './ModalBase';
import { showToast } from '../utils/ui';
import { apiFetch } from '../api/client';
import { FaClock, FaExclamationTriangle, FaUser, FaStethoscope } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function toAmPm(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  let hh = parseInt(h, 10);
  const suf = hh >= 12 ? 'p. m.' : 'a. m.';
  if (hh === 0) hh = 12;
  else if (hh > 12) hh -= 12;
  return `${hh}:${m} ${suf}`;
}

export default function ModalBloquearRango({ open, profesional, fecha, appointments = [], onClose, onModifyAppointment }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collisions, setCollisions] = useState([]);

  useEffect(() => {
    if (open && profesional && fecha) {
      cargarBloqueos();
      setCollisions([]);
    }
  }, [open, profesional, fecha]);

  async function cargarBloqueos() {
    try {
      const resp = await apiFetch(`${BACKEND_URL}/rangos-bloqueados/?profesional_id=${profesional.id}&fecha=${fecha}`);
      setBloqueos(resp.data || []);
    } catch (err) {
      console.error('Error cargando bloqueos', err);
    }
  }

  function checkCollisions(start, end) {
    // start and end are in "HH:MM" format
    return appointments.filter(cita => {
      const citaStart = cita.hora.substring(0, 5);
      const citaEnd = cita.hora_fin?.substring(0, 5) || citaStart; // Fallback if no end time
      
      // Collision: (start < citaEnd) AND (end > citaStart)
      return (start < citaEnd && end > citaStart);
    });
  }

  async function agregarRango() {
    if (!desde || !hasta) {
      showToast('Debe escoger hora desde y hasta.', 'error');
      return;
    }
    if (desde >= hasta) {
      showToast('La hora de inicio debe ser menor a la hora de fin.', 'error');
      return;
    }

    const collidingApps = checkCollisions(desde, hasta);
    if (collidingApps.length > 0) {
      setCollisions(collidingApps);
      showToast('Existen citas agendadas en este rango.', 'error');
      return;
    }

    try {
      setLoading(true);
      await apiFetch(`${BACKEND_URL}/rangos-bloqueados/`, {
        method: 'POST',
        body: JSON.stringify({
          profesional_id: profesional.id,
          fecha,
          hora_inicio: desde,
          hora_fin: hasta,
          descripcion
        })
      });
      showToast('Rango bloqueado correctamente.');
      setDesde('');
      setHasta('');
      setDescripcion('');
      cargarBloqueos();
    } catch (err) {
      showToast('Error al bloquear rango.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function quitarBloqueo(id) {
    try {
      await apiFetch(`${BACKEND_URL}/rangos-bloqueados/${id}`, { method: 'DELETE' });
      showToast('Bloqueo eliminado.');
      cargarBloqueos();
    } catch (err) {
      showToast('Error al eliminar bloqueo.', 'error');
    }
  }

  if (!open) return null;

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="modal-content-horario" style={{ width: '600px' }}>
        <h3 className="modal-title">Bloquear Rango de Horas</h3>

        <p className="modal-profesional">
          <strong>Profesional:</strong> {profesional?.nombre_completo || 'N/A'}<br/>
          <strong>Fecha:</strong> {fecha}
        </p>

        <div className="modal-body">
          <div className="rango-inputs-grid">
            <div className="input-field">
              <label>Hora desde</label>
              <input
                type="time"
                step="900"
                value={desde}
                onChange={(e) => { setDesde(e.target.value); setCollisions([]); }}
              />
            </div>
            <div className="input-field">
              <label>Hora hasta</label>
              <input
                type="time"
                step="900"
                value={hasta}
                onChange={(e) => { setHasta(e.target.value); setCollisions([]); }}
              />
            </div>
            <div className="input-field full-width">
              <label>Descripción / Motivo</label>
              <input
                type="text"
                placeholder="Ej: Reunión médica, Descanso..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-principal full-width"
              onClick={agregarRango}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Agregar Bloqueo'}
            </button>
          </div>

          {collisions.length > 0 && (
            <div className="collision-alert">
              <div className="alert-header">
                <FaExclamationTriangle />
                <span>Existen {collisions.length} citas que coinciden con este rango:</span>
              </div>
              <div className="collisions-list">
                {collisions.map(cita => (
                  <div key={cita.id} className="collision-item">
                    <div className="cita-info">
                      <FaClock className="icon" /> {cita.hora.substring(0, 5)} - {cita.paciente}
                    </div>
                    <button 
                      className="btn-pequeño btn-m" 
                      onClick={() => onModifyAppointment(cita)}
                    >
                      Modificar Cita
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 className="section-subtitle">Rangos Bloqueados para este día:</h4>
          <div className="rango-lista-container">
            {bloqueos.length === 0 ? (
              <p className="empty-text">No hay rangos bloqueados.</p>
            ) : (
              <div className="rango-lista">
                {bloqueos.map((b) => (
                  <div key={b.id} className="rango-item">
                    <div className="rango-info">
                      <span className="rango-times">{toAmPm(b.hora_inicio)} - {toAmPm(b.hora_fin)}</span>
                      {b.descripcion && <span className="rango-desc">({b.descripcion})</span>}
                    </div>
                    <span
                      className="rango-x"
                      title="Eliminar bloqueo"
                      onClick={() => quitarBloqueo(b.id)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-principal"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style jsx>{`
        .rango-inputs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .input-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .full-width {
          grid-column: span 2;
        }
        .section-subtitle {
          font-size: 14px;
          color: #1e293b;
          margin: 20px 0 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .empty-text {
          color: #94a3b8;
          font-size: 13px;
          text-align: center;
          padding: 10px;
        }
        .rango-info {
          display: flex;
          flex-direction: column;
        }
        .rango-times {
          font-weight: 600;
          color: #1e293b;
        }
        .rango-desc {
          font-size: 12px;
          color: #64748b;
        }
        .collision-alert {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 15px;
        }
        .alert-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #b91c1c;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .collisions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .collision-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #fee2e2;
          font-size: 13px;
        }
        .cita-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </ModalBase>
  );
}
