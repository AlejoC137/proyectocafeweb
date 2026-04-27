import React, { useState, useId } from "react";
import { useClaude } from "../hooks/useClaude";

const IMPORTANCE_LABELS = { alta: "Alta", media: "Media", baja: "Baja" };

function SourceRow({ source, index, onChange, onRemove, rowId }) {
  return (
    <div className="flex gap-2 items-start">
      <input
        type="checkbox"
        id={`${rowId}-check`}
        checked={source.enabled}
        onChange={(e) => onChange(index, { enabled: e.target.checked })}
        className="mt-2.5 h-4 w-4 accent-amber-700 cursor-pointer flex-shrink-0"
      />
      <textarea
        value={source.content}
        onChange={(e) => onChange(index, { content: e.target.value })}
        placeholder="URL del video, descripción, lista de ingredientes…"
        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-gray-50 disabled:text-gray-400"
        rows={2}
        disabled={!source.enabled}
      />
      <select
        value={source.importance}
        onChange={(e) => onChange(index, { importance: e.target.value })}
        disabled={!source.enabled}
        className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-gray-50 disabled:text-gray-400 flex-shrink-0"
      >
        {Object.entries(IMPORTANCE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <button
        onClick={() => onRemove(index)}
        className="mt-1.5 p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        title="Eliminar fuente"
      >
        ✕
      </button>
    </div>
  );
}

export function RecipeGeneratorAI() {
  const uid = useId();
  const { data, loading, error, query } = useClaude();

  const [recipeType, setRecipeType] = useState("estandar");
  const [porciones, setPorciones] = useState(1);
  const [sources, setSources] = useState([{ content: "", importance: "alta", enabled: true }]);
  const [copied, setCopied] = useState(false);

  const addSource = () =>
    setSources((prev) => [...prev, { content: "", importance: "media", enabled: true }]);

  const updateSource = (index, changes) =>
    setSources((prev) => prev.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  const removeSource = (index) =>
    setSources((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const active = sources.filter((s) => s.enabled && s.content.trim());
    if (!active.length) {
      alert("Activá al menos una fuente con contenido.");
      return;
    }
    await query({ recipeType, porciones, sources });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5 p-4">

      {/* Tipo de receta */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Tipo de receta</p>
        <div className="flex gap-5">
          {[
            ["estandar", "Estándar (Venta)"],
            ["produccion", "Producción"],
          ].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name={`${uid}-type`}
                value={val}
                checked={recipeType === val}
                onChange={() => setRecipeType(val)}
                className="accent-amber-700"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Porciones */}
      <div>
        <label htmlFor={`${uid}-porciones`} className="text-sm font-semibold text-gray-700 block mb-2">
          Porciones finales
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`${uid}-porciones`}
            type="number"
            min={1}
            value={porciones}
            onChange={(e) => setPorciones(Math.max(1, Number(e.target.value)))}
            className="w-20 p-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <span className="text-sm text-gray-500">porciones</span>
        </div>
      </div>

      {/* Fuentes */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Fuentes</p>
          <button
            onClick={addSource}
            className="text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors"
          >
            + Añadir fuente
          </button>
        </div>
        <div className="space-y-2">
          {sources.map((source, i) => (
            <SourceRow
              key={i}
              source={source}
              index={i}
              onChange={updateSource}
              onRemove={removeSource}
              rowId={`${uid}-row-${i}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Las fuentes de mayor importancia tienen prioridad en caso de contradicción.
        </p>
      </div>

      {/* Botón */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-amber-700 text-white text-sm font-semibold rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Generando receta…" : "Generar Receta JSON"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Resultado */}
      {data && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-sm font-semibold text-gray-700">Resultado JSON</p>
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
