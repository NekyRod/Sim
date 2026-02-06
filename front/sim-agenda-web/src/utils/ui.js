// src/utils/ui.js
import logoGOI from '../img/logo_goi.jpg';
import logoSanitas from '../img/logo-sanitas.png';
// Muestra un toast usando el <div id="toast"> del HTML
export function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}
// Modal de confirmación personalizado (reemplaza confirm())
export function showConfirm(mensaje, opciones = {}) {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    
    // Contenido del modal
    modal.innerHTML = `
      <div class="confirm-content">
        <h3>${opciones.titulo || 'Wolf Medic'}</h3>
        <p>${mensaje}</p>
        <div class="confirm-buttons">
          <button class="confirm-btn-accept" id="confirm-accept">${opciones.confirmText || 'Aceptar'}</button>
          <button class="confirm-btn-cancel" id="confirm-cancel">${opciones.cancelText || 'Cancelar'}</button>
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Mostrar con animación
    setTimeout(() => overlay.classList.add('show'), 10);
    
    // Función para cerrar el modal
    function cerrarModal(resultado) {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(resultado);
      }, 200);
    }
    
    // Event listeners
    document.getElementById('confirm-accept').addEventListener('click', () => cerrarModal(true));
    document.getElementById('confirm-cancel').addEventListener('click', () => cerrarModal(false));
    
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        cerrarModal(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}