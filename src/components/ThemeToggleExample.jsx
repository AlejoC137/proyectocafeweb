import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

const ThemeToggleExample = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ok');

  useEffect(() => {
    // Aplicar o remover la clase ' ' al elemento html
    if (isDarkMode) {
      document.documentElement.classList.add(' ');
    } else {
      document.documentElement.classList.remove(' ');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-SpaceGrotesk font-bold text-foreground">
          Sistema de Botones Funcional
        </h1>
        <Button
          onClick={toggleTheme}
          variant="default"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados OK/NA */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold mb-3">Estados PC: OK 🟢 | NA 🔘</h2>
          <p className="text-muted-foreground mb-4">
            Los botones cambian de color según el estado seleccionado.
            Solo iconos como indicaste 💾
          </p>
          <div className="flex gap-3 mb-4">
            <Button 
              variant={selectedStatus === 'ok' ? 'status-ok' : 'outline'}
              onClick={() => setSelectedStatus('ok')}
            >
              🟢 OK
            </Button>
            <Button 
              variant={selectedStatus === 'na' ? 'status-na' : 'outline'}
              onClick={() => setSelectedStatus('na')}
            >
              🔘 NA
            </Button>
            <Button 
              variant={selectedStatus === 'pending' ? 'status-pending' : 'outline'}
              onClick={() => setSelectedStatus('pending')}
            >
              🟡 Pendiente
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Estado actual: <strong>{selectedStatus.toUpperCase()}</strong>
          </p>
        </div>

        {/* Acciones de Edición */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold mb-3">Acciones de Edición</h2>
          <p className="text-muted-foreground mb-4">
            Botones diferenciados para acciones de tarjetas y tablas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="action-edit">✏️ Editar</Button>
            <Button variant="action-save">💾 Guardar</Button>
            <Button variant="destructive">🗑️ Eliminar</Button>
            <Button variant="action-cancel">❌ Cancelar</Button>
          </div>
        </div>

        {/* Exportación y Tablas */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold mb-3">Exportación y Tablas</h2>
          <p className="text-muted-foreground mb-4">
            Funciones diferenciadas para Excel y otras operaciones.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="excel-export">📈 Excel</Button>
            <Button variant="pdf-export">📄 PDF</Button>
            <Button variant="card-primary">🃏 Tarjeta</Button>
            <Button variant="outline">🔄 Actualizar</Button>
          </div>
        </div>

        {/* Módulos Específicos */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold mb-3">Módulos Almacén y Producción</h2>
          <p className="text-muted-foreground mb-4">
            Colores dentro de la gama para diferentes módulos del sistema.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="almacen">🏢 Almacén</Button>
            <Button variant="produccion">🏭 Producción</Button>
            <Button variant="secondary">📊 Reportes</Button>
            <Button variant="outline">⚙️ Config</Button>
          </div>
        </div>
      </div>

      {/* Demostración de Botones HTML con clases */}
      <div className="bg-sage-green text-white p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Botones HTML con Clases Específicas</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <button className="status-ok">🟢 Estado OK</button>
            <button className="status-na">🔘 Estado NA</button>
            <button className="action-edit">✏️ Editar</button>
            <button className="action-delete">🗑️ Eliminar</button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="excel-export">📈 Excel</button>
            <button className="almacen">🏢 Almacén</button>
            <button className="produccion">🏭 Producción</button>
            <button>🔧 Por defecto</button>
          </div>
        </div>
        <p className="text-sm mt-4 opacity-90">
          Estos botones usan clases CSS y cambian de color al hover, manteniendo el diseño limpio.
        </p>
      </div>
    </div>
  );
};

export default ThemeToggleExample;
