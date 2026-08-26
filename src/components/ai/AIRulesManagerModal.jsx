import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Filter,
  Save,
  Tag
} from "lucide-react";
import {
  getAIRules,
  saveAIRule,
  toggleAIRuleStatus,
  deleteAIRule
} from "@/utils/aiRulesKnowledgeManager";

const CATEGORIES = ["Todas", "Precios", "Inventario", "Menú", "Personal", "General"];

export default function AIRulesManagerModal({ isOpen, onClose }) {
  const [rules, setRules] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [isEditing, setIsEditing] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await getAIRules();
      setRules(data || []);
    } catch (e) {
      console.error("Error al cargar reglas:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRules();
    }
  }, [isOpen]);

  const handleToggleActive = async (rule) => {
    const updated = await toggleAIRuleStatus(rule.id, !rule.is_active);
    if (updated) {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    }
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm("¿Seguro que deseas eliminar esta regla administrativa?")) {
      await deleteAIRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  };

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      title: "",
      content: "",
      category: "General",
      is_active: true
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      title: rule.title,
      content: rule.content,
      category: rule.category || "General",
      is_active: rule.is_active
    });
    setIsEditing(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage("Título y contenido son obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      const ruleToSave = {
        ...formData,
        id: editingRule ? editingRule.id : undefined
      };
      await saveAIRule(ruleToSave);
      setIsEditing(false);
      setMessage("Regla guardada correctamente");
      setTimeout(() => setMessage(""), 2500);
      await loadRules();
    } catch (e) {
      setMessage("Error al guardar regla");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRules = rules.filter(
    (r) => selectedCategory === "Todas" || r.category === selectedCategory
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
      >
        {/* Encabezado */}
        <div className="bg-stone-900 text-white p-4 px-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-stone-100 flex items-center gap-2">
                CRUD de Reglas Administrativas IA
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  Solo Admin
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Define directivas obligatorias que el modelo DeepSeek acatará estrictamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación temporal */}
        {message && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 text-emerald-800 dark:text-emerald-300 px-4 py-2 text-xs flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="font-bold">✕</button>
          </div>
        )}

        {/* Formulario de Creación / Edición */}
        {isEditing ? (
          <form onSubmit={handleSaveForm} className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                {editingRule ? "Editar Regla Administrativa" : "Crear Nueva Regla Administrativa"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-stone-500 hover:underline"
              >
                Volver a la lista
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Título de la Regla
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej. Política de Descuentos en Menú"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.filter((c) => c !== "Todas").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Estado Inicial
                </label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="true">Activa (Inyectar en IA)</option>
                  <option value="false">Inactiva (Pausada)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Contenido / Directiva de la Regla
              </label>
              <textarea
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribe la regla o restricción detallada para el asistente..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {editingRule ? "Guardar Cambios" : "Crear Regla"}
              </button>
            </div>
          </form>
        ) : (
          /* Lista de Reglas */
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Barra de Filtros y Crear */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors shrink-0 font-medium ${
                      selectedCategory === cat
                        ? "bg-amber-600 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenCreate}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nueva Regla
              </button>
            </div>

            {/* Contenedor de Items */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredRules.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No hay reglas registradas en la categoría <strong className="text-stone-600 dark:text-stone-300">"{selectedCategory}"</strong>.
                </div>
              ) : (
                filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      rule.is_active
                        ? "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700/80 shadow-sm"
                        : "bg-stone-100/60 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-800/50 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rule.is_active ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <h4 className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                            {rule.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-medium">
                            {rule.category}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-4">
                          {rule.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleActive(rule)}
                          title={rule.is_active ? "Desactivar regla" : "Activar regla"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            rule.is_active
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              : "text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                          }`}
                        >
                          {rule.is_active ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(rule)}
                          title="Editar regla"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(rule.id)}
                          title="Eliminar regla"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
