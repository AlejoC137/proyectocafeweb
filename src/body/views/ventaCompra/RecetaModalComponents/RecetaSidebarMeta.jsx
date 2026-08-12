import React from "react";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditableText from "@/components/ui/EditableText";
import EmplatadoEditor from "./EmplatadoEditor";
import VeaseSection from "@/components/Vease/VeaseSection";

export function RecetaSidebarMeta({
  receta,
  id,
  foto,
  imagenUrl,
  setImagenUrl,
  permanentEditMode,
  isUpdating,
  uploadingImage,
  setShowGallery,
  updateImagenUrl,
  updateInfoField,
  rendimientoPorcion,
  setRendimientoPorcion,
  rendimientoCantidad,
  setRendimientoCantidad,
  rendimientoUnidades,
  setRendimientoUnidades,
  updateRendimiento,
  rendimientoDisplay,
  recetaSource,
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Imagen */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Imagen del Plato</h3>
        {permanentEditMode ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input 
                type="url" 
                placeholder="URL de la imagen" 
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)} 
                disabled={isUpdating || uploadingImage}
                className="flex-1 h-8 text-xs" 
              />
              <Button 
                type="button"
                size="sm" 
                onClick={() => setShowGallery(true)} 
                disabled={isUpdating || uploadingImage} 
                className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Galería
              </Button>
              <Button size="sm" onClick={updateImagenUrl} disabled={isUpdating || uploadingImage} className="h-8 text-xs px-3">
                {isUpdating ? "..." : "Guardar"}
              </Button>
            </div>
            {(foto || imagenUrl) && (
              <img 
                src={imagenUrl || foto} 
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl shadow-sm" 
                onError={(e) => { e.target.style.display = "none"; }} 
              />
            )}
          </div>
        ) : foto ? (
          <img src={foto} alt="Imagen del plato" className="w-full h-44 object-cover rounded-xl shadow-sm" />
        ) : (
          <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center">
            <ChefHat className="h-10 w-10 text-slate-300" />
          </div>
        )}
      </div>

      {/* Autor */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Autor</h3>
        <div className="text-xs text-slate-700">
          <EditableText 
            value={receta.autor || ""} 
            onSave={(v) => updateInfoField("autor", v)}
            isEditable={permanentEditMode} 
            placeholder="Nombre del autor..." 
            multiline={false} 
            disabled={isUpdating} 
          />
        </div>
      </div>

      {/* Rendimiento */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Rendimiento</h3>
        {permanentEditMode ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Porción</label>
                <Input type="number" value={rendimientoPorcion} onChange={(e) => setRendimientoPorcion(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Cantidad</label>
                <Input type="number" value={rendimientoCantidad} onChange={(e) => setRendimientoCantidad(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Unidad</label>
                <Input type="text" value={rendimientoUnidades} onChange={(e) => setRendimientoUnidades(e.target.value)} disabled={isUpdating} className="h-7 text-xs mt-0.5" />
              </div>
            </div>
            <Button size="sm" onClick={updateRendimiento} disabled={isUpdating} className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {isUpdating ? "Guardando..." : "Guardar Rendimiento"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-600">{rendimientoDisplay || <span className="text-slate-400 italic">No especificado</span>}</p>
        )}
      </div>

      {/* Emplatado */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">Emplatado</h3>
        <EmplatadoEditor 
          value={receta.emplatado || ""} 
          onSave={(v) => updateInfoField("emplatado", v)}
          isEditable={permanentEditMode} 
          placeholder="Describir emplatado..." 
          disabled={isUpdating} 
        />
      </div>

      {/* Véase / Relacionados */}
      <div>
        <VeaseSection sourceId={receta._id || id} sourceType="receta" />
      </div>

      {/* Meta */}
      <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 border border-slate-100">
        <div className="flex justify-between text-[9px] text-slate-400">
          <span>Fuente: {recetaSource}</span>
          {receta.actualizacion && <span>Act: {new Date(receta.actualizacion).toLocaleDateString("es-CO")}</span>}
        </div>
        <div className="text-[8px] text-slate-300 font-mono truncate">ID: {receta._id}</div>
      </div>
    </div>
  );
}

export default RecetaSidebarMeta;
