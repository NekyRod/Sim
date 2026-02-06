// src/components/ConfirmacionCitaModal.jsx
import ModalBase from './ModalBase';
import logoGOI from '../img/logo_goi.jpg';
import logoSanitas from '../img/logo-sanitas.png';

export default function ConfirmacionCitaModal({ open, datos, onClose, onDescargarPdf }) {
  if (!open) return null;

  const {
    nombrePaciente,
    docPaciente,
    fechaProgramacion,
    horaRecomendada,
    profesional,
    tipoServicio,
  } = datos || {};

  const esPBS = tipoServicio === 'PBS';

  const mensaje = esPBS
    ? 'Si no puede asistir, por favor cancele para darle oportunidad a otro paciente y no le genere multa por $14.000'
    : 'Si no puede asistir, por favor cancele para darle oportunidad a otro paciente';

  const ws = esPBS ? '3144056425' : '3144043773';

  return (
    <ModalBase
      open={open}
      title=""
      onClose={onClose}
      actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              id="btn-descargar-pdf"
              className="btn-descargar-pdf"
              onClick={onDescargarPdf}
            >
              Descargar PDF
            </button>
            <button
              type="button"
              id="btn-cerrar-pdf"
              className="btn-cerrar-pdf"
              onClick={onClose}
            >
              Cerrar
            </button>
        </div>
      }
    >
      {/* Dentro de ModalBase usamos tus clases del formulario original */}
      <div className="modal-content">
        <div className="modal-tabs">
          <button className="tab-btn active">Cita Confirmada</button>
        </div>

        <div className="pdf-preview-content">
          <div className="pdf-logos">
            <img src={logoSanitas} className="pdf-logo-left" alt="GOI" />
            {esPBS ? (
              <img src={logoGOI} className="pdf-logo-right" alt="Sanitas" />
            ) : (
              <div style={{ width: 80 }} />
            )}
          </div>

          <div className="pdf-titulo">CONFIRMACIÓN CITA</div>

          <div className="pdf-linea">
            <strong>NOMBRE DEL PACIENTE:</strong> {nombrePaciente || 'N/A'}
          </div>
          <div className="pdf-linea">
            <strong>DOC DE IDENTIDAD:</strong> {docPaciente || 'N/A'}
          </div>
          <div className="pdf-linea">
            <strong>FECHA:</strong> {fechaProgramacion || 'N/A'}
          </div>
          <div className="pdf-linea">
            <strong>HORA:</strong> {horaRecomendada || 'N/A'}
          </div>
          <div className="pdf-linea">
            <strong>PROFESIONAL:</strong> {profesional || 'N/A'}
          </div>

          <br />
          <div className="pdf-separator" />
          <br />

          <div className="pdf-linea" style={{ textAlign: 'left', fontWeight: 'bold' }}>
            DIRECCIÓN: CR 54 # 152A - 85 3er piso Barrio Mazuren
          </div>

          <br />

          <div className="pdf-mensaje">
            <strong>MENSAJE:</strong> {mensaje}
            <br />
            <strong>WS:</strong> {ws}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
