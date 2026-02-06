// src/components/ModalVerCitas.jsx
import ModalBase from './ModalBase';
import { FaClock, FaUser, FaStethoscope } from 'react-icons/fa';

export default function ModalVerCitas({ 
  open, 
  profesional, 
  fecha, 
  appointments = [], 
  onClose, 
  onModifyAppointment,
  permiteModificar = false 
}) {
  if (!open) return null;

  return (
    <ModalBase open={open} onClose={onClose}>
      <div className="modal-content-horario" style={{ width: '600px' }}>
        <h3 className="modal-title">Citas Agendadas</h3>

        <p className="modal-profesional">
          <strong>Profesional:</strong> {profesional?.nombre_completo || 'N/A'}<br/>
          <strong>Fecha:</strong> {fecha}
        </p>

        <div className="modal-body">
          {appointments.length === 0 ? (
            <p className="empty-state">No hay citas agendadas para este día.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((cita) => (
                <div key={cita.id} className="appointment-card-mini">
                  <div className="appointment-time">
                    <FaClock className="icon" />
                    <span>{cita.hora.substring(0, 5)} - {cita.hora_fin?.substring(0, 5)}</span>
                  </div>
                  <div className="appointment-info">
                    <div className="patient-name">
                      <FaUser className="icon" />
                      <strong>{cita.paciente}</strong>
                    </div>
                    <div className="specialty-info">
                      <FaStethoscope className="icon" />
                      <span>{cita.motivo}</span>
                    </div>
                  </div>
                  {permiteModificar && (
                    <button 
                      className="btn-pequeño btn-m" 
                      onClick={() => onModifyAppointment(cita)}
                      title="Modificar Cita"
                    >
                      M
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
        .appointments-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
          padding: 10px 0;
        }
        .appointment-card-mini {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .appointment-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: #2563eb;
          min-width: 120px;
        }
        .appointment-info {
          flex: 1;
        }
        .patient-name, .specialty-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .patient-name {
          color: #1e293b;
          margin-bottom: 4px;
        }
        .specialty-info {
          color: #64748b;
        }
        .icon {
          font-size: 14px;
          opacity: 0.7;
        }
      `}</style>
    </ModalBase>
  );
}
