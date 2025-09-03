import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActionButtons } from './ActionButtons';
import { StatusButtons } from './StatusButtons';

/**
 * Componente base InstanceCard con arquitectura de slots
 * Proporciona estructura unificada para todos los componentes Instance
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} - Card renderizada con slots
 */
export const InstanceCard = ({
  // Datos principales
  title,
  subtitle,
  data,
  
  // Configuración de visualización
  variant = 'default', // 'default' | 'compact' | 'detailed' | 'display'
  size = 'default',    // 'sm' | 'default' | 'lg'
  
  // Estados
  editMode = false,
  isLoading = false,
  disabled = false,
  
  // Acciones principales
  onSave,
  onDelete,
  onEdit,
  onStatusChange,
  onClick,
  
  // Estado de botones (del hook useInstanceActions)
  buttonState,
  
  // Configuración de botones
  showActions = true,
  showStatusButtons = false,
  showEdit = true,
  showDelete = true,
  entityType,
  
  // Slots de contenido
  children,           // Contenido principal
  headerSlot,         // Contenido adicional en header
  footerSlot,         // Contenido adicional en footer
  actionsSlot,        // Acciones personalizadas en lugar de las estándar
  
  // Personalización CSS
  className = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
  
  // Configuraciones específicas
  collapsible = false,
  defaultExpanded = true
}) => {

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Clases CSS según variante
  const getVariantClasses = () => {
    const variants = {
      default: 'w-full shadow-md rounded-lg border border-gray-200',
      compact: 'w-full shadow-sm rounded border border-gray-100',
      detailed: 'w-full shadow-lg rounded-xl border border-gray-300',
      display: 'w-[280px] h-[280px] flex-shrink-0 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group overflow-hidden'
    };
    return variants[variant] || variants.default;
  };

  // Clases CSS según tamaño
  const getSizeClasses = () => {
    const sizes = {
      sm: 'text-sm',
      default: '',
      lg: 'text-lg'
    };
    return sizes[size] || '';
  };

  // Función para toggle de expansión
  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card 
      className={`${getVariantClasses()} ${getSizeClasses()} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className={`p-4 flex flex-col gap-4 ${contentClassName}`}>
        
        {/* HEADER SECTION */}
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          
          {/* Título y subtítulo */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-800 truncate">
              {title || 'Sin título'}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Slot de header personalizado */}
          {headerSlot && (
            <div className="flex-shrink-0">
              {headerSlot}
            </div>
          )}

          {/* Botón de colapsar/expandir */}
          {collapsible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? '🔽' : '▶️'}
            </button>
          )}

          {/* Acciones principales */}
          {showActions && (actionsSlot || (onSave || onDelete || onEdit)) && (
            <div className="flex-shrink-0">
              {actionsSlot || (
                <ActionButtons
                  buttonState={buttonState}
                  isLoading={isLoading}
                  onSave={onSave}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  showDelete={showDelete}
                  showEdit={showEdit}
                  disabled={disabled}
                  size={variant === 'compact' ? 'sm' : 'default'}
                />
              )}
            </div>
          )}
        </div>

        {/* STATUS BUTTONS SECTION */}
        {showStatusButtons && isExpanded && (
          <StatusButtons
            currentStatus={data?.Estado}
            entityType={entityType}
            onStatusChange={onStatusChange}
            disabled={disabled}
            size={variant === 'compact' ? 'sm' : 'default'}
          />
        )}

        {/* MAIN CONTENT SECTION */}
        {isExpanded && children && (
          <div className="flex-1">
            {children}
          </div>
        )}

        {/* FOOTER SECTION */}
        {isExpanded && footerSlot && (
          <div className={`mt-auto ${footerClassName}`}>
            {footerSlot}
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

/**
 * Variantes predefinidas del InstanceCard
 */

export const CompactInstanceCard = (props) => (
  <InstanceCard {...props} variant="compact" />
);

export const DetailedInstanceCard = (props) => (
  <InstanceCard {...props} variant="detailed" />
);

export const DisplayInstanceCard = (props) => (
  <InstanceCard {...props} variant="display" />
);

export const EditableInstanceCard = (props) => (
  <InstanceCard 
    {...props} 
    showActions={true}
    showStatusButtons={true}
    editMode={true}
  />
);

export const ReadOnlyInstanceCard = (props) => (
  <InstanceCard 
    {...props} 
    showActions={false}
    showStatusButtons={false}
    editMode={false}
  />
);

/**
 * Card colapsible por defecto
 */
export const CollapsibleInstanceCard = (props) => (
  <InstanceCard 
    {...props} 
    collapsible={true}
    defaultExpanded={false}
  />
);

/**
 * Presets específicos por entidad
 */

export const InventoryInstanceCard = (props) => (
  <InstanceCard 
    {...props}
    entityType="ItemsAlmacen"
    showStatusButtons={true}
    variant="detailed"
  />
);

export const MenuInstanceCard = (props) => (
  <InstanceCard 
    {...props}
    entityType="Menu"
    showStatusButtons={true}
    variant="default"
  />
);

export const StaffInstanceCard = (props) => (
  <InstanceCard 
    {...props}
    entityType="Staff"
    showStatusButtons={true}
    variant="detailed"
  />
);

export const WorkIssueInstanceCard = (props) => (
  <InstanceCard 
    {...props}
    entityType="WorkIssue"
    showStatusButtons={true}
    variant="default"
  />
);
