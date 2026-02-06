// src/components/ModalBase.jsx
export default function ModalBase({ open, title, children, onClose, actions }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-pdf">
        <button
          type="button"
          className="btn-cerrar-pdf"
          onClick={onClose}
        >
          ×
        </button>

        {title && (
          <div className="pdf-header">
            <h3>{title}</h3>
          </div>
        )}

        <div className="pdf-preview-content">
          {children}
        </div>

        {actions && (
          <div className="modal-pdf-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
