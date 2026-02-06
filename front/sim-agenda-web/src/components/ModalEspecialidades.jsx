// src/components/ModalEspecialidades.jsx

import { FaTimes } from 'react-icons/fa';

export default function ModalEspecialidades({ 
  open, 
  especialidades, 
  especialidadPrincipalId,
  especialidadesSeleccionadas,
  onToggle,
  onClose 
}) {
  if (!open) return null;

  // Filtrar especialidades (excluir la principal seleccionada)
  const especialidadesDisponibles = especialidades.filter(
    e => !especialidadPrincipalId || e.id !== parseInt(especialidadPrincipalId)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-especialidades" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header-especialidades">
          <h3>Especialidades Secundarias</h3>
          <button className="modal-close-x" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body-especialidades">
          <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            Seleccione las especialidades secundarias del profesional:
          </p>
          
          {especialidadesDisponibles.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No hay especialidades disponibles
            </p>
          ) : (
            <table className="tabla-especialidades-modal">
              <thead>
                <tr>
                  <th>Especialidad</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {especialidadesDisponibles.map((esp) => {
                  const seleccionada = especialidadesSeleccionadas.find(e => e.id === esp.id);
                  return (
                    <tr key={esp.id}>
                      <td>{esp.nombre}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!seleccionada}
                          onChange={() => onToggle(esp)}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer-especialidades">
          <button className="btn-guardar" onClick={onClose}>
            Guardar
          </button>
          <button className="btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
