import React from 'react';
import { Save, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { formatUrl } from '@/utils/urlUtils';
import { CATEGORIAS_OPTIONS, ESTADOS_OPTIONS } from './constants';

export function AliadosTableRow({
  row,
  idx,
  isModified,
  isNew,
  isSavingThis,
  isSelected,
  toggleSelectRow,
  handleCellChange,
  handleKeyDown,
  handleSaveRow,
  handleRevertRow,
  handleDeleteRow,
  firstInputRef,
}) {
  return (
    <tr
      className={`border-b transition-colors relative ${
        isNew ? 'bg-blue-50/80 border-l-4 border-l-blue-500 hover:bg-blue-100/70' :
        isModified ? 'bg-amber-50/80 border-l-4 border-l-amber-500 hover:bg-amber-100/70' :
        isSelected ? 'bg-emerald-50/50' :
        idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/60'
      }`}
    >
      {/* Select Checkbox */}
      <td className="p-2 border-r border-gray-200 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectRow(row.id)}
          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
        />
      </td>

      {/* Nombre */}
      <td className="p-1 border-r border-gray-200">
        <input
          ref={idx === 0 && isNew ? firstInputRef : null}
          type="text"
          value={row.nombre || ''}
          onChange={e => handleCellChange(row.id, 'nombre', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Nombre del aliado *"
          className={`w-full px-2 py-1 bg-transparent border rounded outline-none text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 ${
            !row.nombre ? 'border-red-300 bg-red-50/50' : 'border-transparent hover:border-gray-300'
          }`}
        />
      </td>

      {/* Categoría */}
      <td className="p-1 border-r border-gray-200">
        <select
          value={row.categoria || 'Patrocinado'}
          onChange={e => handleCellChange(row.id, 'categoria', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          className="w-full px-1.5 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded outline-none text-xs focus:bg-white"
        >
          {CATEGORIAS_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>

      {/* Estado Proceso */}
      <td className="p-1 border-r border-gray-200">
        <select
          value={row.estado_proceso || 'Prospecto'}
          onChange={e => handleCellChange(row.id, 'estado_proceso', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          className={`w-full px-1.5 py-1 border rounded outline-none text-xs font-semibold focus:bg-white ${
            row.estado_proceso === 'Activo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
            row.estado_proceso === 'Prospecto' ? 'bg-amber-100 text-amber-800 border-amber-200' :
            row.estado_proceso === 'En Negociación' ? 'bg-blue-100 text-blue-800 border-blue-200' :
            'bg-rose-100 text-rose-800 border-rose-200'
          }`}
        >
          {ESTADOS_OPTIONS.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </td>

      {/* Contacto */}
      <td className="p-1 border-r border-gray-200">
        <input
          type="text"
          value={row.nombre_contacto || ''}
          onChange={e => handleCellChange(row.id, 'nombre_contacto', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Nombre contacto"
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
        />
      </td>

      {/* Email */}
      <td className="p-1 border-r border-gray-200">
        <input
          type="email"
          value={row.email || ''}
          onChange={e => handleCellChange(row.id, 'email', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="correo@ejemplo.com"
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
        />
      </td>

      {/* Teléfono */}
      <td className="p-1 border-r border-gray-200">
        <input
          type="text"
          value={row.telefono || ''}
          onChange={e => handleCellChange(row.id, 'telefono', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="+57 300..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs"
        />
      </td>

      {/* Instagram */}
      <td className="p-1 border-r border-gray-200">
        <input
          type="text"
          value={row.instagram || ''}
          onChange={e => handleCellChange(row.id, 'instagram', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          onBlur={e => {
            if (e.target.value && !e.target.value.startsWith('@')) {
              handleCellChange(row.id, 'instagram', `@${e.target.value.trim()}`);
            }
          }}
          placeholder="@usuario"
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs text-blue-600 font-medium"
        />
      </td>

      {/* Sitio Web */}
      <td className="p-1 border-r border-gray-200">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={row.sitio_web || ''}
            onChange={e => handleCellChange(row.id, 'sitio_web', e.target.value)}
            onKeyDown={e => handleKeyDown(e, row.id)}
            onBlur={e => {
              if (e.target.value) {
                handleCellChange(row.id, 'sitio_web', formatUrl(e.target.value));
              }
            }}
            placeholder="https://..."
            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs text-emerald-700"
          />
          {row.sitio_web && (
            <a
              href={formatUrl(row.sitio_web)}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-emerald-600 px-1"
              title="Abrir enlace"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </td>

      {/* Contraseña Portal */}
      <td className="p-1 border-r border-gray-200">
        <input
          type="text"
          value={row.password || ''}
          onChange={e => handleCellChange(row.id, 'password', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Contraseña..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs font-mono text-gray-600"
        />
      </td>

      {/* Descripción Marca */}
      <td className="p-1 border-r border-gray-200">
        <textarea
          rows="1"
          value={row.brand_description || ''}
          onChange={e => handleCellChange(row.id, 'brand_description', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Descripción..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
        />
      </td>

      {/* Público Objetivo */}
      <td className="p-1 border-r border-gray-200">
        <textarea
          rows="1"
          value={row.target_audience || ''}
          onChange={e => handleCellChange(row.id, 'target_audience', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Público..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
        />
      </td>

      {/* Valor Esperado */}
      <td className="p-1 border-r border-gray-200">
        <textarea
          rows="1"
          value={row.expected_value || ''}
          onChange={e => handleCellChange(row.id, 'expected_value', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Expectativas..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
        />
      </td>

      {/* Notas Internas */}
      <td className="p-1 border-r border-gray-200">
        <textarea
          rows="1"
          value={row.notas || ''}
          onChange={e => handleCellChange(row.id, 'notas', e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.id)}
          placeholder="Notas de acuerdo..."
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded outline-none text-xs resize-y"
        />
      </td>

      {/* Actions Column */}
      <td className="p-1.5 text-center sticky right-0 bg-white shadow-sm">
        <div className="flex items-center justify-center gap-1">
          {isModified ? (
            <>
              <button
                onClick={() => handleSaveRow(row.id)}
                disabled={isSavingThis}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                title="Guardar cambios (Enter)"
              >
                <Save size={14} className={isSavingThis ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => handleRevertRow(row.id)}
                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                title="Deshacer cambios (Esc)"
              >
                <RotateCcw size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleDeleteRow(row.id, row.nombre)}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Eliminar aliado"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default AliadosTableRow;
