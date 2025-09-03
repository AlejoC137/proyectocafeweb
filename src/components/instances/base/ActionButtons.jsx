import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BUTTON_STATES, BUTTON_ICONS, BUTTON_STYLES } from '../hooks/useInstanceActions';

// Inyectar estilos CSS necesarios para las animaciones
const injectButtonAnimations = () => {
  if (document.querySelector('#action-button-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'action-button-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -8px, 0);
      }
      70% {
        transform: translate3d(0, -4px, 0);
      }
      90% {
        transform: translate3d(0, -2px, 0);
      }
    }
    
    .button-success {
      animation: bounce 0.6s ease-in-out;
    }
    
    .button-error {
      animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Componente de botones de acción estandarizados
 * Centraliza la lógica visual y de estados para botones save/delete
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} - Botones de acción renderizados
 */
export const ActionButtons = ({
  // Estados
  buttonState = BUTTON_STATES.SAVE,
  isLoading = false,
  showDelete = true,
  showEdit = true,
  disabled = false,
  
  // Acciones
  onSave,
  onDelete,
  onEdit,
  
  // Personalización
  saveLabel,
  deleteLabel,
  editLabel,
  size = "default",
  variant = "default",
  className = "",
  
  // Layout
  orientation = "horizontal", // "horizontal" | "vertical"
  spacing = "gap-2"
}) => {
  
  // Inyectar estilos CSS al montar el componente
  useEffect(() => {
    injectButtonAnimations();
  }, []);

  // Función para obtener el icono correcto según la acción
  const getIcon = (action) => {
    if (action === 'delete') {
      return {
        [BUTTON_STATES.SAVE]: '💾',
        [BUTTON_STATES.SYNCING]: '💾', 
        [BUTTON_STATES.DONE]: '💾',
        [BUTTON_STATES.ERROR]: '💾'
      }[buttonState] || '💾';
    }
    return BUTTON_ICONS[buttonState] || '💾';
  };

  // Función para obtener estilos dinámicos según el estado  
  const getButtonStyle = (action) => {
    if (action === 'save') {
      return BUTTON_STYLES[buttonState] || BUTTON_STYLES[BUTTON_STATES.SAVE];
    }
    
    // Estilos para otros botones
    const baseStyle = {
      transition: 'all 0.2s ease-in-out',
      borderRadius: '6px',
      padding: '8px 16px',
      border: 'none',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    };
    
    if (action === 'delete') {
      return {
        ...baseStyle,
        backgroundColor: buttonState === BUTTON_STATES.SYNCING ? '#f87171' : '#ef4444',
        color: 'white',
        cursor: buttonState === BUTTON_STATES.SYNCING ? 'not-allowed' : 'pointer',
        opacity: buttonState === BUTTON_STATES.SYNCING ? 0.8 : 1
      };
    }
    
    if (action === 'edit') {
      return {
        ...baseStyle,
        backgroundColor: '#f59e0b',
        color: 'white',
        cursor: 'pointer'
      };
    }
    
    return baseStyle;
  };

  // Función para obtener clases CSS según el estado y acción
  const getButtonClasses = (action) => {
    const baseClasses = "transition-all duration-200 font-medium";
    return baseClasses; // Usar estilos inline para mejor control
  };

  // Layout classes
  const containerClasses = orientation === 'vertical' 
    ? `flex flex-col ${spacing}` 
    : `flex ${spacing}`;

  return (
    <div className={`${containerClasses} ${className}`}>
      
      {/* Botón de editar */}
      {showEdit && onEdit && (
        <Button
          size={size}
          variant={variant}
          onClick={onEdit}
          disabled={disabled || isLoading}
          className={getButtonClasses('edit')}
          style={getButtonStyle('edit')}
          title="Editar"
        >
          💾 {editLabel && <span className="ml-1">{editLabel}</span>}
        </Button>
      )}

      {/* Botón de guardar con estilos dinámicos */}
      {onSave && (
        <Button
          size={size}
          variant={variant}
          onClick={onSave}
          disabled={disabled || (buttonState === BUTTON_STATES.SYNCING)}
          className={getButtonClasses('save')}
          style={getButtonStyle('save')}
          title={
            buttonState === BUTTON_STATES.SAVE ? "Guardar cambios" :
            buttonState === BUTTON_STATES.MODIFIED ? "Hay cambios sin guardar" :
            buttonState === BUTTON_STATES.SYNCING ? "Guardando..." :
            buttonState === BUTTON_STATES.DONE ? "Guardado exitoso" :
            "Error al guardar"
          }
        >
          <span style={{ 
            display: 'inline-block',
            animation: buttonState === BUTTON_STATES.SYNCING ? 'spin 1s linear infinite' : 
                      buttonState === BUTTON_STATES.MODIFIED ? 'pulse 1s ease-in-out infinite' : 'none'
          }}>
            {getIcon('save')}
          </span>
          {saveLabel && <span className="ml-1">{saveLabel}</span>}
        </Button>
      )}

      {/* Botón de eliminar */}
      {showDelete && onDelete && (
        <Button
          size={size}
          variant={variant}
          onClick={onDelete}
          disabled={disabled || (buttonState === BUTTON_STATES.SYNCING)}
          className={getButtonClasses('delete')}
          style={getButtonStyle('delete')}
          title={
            buttonState === BUTTON_STATES.SAVE ? "Eliminar ítem" :
            buttonState === BUTTON_STATES.SYNCING ? "Eliminando..." :
            buttonState === BUTTON_STATES.DONE ? "Eliminado exitoso" :
            "Error al eliminar"
          }
        >
          <span style={{ 
            display: 'inline-block',
            animation: buttonState === BUTTON_STATES.SYNCING ? 'spin 1s linear infinite' : 'none'
          }}>
            {getIcon('delete')}
          </span>
          {deleteLabel && <span className="ml-1">{deleteLabel}</span>}
        </Button>
      )}
    </div>
  );
};

/**
 * Componente compacto de botones solo con iconos
 */
export const CompactActionButtons = (props) => (
  <ActionButtons {...props} size="sm" />
);

/**
 * Componente de botones con labels
 */
export const LabeledActionButtons = (props) => (
  <ActionButtons 
    {...props} 
    saveLabel="Guardar"
    deleteLabel="Eliminar"
    editLabel="Editar"
  />
);

/**
 * Componente de botones en layout vertical
 */
export const VerticalActionButtons = (props) => (
  <ActionButtons {...props} orientation="vertical" />
);

/**
 * Preset para inventario (solo save/delete)
 */
export const InventoryActionButtons = (props) => (
  <ActionButtons 
    {...props} 
    showEdit={false}
    size="sm"
  />
);

/**
 * Preset para menú (incluye todos los botones)
 */
export const MenuActionButtons = (props) => (
  <ActionButtons 
    {...props} 
    showEdit={true}
    showDelete={true}
  />
);
