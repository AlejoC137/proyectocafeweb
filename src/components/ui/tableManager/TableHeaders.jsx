import React from 'react';
import { ChevronUp, ChevronDown } from "lucide-react";
import { Staff, Comanda, Procedimientos, MenuItems, AGENDA } from "../../../redux/actions-types";

const SortIcon = ({ sortColumn, column, sortDirection }) => {
  if (sortColumn !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
  return sortDirection === "asc" ? 
    <ChevronUp className="w-4 h-4" /> : 
    <ChevronDown className="w-4 h-4" />;
};

export const TableHeaders = ({
  currentType,
  filterSubGrupo,
  visibleColumns,
  sortColumn,
  sortDirection,
  handleSort
}) => {
  const getHeaders = () => {
    switch(currentType) {
      case MenuItems:
        const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
        
        if (isLunchOnly) {
          const lunchHeaders = [
            { key: 'nombre', content: (
              <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("NombreES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 border-gray-200 hover:text-blue-600">
                  Nombre <SortIcon sortColumn={sortColumn} column="NombreES" sortDirection={sortDirection} />
                </button>
              </th>
            )},
            { key: 'fecha', content: <th key="fecha" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Fecha</th> },
            { key: 'entrada', content: <th key="entrada" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Entrada</th> },
            { key: 'proteina', content: <th key="proteina" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Proteína</th> },
            { key: 'opcion2', content: <th key="opcion2" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Opción 2</th> },
            { key: 'carbohidrato', content: <th key="carbohidrato" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Carbohidrato</th> },
            { key: 'acompanante', content: <th key="acompanante" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Acompañante</th> },
            { key: 'ensalada', content: <th key="ensalada" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Ensalada</th> },
            { key: 'bebida', content: <th key="bebida" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Bebida</th> },
            { key: 'pedidos', content: <th key="pedidos" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Pedidos</th> },
            { key: 'precio', content: (
              <th key="precio" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Precio")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                  Precio <SortIcon sortColumn={sortColumn} column="Precio" sortDirection={sortDirection} />
                </button>
              </th>
            )},
            { key: 'estado', content: (
              <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                  Estado <SortIcon sortColumn={sortColumn} column="Estado" sortDirection={sortDirection} />
                </button>
              </th>
            )},
            { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
          ];
          return lunchHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
        }
        
        const menuHeaders = [
          { key: 'nombreES', content: (
            <th key="nombreES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("NombreES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Nombre ES <SortIcon sortColumn={sortColumn} column="NombreES" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'nombreEN', content: (
            <th key="nombreEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("NombreEN")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Nombre EN <SortIcon sortColumn={sortColumn} column="NombreEN" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'descripcionES', content: <th key="descripcionES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Descripción ES</th> },
          { key: 'descripcionEN', content: <th key="descripcionEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Descripción EN</th> },
          { key: 'precio', content: (
            <th key="precio" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Precio")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Precio <SortIcon sortColumn={sortColumn} column="Precio" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'grupo', content: (
            <th key="grupo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("GRUPO")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Grupo <SortIcon sortColumn={sortColumn} column="GRUPO" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'subGrupo', content: <th key="subGrupo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">SUB_GRUPO</th> },
          { key: 'tipoES', content: (
            <th key="tipoES" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("TipoES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Tipo ES <SortIcon sortColumn={sortColumn} column="TipoES" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'tipoEN', content: <th key="tipoEN" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Tipo EN</th> },
          { key: 'foto', content: <th key="foto" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Foto</th> },
          { key: 'print', content: <th key="print" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">PRINT</th> },
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon sortColumn={sortColumn} column="Estado" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
        ];
        return menuHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      case Staff:
        const staffHeaders = [
          { key: 'nombre', content: (
            <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Nombre")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Nombre <SortIcon sortColumn={sortColumn} column="Nombre" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'apellido', content: (
            <th key="apellido" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Apellido")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Apellido <SortIcon sortColumn={sortColumn} column="Apellido" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'cargo', content: (
            <th key="cargo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Cargo")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Cargo <SortIcon sortColumn={sortColumn} column="Cargo" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'cc', content: (
            <th key="cc" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("CC")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                CC <SortIcon sortColumn={sortColumn} column="CC" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'rate', content: (
            <th key="rate" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Rate")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Rate <SortIcon sortColumn={sortColumn} column="Rate" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon sortColumn={sortColumn} column="Estado" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
        ];
        return staffHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      case Comanda:
        const ComandaHeaders = [
          { key: 'titulo', content: (
            <th key="titulo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Tittle")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon sortColumn={sortColumn} column="Tittle" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'categoria', content: (
            <th key="categoria" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon sortColumn={sortColumn} column="Categoria" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'ejecutor', content: (
            <th key="ejecutor" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Ejecutor")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Ejecutor <SortIcon sortColumn={sortColumn} column="Ejecutor" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'fechaCreacion', content: (
            <th key="fechaCreacion" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Dates.isued")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Creado <SortIcon sortColumn={sortColumn} column="Dates.isued" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'fechaFin', content: <th key="fechaFin" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Finalizado</th> },
          { key: 'dateAsigmente', content: <th key="dateAsigmente" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Bitácora</th> },
          { key: 'procedimientos', content: <th key="procedimientos" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Procedimientos</th> },
          { key: 'pagado', content: (
            <th key="pagado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
                <button onClick={() => handleSort("Pagado.pagadoFull")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Pagado <SortIcon sortColumn={sortColumn} column="Pagado.pagadoFull" sortDirection={sortDirection} />
              </button>
            </th>
          )},
           { key: 'notas', content: <th key="notas" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Notas</th> },
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Terminado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon sortColumn={sortColumn} column="Terminado" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
        ];
        return ComandaHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
        
      case Procedimientos:
        const procedimientosHeaders = [
          { key: 'titulo', content: (
            <th key="titulo" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("tittle")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Título <SortIcon sortColumn={sortColumn} column="tittle" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'categoria', content: (
            <th key="categoria" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Categoria")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Categoría <SortIcon sortColumn={sortColumn} column="Categoria" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'DescripcionGeneral', content: (
            <th key="DescripcionGeneral" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("DescripcionGeneral")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                DescripcionGeneral <SortIcon sortColumn={sortColumn} column="DescripcionGeneral" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("Estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon sortColumn={sortColumn} column="Estado" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
        ];
        return procedimientosHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      case AGENDA:
        const agendaHeaders = [
          { key: 'nombre', content: (
            <th key="nombre" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("nombreES")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Nombre <SortIcon sortColumn={sortColumn} column="nombreES" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'fecha', content: (
            <th key="fecha" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("fecha")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Fecha <SortIcon sortColumn={sortColumn} column="fecha" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'horario', content: <th key="horario" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Horario</th> },
          { key: 'cliente', content: <th key="cliente" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Cliente</th> },
          { key: 'valor', content: <th key="valor" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Valor</th> },
          { key: 'estado', content: (
            <th key="estado" className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">
              <button onClick={() => handleSort("estado")} className="bg-slate-100 text-gray-950 flex items-center gap-1 hover:text-blue-600">
                Estado <SortIcon sortColumn={sortColumn} column="estado" sortDirection={sortDirection} />
              </button>
            </th>
          )},
          { key: 'acciones', content: <th key="acciones" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> }
        ];
        return agendaHeaders.filter(header => visibleColumns[header.key]).map(header => header.content);
      
      default:
        return [<th key="default" className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Sin columnas definidas</th>];
    }
  };

  return (
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr>
        {getHeaders()}
      </tr>
    </thead>
  );
};
