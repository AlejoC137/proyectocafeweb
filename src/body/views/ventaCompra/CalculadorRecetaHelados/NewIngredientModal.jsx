import React from "react";

export function NewIngredientModal({ isOpen, onClose, onSubmit, tempIng, setTempIng }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black p-6 w-full max-w-md shadow-solid space-y-4">
        <h3 className="font-bold text-base text-gray-900 border-b-2 border-black pb-2">
          Registrar Nuevo Ingrediente al Catálogo Local
        </h3>
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Nombre Ingrediente:</label>
            <input
              type="text"
              required
              value={tempIng.nombre}
              onChange={(e) => setTempIng({ ...tempIng, nombre: e.target.value })}
              className="w-full p-1.5 border border-black"
              placeholder="ej. Pasta de Avellana 100%"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold mb-1">% Grasa:</label>
              <input
                type="number"
                step="any"
                value={tempIng.grasa}
                onChange={(e) => setTempIng({ ...tempIng, grasa: e.target.value })}
                className="w-full p-1.5 border border-black font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">% Sólidos Totales:</label>
              <input
                type="number"
                step="any"
                value={tempIng.solidos}
                onChange={(e) => setTempIng({ ...tempIng, solidos: e.target.value })}
                className="w-full p-1.5 border border-black font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold mb-1">POD (Poder Edulcorante):</label>
              <input
                type="number"
                step="any"
                value={tempIng.pod}
                onChange={(e) => setTempIng({ ...tempIng, pod: e.target.value })}
                className="w-full p-1.5 border border-black font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">PAC (Poder Anticongelante):</label>
              <input
                type="number"
                step="any"
                value={tempIng.pac}
                onChange={(e) => setTempIng({ ...tempIng, pac: e.target.value })}
                className="w-full p-1.5 border border-black font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 font-bold border border-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-sage-green text-white font-bold border border-black"
            >
              Guardar Ingrediente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewIngredientModal;
