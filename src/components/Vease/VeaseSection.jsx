import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  ClipboardList,
  Package,
  ChefHat,
  X,
  Loader2,
  Search,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "../../config/supabaseClient";
import { getVeaseRelations, addVeaseRelation, deleteVeaseRelation } from "../../services/veaseService";

/**
 * Mapeo de tipos a íconos, colores y configuraciones de botones prominentes
 */
const TYPE_CONFIG = {
  receta: {
    label: "Receta de Menú",
    actionText: "Ver Receta",
    icon: ChefHat,
    color: "bg-amber-50/90 border-amber-200 hover:border-amber-400 hover:bg-amber-100/70",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    route: (id) => `/receta/${id}`,
  },
  procedimiento: {
    label: "Procedimiento / Protocolo",
    actionText: "Ver Procedimiento",
    icon: ClipboardList,
    color: "bg-purple-50/90 border-purple-200 hover:border-purple-400 hover:bg-purple-100/70",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm",
    badge: "bg-purple-100 text-purple-900 border-purple-300",
    route: (id) => `/ProcedimientoModal/${id}`,
  },
  produccion: {
    label: "Producción Interna",
    actionText: "Ver Producción",
    icon: BookOpen,
    color: "bg-blue-50/90 border-blue-200 hover:border-blue-400 hover:bg-blue-100/70",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm",
    badge: "bg-blue-100 text-blue-900 border-blue-300",
    route: (id) => `/receta/${id}`,
  },
  item: {
    label: "Producto / Ítem Almacén",
    actionText: "Ver Ítem",
    icon: Package,
    color: "bg-emerald-50/90 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/70",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    route: (id) => `/item/${id}`,
  },
};

