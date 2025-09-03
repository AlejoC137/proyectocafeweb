/**
 * Utilidades centralizadas para mostrar notificaciones tipo toast
 * sin recargar la página
 */

// Inyectar estilos CSS necesarios para las animaciones
const injectToastStyles = () => {
  if (document.querySelector('#toast-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Muestra un toast de éxito
 * @param {string} message - Mensaje a mostrar
 */
export const showSuccessToast = (message) => {
  // Asegurar que los estilos están inyectados
  injectToastStyles();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto remove después de 3 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

/**
 * Muestra un toast de error
 * @param {string} message - Mensaje a mostrar
 */
export const showErrorToast = (message) => {
  // Asegurar que los estilos están inyectados
  injectToastStyles();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto remove después de 5 segundos (error necesita más tiempo)
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
};

/**
 * Muestra un toast de información
 * @param {string} message - Mensaje a mostrar
 */
export const showInfoToast = (message) => {
  // Asegurar que los estilos están inyectados
  injectToastStyles();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto remove después de 3 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

/**
 * Muestra un toast de advertencia
 * @param {string} message - Mensaje a mostrar
 */
export const showWarningToast = (message) => {
  // Asegurar que los estilos están inyectados
  injectToastStyles();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f59e0b;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto remove después de 4 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
};

/**
 * Remueve todos los toasts activos
 */
export const clearAllToasts = () => {
  const toasts = document.querySelectorAll('[style*="position: fixed"][style*="top: 20px"][style*="right: 20px"]');
  toasts.forEach(toast => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  });
};
