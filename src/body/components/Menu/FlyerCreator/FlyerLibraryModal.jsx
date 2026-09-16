// =========================================================
// BIBLIOTECA DE FLYERS EN SUPABASE (FLYER STUDIO)
// Guarda, reusa, edita, duplica y elimina flyers en la nube
// =========================================================

import React, { useState, useEffect } from "react";
import { Folder, Plus, Copy, Trash2, Edit3, Sparkles, X, Check, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "../../../../config/supabaseClient";

export default function FlyerLibraryModal({
  isOpen,
  onClose,
  onLoadFlyer = () => {},
  currentFlyerData = null,
  activeFlyerId = null,
  setActiveFlyerId = () => {}
}) {
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchLibrary();
      setSaveSuccess(false);
      setErrorMessage("");
      // Default name based on elements
      const mainTitle = currentFlyerData?.elements?.find((e) => e.id?.includes("title") || e.type === "text")?.text || "Flyer Evento";
      setSaveName(mainTitle.split("\n")[0].substring(0, 40));
    }
  }, [isOpen]);

  const fetchLibrary = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("flyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist yet, show helpful SQL tip
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setErrorMessage("La tabla 'flyers' aún no ha sido creada en Supabase. Ejecuta el script SQL 'create_flyers_table.sql' en el panel de Supabase.");
        } else {
          throw error;
        }
      } else {
        setFlyers(data || []);
      }
    } catch (err) {
      console.error("Error cargando biblioteca de flyers:", err);
      setErrorMessage("Error al conectar con la biblioteca: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentFlyer = async (saveAsNew = false) => {
    if (!saveName.trim()) {
      alert("Por favor ingresa un nombre para el flyer.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        nombre: saveName.trim(),
        formato: currentFlyerData?.canvas?.format || "9:16",
        canvas: currentFlyerData?.canvas || {},
        elements: currentFlyerData?.elements || [],
        copies: currentFlyerData?.copies || {},
        updated_at: new Date().toISOString()
      };

      if (!saveAsNew && activeFlyerId) {
        // Actualizar flyer existente
        const { error } = await supabase
          .from("flyers")
          .update(payload)
          .eq("id", activeFlyerId);

        if (error) throw error;
      } else {
        // Insertar nuevo flyer
        const { data, error } = await supabase
          .from("flyers")
          .insert([payload])
          .select();

        if (error) throw error;
        if (data && data[0]) {
          setActiveFlyerId(data[0].id);
        }
      }

      setSaveSuccess(true);
      await fetchLibrary();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando flyer:", err);
      setErrorMessage("Error al guardar flyer: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateFlyer = async (flyerToDuplicate, e) => {
    e.stopPropagation();
    try {
      const payload = {
        nombre: `${flyerToDuplicate.nombre} (Copia)`,
        formato: flyerToDuplicate.formato,
        canvas: flyerToDuplicate.canvas,
        elements: flyerToDuplicate.elements,
        copies: flyerToDuplicate.copies,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from("flyers").insert([payload]);
      if (error) throw error;
      await fetchLibrary();
    } catch (err) {
      alert("Error al duplicar flyer: " + err.message);
    }
  };

  const handleDeleteFlyer = async (flyerId, flyerName, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el flyer "${flyerName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("flyers").delete().eq("id", flyerId);
      if (error) throw error;
      if (activeFlyerId === flyerId) setActiveFlyerId(null);
      await fetchLibrary();
    } catch (err) {
      alert("Error al eliminar flyer: " + err.message);
    }
  };

  const handleSelectFlyer = (f) => {
    setActiveFlyerId(f.id);
    onLoadFlyer({
      canvas: f.canvas,
      elements: f.elements,
      copies: f.copies || {}
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[370] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#fcf8f2] border-4 border-black rounded-xl shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-yellow-300 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-black text-yellow-300 rounded-lg border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Folder size={22} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-wide text-black">
                Biblioteca de Flyers & Posters
              </h2>
              <p className="text-xs font-bold text-black/80">
                Guarda tus diseños en Supabase, ábrelos para editar, duplícalos o bórralos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-400 hover:bg-red-500 border-2 border-black rounded-md flex items-center justify-center font-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Barra superior de Guardado Rápido */}
        <div className="p-3 bg-white border-b-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <span className="text-xs font-black uppercase text-zinc-700 whitespace-nowrap">
              Nombre del Flyer:
            </span>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ej. Acústicos del Café - Octubre"
              className="border-2 border-black font-bold text-xs bg-zinc-50 h-9 flex-1"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {activeFlyerId && (
              <Button
                onClick={() => handleSaveCurrentFlyer(false)}
                disabled={isSaving}
                className="h-9 px-4 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
              >
                Actualizar Actual
              </Button>
            )}

            <Button
              onClick={() => handleSaveCurrentFlyer(true)}
              disabled={isSaving}
              className="h-9 px-4 bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check size={14} />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Guardar Como Nuevo</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mensaje de Error / Alerta SQL */}
        {errorMessage && (
          <div className="p-3 bg-red-100 border-b-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Grid de Flyers Guardados */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#faf7f2]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              <span className="font-black uppercase text-xs text-zinc-600 animate-pulse">
                Cargando biblioteca de flyers...
              </span>
            </div>
          ) : flyers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-yellow-200 border-2 border-black rounded-full flex items-center justify-center mb-3">
                <Folder size={32} className="text-black" />
              </div>
              <h3 className="font-black text-sm uppercase text-black mb-1">
                Aún no tienes flyers guardados en la nube
              </h3>
              <p className="text-xs font-bold text-zinc-600 max-w-sm mb-4">
                Diseña tu flyer en el estudio y haz clic en "Guardar Como Nuevo" para empezar tu colección.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {flyers.map((f) => {
                const isActive = activeFlyerId === f.id;
                const elementCount = Array.isArray(f.elements) ? f.elements.length : 0;
                const formattedDate = f.created_at
                  ? new Date(f.created_at).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })
                  : "";

                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFlyer(f)}
                    className={`border-3 border-black rounded-xl overflow-hidden bg-white p-4 flex flex-col justify-between transition-all cursor-pointer group ${
                      isActive
                        ? "ring-4 ring-yellow-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                        : "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
                    }`}
                  >
                    <div>
                      {/* Badge superior con Formato y Fecha */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-[10px] uppercase px-2 py-0.5 rounded bg-black text-yellow-300 border border-black">
                          {f.formato || "9:16"}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock size={11} />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Título */}
                      <h4 className="font-black text-sm uppercase text-black mb-1 line-clamp-2 group-hover:text-amber-800 transition-colors">
                        {f.nombre}
                      </h4>

                      <span className="text-[11px] font-bold text-zinc-500 block mb-4">
                        {elementCount} elementos en diseño
                      </span>
                    </div>

                    {/* Barra de Acciones */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-zinc-200">
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-300">
                        Cargar Diseño ➔
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDuplicateFlyer(f, e)}
                          className="p-1.5 hover:bg-zinc-200 border border-black rounded transition-colors"
                          title="Duplicar Flyer"
                        >
                          <Copy size={13} className="text-black" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFlyer(f.id, f.nombre, e)}
                          className="p-1.5 bg-red-100 hover:bg-red-400 border border-black rounded transition-colors text-black"
                          title="Eliminar Flyer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