export default function VeaseSection({ sourceId, sourceType, title = "Véase / Relacionados", compact = false }) {
  const navigate = useNavigate();

  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for adding relation
  const [targetType, setTargetType] = useState("receta");
  const [targetId, setTargetId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [grupo, setGrupo] = useState("General");
  const [notas, setNotas] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Store data from Redux
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || state.allRecetasProduccion || []);
  const allMenu = useSelector((state) => state.allMenu || state.TodaysMenu || []);
  const allRecetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const [procedimientosList, setProcedimientosList] = useState([]);

  // Fetch procedimentos from Supabase if not available
  useEffect(() => {
    let isMounted = true;
    async function loadProcedimientos() {
      try {
        const { data } = await supabase.from("Procedimientos").select("*");
        if (isMounted && data) {
          setProcedimientosList(data);
        }
      } catch (err) {
        console.warn("[VeaseSection] Error fetching Procedimientos:", err);
      }
    }
    loadProcedimientos();
    return () => { isMounted = false; };
  }, []);

  // Fetch relations from backend
  const loadRelations = async () => {
    if (!sourceId) return;
    setLoading(true);
    const data = await getVeaseRelations(sourceId, sourceType);
    setRelations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRelations();
  }, [sourceId, sourceType]);

  // Combined options catalog for selection
  const catalogOptions = useMemo(() => {
    if (targetType === "item") {
      return allItems.map((i) => ({
        id: String(i._id || i.id),
        name: i.Nombre_del_producto || i.NombreES || i.name || "Sin nombre",
        sub: i.Grupo || i.Categoria || "Almacén",
      }));
    }
    if (targetType === "produccion") {
      return allProduccion.map((p) => ({
        id: String(p._id || p.id || p.Receta),
        name: p.Nombre_del_producto || p.NombreES || p.name || "Sin nombre",
        sub: p.Grupo || "Producción Interna",
      }));
    }
    if (targetType === "procedimiento") {
      return procedimientosList.map((pr) => ({
        id: String(pr._id || pr.id),
        name: pr.Nombre_del_procedimiento || pr.nombre || pr.Nombre_del_producto || pr.title || "Procedimiento",
        sub: pr.Area || pr.Grupo || "Protocolo",
      }));
    }
    // Default: targetType === "receta" (recetas de menú)
    const unique = new Map();
    // 1. Extraer recetas reales de los elementos del Menú (m.Receta || m.forId || m._id)
    allMenu.forEach((m) => {
      const recipeId = String(m.Receta || m.forId || m._id);
      const name = m.Nombre_del_producto || m.NombreES || m.name || "Receta";
      if (recipeId && !unique.has(recipeId)) {
        unique.set(recipeId, {
          id: recipeId,
          name,
          sub: m.Grupo || "Receta de Menú",
        });
      }
    });
    // 2. Extraer de allRecetasMenu
    allRecetasMenu.forEach((r) => {
      const recipeId = String(r._id || r.id || r.Receta);
      const name = r.Nombre_del_producto || r.NombreES || r.name || "Receta";
      if (recipeId && !unique.has(recipeId)) {
        unique.set(recipeId, {
          id: recipeId,
          name,
          sub: r.Grupo || "Receta de Menú",
        });
      }
    });
    return Array.from(unique.values());
  }, [targetType, allItems, allProduccion, allMenu, allRecetasMenu, procedimientosList]);

  // Filter options by search term
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalogOptions.slice(0, 50);
    const term = searchTerm.toLowerCase();
    return catalogOptions.filter(
      (opt) => opt.name.toLowerCase().includes(term) || opt.sub.toLowerCase().includes(term)
    ).slice(0, 50);
  }, [catalogOptions, searchTerm]);

  // Helper to resolve display name for a relation target
  const resolveTargetName = (rel) => {
    if (rel.titulo && rel.titulo.trim()) return rel.titulo;

    const tid = String(rel.target_id);
    if (rel.target_type === "item") {
      const found = allItems.find((i) => String(i._id || i.id) === tid);
      if (found) return found.Nombre_del_producto || found.NombreES || found.name;
    }
    if (rel.target_type === "produccion") {
      const found = allProduccion.find((p) => String(p._id || p.id || p.Receta) === tid);
      if (found) return found.Nombre_del_producto || found.NombreES || found.name;
    }
    if (rel.target_type === "procedimiento") {
      const found = procedimientosList.find((pr) => String(pr._id || pr.id) === tid);
      if (found) return found.Nombre_del_procedimiento || found.nombre || found.Nombre_del_producto;
    }
    if (rel.target_type === "receta") {
      const foundMenu = allMenu.find((m) => String(m.Receta) === tid || String(m._id) === tid || String(m.forId) === tid);
      if (foundMenu) return foundMenu.Nombre_del_producto || foundMenu.NombreES || foundMenu.name;

      const foundReceta = allRecetasMenu.find((r) => String(r._id || r.id) === tid);
      if (foundReceta) return foundReceta.Nombre_del_producto || foundReceta.NombreES || foundReceta.name;
    }
    return `Enlace (${rel.target_type})`;
  };

  // Add relation submit handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) {
      alert("Por favor selecciona un ítem, receta o procedimiento destino.");
      return;
    }

    setIsSaving(true);
    const selectedObj = catalogOptions.find((o) => o.id === targetId);
    const finalTitle = customTitle.trim() || (selectedObj ? selectedObj.name : "");

    const res = await addVeaseRelation({
      source_id: sourceId,
      source_type: sourceType,
      target_id: targetId,
      target_type: targetType,
      titulo: finalTitle,
      grupo: grupo || "General",
      notas: notas.trim() || null,
    });

    setIsSaving(false);
    if (res.error) {
      alert("Error al guardar la relación en Supabase. Asegúrate de que la tabla 'Vease' exista.");
    } else {
      setIsAdding(false);
      setTargetId("");
      setCustomTitle("");
      setNotas("");
      setSearchTerm("");
      loadRelations();
    }
  };

  // Handle delete
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Deseas eliminar este enlace de 'Véase'?")) return;
    const ok = await deleteVeaseRelation(id);
    if (ok) {
      setRelations((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("No se pudo eliminar el enlace.");
    }
  };

  // Handle navigation click
  const handleNavigate = (rel) => {
    const config = TYPE_CONFIG[rel.target_type] || TYPE_CONFIG.receta;
    const targetUrl = config.route(rel.target_id);
    navigate(targetUrl);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium">Recetas, protocolos e ítems relacionados</p>
          </div>
          {relations.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full ml-1 border border-blue-200">
              {relations.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(!isAdding)}
          className="h-8 text-xs px-3 gap-1.5 border-blue-400 text-blue-700 hover:bg-blue-50 font-bold shadow-xs"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? "Cancelar" : "+ Agregar hipervínculo"}
        </Button>
      </div>

      {/* Add Relation Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-white border-2 border-blue-300 rounded-xl p-4 space-y-3.5 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Vincular nuevo elemento</span>
            <span className="text-[11px] text-slate-400">Selecciona el tipo y destino</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Type Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Tipo de Elemento</label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setTargetId("");
                  setSearchTerm("");
                }}
                className="w-full h-9 px-3 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
              >
                <option value="receta">📖 Receta de Menú</option>
                <option value="procedimiento">🧼 Procedimiento / Protocolo</option>
                <option value="produccion">🏭 Producción Interna</option>
                <option value="item">📦 Producto / Ítem Almacén</option>
              </select>
            </div>

            {/* Custom Title Override */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Título Personalizado (Opcional)</label>
              <Input
                type="text"
                placeholder="Ej. Lavado de Máquina..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Search and Select Target Entity */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Buscar y Seleccionar Destino</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs pl-9"
              />
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 divide-y divide-slate-100 shadow-inner">
              {filteredCatalog.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 italic">No se encontraron resultados</div>
              ) : (
                filteredCatalog.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setTargetId(item.id)}
                    className={`px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      targetId === item.id ? "bg-blue-600 text-white font-bold" : "hover:bg-white text-slate-700"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className={`text-[10px] font-normal ml-2 shrink-0 ${targetId === item.id ? "text-blue-100" : "text-slate-400"}`}>
                      {item.sub}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">Notas / Contexto (Opcional)</label>
            <Input
              type="text"
              placeholder="Ej. Procedimiento de limpieza previo..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-8 text-xs px-3.5 text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !targetId}
              className="h-8 text-xs px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Guardar enlace
            </Button>
          </div>
        </form>
      )}

      {/* Relations List (Large Hyperlink Buttons) */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Cargando hipervínculos relacionados...</span>
        </div>
      ) : relations.length === 0 ? (
        <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/70">
          <p className="text-xs font-medium text-slate-400">No hay hipervínculos en 'Véase' vinculados aún.</p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-1.5 text-xs text-blue-600 font-bold hover:underline"
          >
            + Agregar el primer hipervínculo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {relations.map((rel) => {
            const typeConfig = TYPE_CONFIG[rel.target_type] || TYPE_CONFIG.receta;
            const Icon = typeConfig.icon;
            const name = resolveTargetName(rel);

            return (
              <div
                key={rel.id}
                onClick={() => handleNavigate(rel)}
                className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${typeConfig.color}`}
              >
                {/* Left side: Large Icon + Content */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${typeConfig.badge}`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    {rel.notas ? (
                      <p className="text-xs text-slate-600 font-normal mt-0.5 line-clamp-1">{rel.notas}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Haz clic para abrir el modal relacionado</p>
                    )}
                  </div>
                </div>

                {/* Right side: Prominent Action Button + Delete */}
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 group-hover:bg-blue-600 group-hover:text-white text-slate-800 text-xs font-extrabold border border-slate-200 group-hover:border-blue-600 shadow-xs transition-all">
                    <span>{typeConfig.actionText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(rel.id, e)}
                    title="Eliminar enlace"
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-100/80 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
