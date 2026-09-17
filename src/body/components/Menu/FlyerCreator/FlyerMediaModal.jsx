// =========================================================
// GESTOR Y MODAL DE MEDIOS PARA FLYER STUDIO
// Carga desde PC, Galería de Proyecto Café y URLs externas
// =========================================================

import React, { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Link as LinkIcon, Sparkles, X, Check, Trash2, Search, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import supabase from "../../../../config/supabaseClient";

export default function FlyerMediaModal({
  isOpen,
  onClose,
  onSelectImage = () => {},
  targetType = "background" // "background" | "element"
}) {
  const [activeTab, setActiveTab] = useState("gallery"); // "gallery" | "upload" | "url" | "stickers"
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // "all" | "agenda" | "menu" | "curated"
  const [customUrl, setCustomUrl] = useState("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCafeGallery();
    }
  }, [isOpen]);

  const fetchCafeGallery = async () => {
    setLoadingGallery(true);
    try {
      const allFound = [];
      const seenUrls = new Set();

      // 1. Obtener de eventos de Agenda que tengan bannerIMG (usando columnas reales: nombreES, nombreEN, nombreCliente)
      try {
        const { data: agendaEvents, error: agErr } = await supabase
          .from("Agenda")
          .select("_id, bannerIMG, nombreES, nombreEN, nombreCliente, fecha")
          .not("bannerIMG", "is", null)
          .order("fecha", { ascending: false, nullsFirst: false })
          .limit(60);

        if (!agErr && agendaEvents) {
          agendaEvents.forEach((ev) => {
            if (
              ev.bannerIMG &&
              typeof ev.bannerIMG === "string" &&
              ev.bannerIMG.trim() !== "" &&
              !seenUrls.has(ev.bannerIMG)
            ) {
              seenUrls.add(ev.bannerIMG);
              allFound.push({
                url: ev.bannerIMG,
                name: ev.nombreES || ev.nombreEN || ev.nombreCliente || "Evento Agenda",
                source: "Eventos Agenda",
                category: "agenda",
                date: ev.fecha
              });
            }
          });
        }
      } catch (e) {
        console.warn("Error cargando eventos de agenda:", e);
      }

      // 2. Obtener imágenes directamente del bucket Images_eventos en Supabase Storage
      try {
        const { data: storageFiles } = await supabase.storage
          .from("Images_eventos")
          .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

        if (storageFiles) {
          storageFiles.forEach((file) => {
            if (file.name && /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(file.name)) {
              const { data } = supabase.storage.from("Images_eventos").getPublicUrl(file.name);
              if (data?.publicUrl && !seenUrls.has(data.publicUrl)) {
                seenUrls.add(data.publicUrl);
                allFound.push({
                  url: data.publicUrl,
                  name: file.name.replace(/^banner_\d+_/, "Banner ").replace(/\.[^.]+$/, ""),
                  source: "Storage Eventos",
                  category: "agenda"
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn("Error listando bucket Images_eventos:", e);
      }

      // 3. Obtener imágenes de subcarpeta menu_print_images en Images_eventos
      try {
        const { data: menuFiles } = await supabase.storage
          .from("Images_eventos")
          .list("menu_print_images", { limit: 50 });

        if (menuFiles) {
          menuFiles.forEach((file) => {
            if (file.name && /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(file.name)) {
              const { data } = supabase.storage.from("Images_eventos").getPublicUrl(`menu_print_images/${file.name}`);
              if (data?.publicUrl && !seenUrls.has(data.publicUrl)) {
                seenUrls.add(data.publicUrl);
                allFound.push({
                  url: data.publicUrl,
                  name: "Foto Menú Print",
                  source: "Menú Print",
                  category: "menu"
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn("Error listando menu_print_images:", e);
      }

      // 4. Obtener de menu_print_config
      try {
        const { data: menuConfigs } = await supabase.from("menu_print_config").select("images");
        if (menuConfigs) {
          menuConfigs.forEach((m) => {
            if (Array.isArray(m.images)) {
              m.images.forEach((img) => {
                if (img.url && !seenUrls.has(img.url)) {
                  seenUrls.add(img.url);
                  allFound.push({
                    url: img.url,
                    name: img.nameES || "Foto Producto Menú",
                    source: "Menú",
                    category: "menu"
                  });
                }
              });
            }
          });
        }
      } catch (e) {
        console.warn("Error cargando menu_print_config:", e);
      }

      // 5. Imágenes curated default de Unsplash para cafés y eventos
      const defaultCurated = [
        {
          url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80",
          name: "Guitarra & Café Íntimo",
          source: "Colección Café",
          category: "curated"
        },
        {
          url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80",
          name: "Libros & Café Caliente",
          source: "Colección Café",
          category: "curated"
        },
        {
          url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
          name: "Luces Neón de Noche",
          source: "Colección Café",
          category: "curated"
        },
        {
          url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80",
          name: "Barista Latte Art",
          source: "Colección Café",
          category: "curated"
        },
        {
          url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80",
          name: "Mesa de Brunch Artesanal",
          source: "Colección Café",
          category: "curated"
        },
        {
          url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
          name: "Tostaduría & Granos de Café",
          source: "Colección Café",
          category: "curated"
        }
      ];

      defaultCurated.forEach((c) => {
        if (!seenUrls.has(c.url)) {
          seenUrls.add(c.url);
          allFound.push(c);
        }
      });

      setGalleryImages(allFound);
    } catch (err) {
      console.error("Error al cargar galería:", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Convertir a DataURL local inmediatamente para uso ágil
      const reader = new FileReader();
      reader.onload = async (event) => {
        const localDataUrl = event.target.result;

        // Intentar subir en background a Supabase Storage bucket 'Images_eventos' si está disponible
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `flyer_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `flyers/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("Images_eventos")
            .upload(filePath, file);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("Images_eventos")
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              onSelectImage(publicUrlData.publicUrl);
              onClose();
              return;
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload fallback to DataURL:", storageErr);
        }

        // Si falla storage o no hay bucket, usamos el DataURL local directo
        onSelectImage(localDataUrl);
        onClose();
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError("Error al procesar el archivo: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onSelectImage(customUrl.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#fcf8f2] border-4 border-black rounded-xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-yellow-300 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-black text-yellow-300 rounded-lg border-2 border-black flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase italic tracking-wide text-black">
                {targetType === "background" ? "Seleccionar Imagen de Fondo" : "Añadir Imagen / Sticker al Lienzo"}
              </h2>
              <p className="text-[11px] font-bold text-black/80">
                Elige de la galería del café, sube una foto de tu computador o pega un enlace web
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

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-black bg-zinc-100 px-4 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "gallery" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <Sparkles size={14} />
            <span>Galería Café & Eventos</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "upload" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <Upload size={14} />
            <span>Subir de Computador</span>
          </button>

          <button
            onClick={() => setActiveTab("url")}
            className={`px-4 py-2 font-black uppercase text-xs border-t-2 border-x-2 border-black rounded-t-md transition-all flex items-center gap-1.5 ${
              activeTab === "url" ? "bg-white translate-y-[2px]" : "bg-zinc-200/80 hover:bg-zinc-200"
            }`}
          >
            <LinkIcon size={14} />
            <span>Enlace Web (URL)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-[#faf7f2]">
          {/* TAB 1: Galería */}
          {activeTab === "gallery" && (
            <div className="flex flex-col gap-4">
              {/* Barra de Búsqueda y Filtros Rápidos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar evento, fecha o foto..."
                    className="pl-8 h-8 text-xs font-bold border-2 border-black bg-zinc-50 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black font-black text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Categorías / Pastillas de filtro */}
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border-2 border-black transition-all ${
                      selectedCategory === "all"
                        ? "bg-black text-yellow-300"
                        : "bg-white hover:bg-zinc-100 text-black"
                    }`}
                  >
                    Todos ({galleryImages.length})
                  </button>

                  <button
                    onClick={() => setSelectedCategory("agenda")}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border-2 border-black transition-all ${
                      selectedCategory === "agenda"
                        ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-amber-50 text-black"
                    }`}
                  >
                    📅 Eventos ({galleryImages.filter((i) => i.category === "agenda").length})
                  </button>

                  <button
                    onClick={() => setSelectedCategory("menu")}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border-2 border-black transition-all ${
                      selectedCategory === "menu"
                        ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-amber-50 text-black"
                    }`}
                  >
                    ☕ Menú ({galleryImages.filter((i) => i.category === "menu").length})
                  </button>

                  <button
                    onClick={() => setSelectedCategory("curated")}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border-2 border-black transition-all ${
                      selectedCategory === "curated"
                        ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white hover:bg-amber-50 text-black"
                    }`}
                  >
                    ✨ Curadas ({galleryImages.filter((i) => i.category === "curated").length})
                  </button>

                  <button
                    onClick={fetchCafeGallery}
                    className="p-1.5 bg-zinc-100 hover:bg-zinc-200 border-2 border-black rounded-md ml-auto sm:ml-1"
                    title="Actualizar fotos de Supabase"
                  >
                    <RefreshCw size={14} className={loadingGallery ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Grid de Imágenes */}
              {loadingGallery ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-black uppercase text-xs text-zinc-600 animate-pulse">
                    Cargando Galería de Proyecto Café & Eventos...
                  </span>
                </div>
              ) : (() => {
                const filtered = galleryImages.filter((img) => {
                  if (selectedCategory !== "all" && img.category !== selectedCategory) {
                    return false;
                  }
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const matchName = img.name?.toLowerCase().includes(q);
                    const matchSource = img.source?.toLowerCase().includes(q);
                    const matchDate = img.date?.toLowerCase().includes(q);
                    return matchName || matchSource || matchDate;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-white border-2 border-black rounded-lg p-6">
                      <ImageIcon size={32} className="text-zinc-400 mb-2" />
                      <p className="font-black uppercase text-xs text-zinc-700">
                        No se encontraron imágenes con ese criterio
                      </p>
                      <span className="text-[11px] text-zinc-500 mt-1">
                        Prueba seleccionando otra categoría o borrando el texto de búsqueda.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filtered.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectImage(img.url);
                          onClose();
                        }}
                        className="group border-2 border-black rounded-lg overflow-hidden bg-white hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col hover:-translate-y-0.5"
                      >
                        <div className="aspect-video w-full bg-zinc-200 overflow-hidden relative border-b-2 border-black">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="bg-yellow-300 text-black font-black text-[10px] uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              Usar Esta Foto
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 flex flex-col justify-between flex-1 gap-1">
                          <div>
                            <span className="text-[11px] font-black text-black line-clamp-2 block leading-snug" title={img.name}>
                              {img.name}
                            </span>
                            {img.date && (
                              <span className="text-[10px] font-bold text-zinc-500 mt-0.5 block">
                                📅 {img.date}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300">
                              {img.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: Subir de PC */}
          {activeTab === "upload" && (
            <div className="flex flex-col items-center justify-center py-10">
              <label className="border-4 border-dashed border-black rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-100/50 transition-all max-w-lg w-full bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                  <Upload size={32} className="text-black" />
                </div>
                <h3 className="font-black uppercase text-base text-black mb-1">
                  Haz Clic Para Elegir una Foto
                </h3>
                <p className="text-xs font-bold text-zinc-600 text-center mb-4">
                  JPG, PNG, WebP o SVG de alta resolución desde tu computador
                </p>
                <span className="bg-black text-white font-black text-xs uppercase px-4 py-2 rounded border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                  Explorar Archivos
                </span>
              </label>

              {isUploading && (
                <div className="mt-4 flex items-center gap-2 font-black text-xs uppercase text-zinc-700">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando y optimizando imagen...</span>
                </div>
              )}

              {uploadError && (
                <p className="mt-3 text-xs font-bold text-red-600 bg-red-100 border border-red-400 px-3 py-1.5 rounded">
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {/* TAB 3: URL Directa */}
          {activeTab === "url" && (
            <div className="max-w-xl mx-auto py-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-zinc-800 mb-1.5">
                  Pegar URL de Imagen (Unsplash, Drive, Web, etc.)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={customUrl}
                    onChange={(e) => {
                      setCustomUrl(e.target.value);
                      setUrlPreviewError(false);
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="border-2 border-black font-mono text-xs bg-white h-11"
                  />
                  <Button
                    onClick={handleApplyUrl}
                    disabled={!customUrl.trim()}
                    className="h-11 px-5 bg-green-400 hover:bg-green-500 text-black font-black uppercase text-xs border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Usar
                  </Button>
                </div>
              </div>

              {/* URL Preview */}
              {customUrl.trim() && (
                <div className="border-2 border-black rounded-lg overflow-hidden bg-white p-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-1">
                    Vista Previa:
                  </span>
                  <div className="aspect-video w-full bg-zinc-100 rounded border border-zinc-300 overflow-hidden flex items-center justify-center">
                    {!urlPreviewError ? (
                      <img
                        src={customUrl}
                        alt="Preview"
                        onError={() => setUrlPreviewError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-red-600">
                        ⚠️ No se pudo cargar la imagen desde este enlace. Verifica la URL.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
