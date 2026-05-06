import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import supabase from "../../../config/supabaseClient";

// Reuse components from MenuPrint if possible or create local simplified versions
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";

const RecruitmentPrintStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
      
      @media print {
        @page {
          size: letter !important;
          margin: 0 !important;
        }

        body * {
          visibility: hidden !important;
        }

        #print-area, #print-area * {
          visibility: visible !important;
        }

        #print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 215.9mm !important;
          min-height: 279.4mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: white !important;
          z-index: 9999 !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }

      .recruitment-page {
        width: 215.9mm;
        min-height: 279.4mm;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        padding: 0;
        box-sizing: border-box;
        position: relative;
        overflow: visible;
      }

      .font-bunny {
        font-family: 'First Bunny', sans-serif;
      }
      
      .font-space {
        font-family: 'Space Grotesk', sans-serif;
      }

      .tear-off-tab {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        border-left: 1px dashed black;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        height: 100%;
      }
      .tear-off-tab:last-child {
        border-right: 1px dashed black;
      }
    `}
  </style>
);

const RecruitmentPrint = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({
    HEADLINE: { es: "PROYECTO CAFÉ ESTÁ BUSCANDO PERSONAL", en: "PROYECTO CAFÉ IS LOOKING FOR STAFF" },
    INFO: {
      es: "Si tienes interés o experiencia en áreas de cocina o café y quieres trabajar medio tiempo o por horas ¡contáctanos!\n\nPROYECTO CAFÉ\n📸\n@Proyecto__Cafe\n\nTransversal 35a#65d-22, a 2 cuadras de Unicentro",
      en: "If you have interest or experience in kitchen or coffee areas and want to work part-time or by hours, contact us!\n\nPROYECTO CAFÉ\n📸\n@Proyecto__Cafe\n\nTransversal 35a#65d-22, 2 blocks from Unicentro"
    },
    CONTACT: { es: "WhatsApp: 3XX XXX XXXX", en: "WhatsApp: 3XX XXX XXXX" },
    INSTAGRAM: { es: "@proyecto__cafe", en: "@proyecto__cafe" }
  });
  const [colors, setColors] = useState({
    mainTitle: "#000000",
    mainBorder: "#000000",
    categoryTitle: "#000000",
    categoryBorder: "#000000",
    categoryBg: "#f0f0f0",
    itemName: "#000000",
    itemPrice: "#000000",
    itemComment: "#333333",
    gridBorder: "#00000033",
    footerBg: "#000000",
    footerText: "#ffffff",
    blockBg: "#ffffff",
    imgBorder: "#000000",
    imgShadow: "#000000"
  });

  const [page, setPage] = useState({
    id: 'PAGE_1',
    left: [],
    center: ["INFO", "TEAROFF"],
    right: []
  });

  const [qrScale, setQrScale] = useState(1);
  const [photosWidth, setPhotosWidth] = useState(210);
  const [photosWidthUnit, setPhotosWidthUnit] = useState('px');
  const [leftColRatio, setLeftColRatio] = useState(50);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.from('menu_print_config').select('*').eq('id', 999); // Using a different ID for flyer
        if (data && data.length > 0) {
          const config = data[0];
          setPrintImages(config.images || []);
          setGroupDescriptions(config.group_descriptions || groupDescriptions);
          const layout = config.group_descriptions?.__layout || {};
          if (layout.pages && layout.pages[0]) setPage(layout.pages[0]);
          if (layout.colors) setColors(prev => ({ ...prev, ...layout.colors }));
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const saveConfig = async (updates = {}) => {
    const newGroupDescriptions = {
      ...groupDescriptions,
      __layout: {
        photosWidth, photosWidthUnit, leftColRatio, qrScale,
        pages: [page], colors, ...updates
      }
    };
    try {
      await supabase.from('menu_print_config').upsert([{
        id: 999,
        images: printImages,
        group_descriptions: newGroupDescriptions
      }]);
    } catch (e) {
      console.error("Error saving config:", e);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `recruitment_flyer/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("Images_eventos").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("Images_eventos").getPublicUrl(fileName);
      const newImageId = 'IMG_' + Math.random().toString(36).substr(2, 9);
      const newImages = [...printImages, { id: newImageId, url: data.publicUrl, path: fileName, height: 150 }];
      setPrintImages(newImages);
      const newPage = { ...page, center: [newImageId, ...page.center] };
      setPage(newPage);
      // We don't save immediately here to avoid too many writes, or we can save
      saveConfig();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const moveBlock = (blockId, direction, pageIndex, columnId) => {
    const currentPage = { ...page };
    const colArray = [...currentPage[columnId]];
    const idx = colArray.indexOf(blockId);

    if (direction === 'up' && idx > 0) {
      [colArray[idx - 1], colArray[idx]] = [colArray[idx], colArray[idx - 1]];
      currentPage[columnId] = colArray;
    } else if (direction === 'down' && idx < colArray.length - 1) {
      [colArray[idx + 1], colArray[idx]] = [colArray[idx], colArray[idx + 1]];
      currentPage[columnId] = colArray;
    } else if (direction === 'right') {
      if (columnId === 'left') {
        currentPage.left = currentPage.left.filter(b => b !== blockId);
        currentPage.center = [...currentPage.center, blockId];
      } else if (columnId === 'center') {
        currentPage.center = currentPage.center.filter(b => b !== blockId);
        currentPage.right = [...currentPage.right, blockId];
      }
    } else if (direction === 'left') {
      if (columnId === 'right') {
        currentPage.right = currentPage.right.filter(b => b !== blockId);
        currentPage.center = [...currentPage.center, blockId];
      } else if (columnId === 'center') {
        currentPage.center = currentPage.center.filter(b => b !== blockId);
        currentPage.left = [...currentPage.left, blockId];
      }
    }
    setPage(currentPage);
    // Auto save layout
    const newGroupDescriptions = {
      ...groupDescriptions,
      __layout: { ...groupDescriptions.__layout, pages: [currentPage] }
    };
    supabase.from('menu_print_config').upsert([{ id: 999, group_descriptions: newGroupDescriptions, images: printImages }]).then();
  };

  const deleteBlock = (blockId) => {
    if (!window.confirm("¿Eliminar este bloque?")) return;
    const newPage = {
      ...page,
      left: page.left.filter(b => b !== blockId),
      center: page.center.filter(b => b !== blockId),
      right: page.right.filter(b => b !== blockId),
    };
    setPage(newPage);
  };

  const renderBlockControls = (id, columnId) => {
    if (!editMode) return null;
    return (
      <div className="absolute -top-3 -right-3 flex flex-col gap-1 z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'up', 0, columnId)}>↑</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'down', 0, columnId)}>↓</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'right', 0, columnId)}>→</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(id, 'left', 0, columnId)}>←</Button>
        <Button size="sm" variant="destructive" className="h-6 w-6 p-0 text-xs rounded-sm border border-black mt-1" onClick={() => deleteBlock(id)}>X</Button>
      </div>
    );
  };

  const renderEditableText = (key, className, style = {}) => {
    const text = groupDescriptions[key]?.es || "";
    if (editMode) {
      return (
        <textarea
          className={`${className} w-full bg-yellow-50 outline-none resize-none overflow-hidden`}
          style={style}
          value={text}
          onChange={(e) => {
            setGroupDescriptions(prev => ({
              ...prev,
              [key]: { ...prev[key], es: e.target.value }
            }));
          }}
          onBlur={() => saveConfig()}
          rows={Math.max(1, text.split('\n').length)}
        />
      );
    }
    return <p className={className} style={{ ...style, whiteSpace: 'pre-wrap' }}>{text}</p>;
  };

  const renderBlock = (blockId, columnId) => {
    switch (blockId) {
      case "HEADLINE":
        return (
          <div key="HEADLINE" className="relative group m-0 w-full flex justify-center py-4">
            {renderBlockControls("HEADLINE", columnId)}
            <div className="border-4 border-black p-4 px-10 inline-block transform shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white" style={{ borderColor: colors.mainBorder }}>
              <h1 className="font-bunny text-5xl font-black uppercase text-center leading-tight tracking-tighter m-0" style={{ color: colors.mainTitle }}>
                {renderEditableText("HEADLINE", "m-0")}
              </h1>
            </div>
          </div>
        );
      case "INFO":
        return (
          <div key="INFO" className="relative group m-0 w-full flex justify-center py-1">
            {renderBlockControls("INFO", columnId)}
            <div className="border-[6px] border-black p-1 px-1 inline-block transform shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white max-w-[92%]" style={{ borderColor: colors.categoryBorder, backgroundColor: colors.blockBg }}>
              <div className="font-space text-3xl font-bold text-center leading-tight">
                {renderEditableText("INFO", "m-0")}
              </div>
            </div>
          </div>
        );

      case "TEAROFF":
        return (
          <div key="TEAROFF" className="relative group mt-auto w-full flex border-t-2 border-dashed border-black pt-4" style={{ height: '70mm' }}>
            {renderBlockControls("TEAROFF", columnId)}
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 border-dashed border-black flex flex-col items-center justify-center relative p-2 ${i < 7 ? 'border-r-2' : ''}`} 
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                <span className="text-sm font-bold tracking-widest whitespace-nowrap opacity-90 font-space">
                  {groupDescriptions.CONTACT?.es || "WhatsApp: 3XX XXX XXXX"}
                </span>
                <span className="text-[10px] font-black mt-1 font-space">
                  📸 {groupDescriptions.INSTAGRAM?.es || "@proyecto__cafe"}
                </span>
              </div>
            ))}
            {editMode && (
              <div className="absolute top-0 right-0 bg-white p-2 border border-black text-xs font-bold z-10 print:hidden flex flex-col gap-1">
                <div>Tel: <input className="bg-yellow-50 px-1 border" value={groupDescriptions.CONTACT?.es} onChange={(e) => setGroupDescriptions(prev => ({ ...prev, CONTACT: { ...prev.CONTACT, es: e.target.value } }))} onBlur={() => saveConfig()} /></div>
                <div>IG: <input className="bg-yellow-50 px-1 border" value={groupDescriptions.INSTAGRAM?.es} onChange={(e) => setGroupDescriptions(prev => ({ ...prev, INSTAGRAM: { ...prev.INSTAGRAM, es: e.target.value } }))} onBlur={() => saveConfig()} /></div>
              </div>
            )}
          </div>
        );
      case "LOGO":
        return (
          <div key="LOGO" className="relative group m-0 w-full flex flex-col items-center py-2">
            {renderBlockControls("LOGO", columnId)}

          </div>
        );
      default:
        const imgObj = printImages.find(img => img.id === blockId);
        if (imgObj) {
          return (
            <div key={blockId} className="relative group mb-2 w-full flex justify-center">
              {renderBlockControls(blockId, columnId)}
              <img src={imgObj.url} className="w-full grayscale contrast-125 object-contain" style={{ height: `${imgObj.height || 150}px` }} />
              {editMode && (
                <div className="absolute bottom-2 left-2 flex gap-2 print:hidden">
                  <input type="number" className="w-16 border" value={imgObj.height} onChange={(e) => {
                    const val = Number(e.target.value);
                    setPrintImages(prev => prev.map(img => img.id === blockId ? { ...img, height: val } : img));
                  }} onBlur={() => saveConfig()} />
                  <Button size="xs" variant="destructive" onClick={() => {
                    setPrintImages(prev => prev.filter(img => img.id !== blockId));
                    deleteBlock(blockId);
                  }}>Eliminar Foto</Button>
                </div>
              )}
            </div>
          );
        }
        return null;
    }
  };

  if (loading) return <div className="p-20 text-center font-space">Cargando volante...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-200 p-8 print:p-0 print:bg-white overflow-x-hidden">
      <RecruitmentPrintStyles />

      {/* Controls */}
      <div className="flex gap-4 mb-8 print:hidden flex-wrap justify-center items-center bg-white p-4 rounded-xl shadow-lg border border-black/10">
        <Button onClick={() => window.print()} className="font-space font-bold bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir Volante
        </Button>
        <Button onClick={() => setEditMode(!editMode)} className={`font-space font-bold ${editMode ? 'bg-red-600' : 'bg-blue-600'} text-white`}>
          {editMode ? "💾 Salir Edición" : "✏️ Editar Volante"}
        </Button>
        <Button onClick={() => setShowColorPanel(!showColorPanel)} className="font-space font-bold bg-purple-600 text-white">
          🎨 Colores
        </Button>
        <div className="flex items-center gap-2 border-l pl-4">
          <Button onClick={() => fileInputRef.current.click()} disabled={uploadingImage} className="font-space font-bold bg-green-600 text-white">
            {uploadingImage ? "Subiendo..." : "📷 Subir Foto/Logo"}
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      </div>

      {showColorPanel && (
        <div className="mb-8 w-full max-w-lg">
          <MenuPrintColorPanel colors={colors} setColors={setColors} saveLayoutSizes={(updates) => saveConfig(updates)} setShowColorPanel={setShowColorPanel} />
        </div>
      )}

      {/* Sheet */}
      <div id="print-area">
        <div className="recruitment-page shadow-2xl">
          <div className="flex flex-1 w-full gap-4">
            {/* Left Column (if used) */}
            {page.left.length > 0 && (
              <div style={{ width: `${leftColRatio}%` }} className="flex flex-col gap-4">
                {page.left.map(b => renderBlock(b, "left"))}
              </div>
            )}

            {/* Center Column */}
            <div className="flex-1 flex flex-col items-center">
              {page.center.map(b => renderBlock(b, "center"))}
            </div>

            {/* Right Column (if used) */}
            {page.right.length > 0 && (
              <div style={{ width: `${100 - leftColRatio}%` }} className="flex flex-col gap-4">
                {page.right.map(b => renderBlock(b, "right"))}
              </div>
            )}
          </div>

          {editMode && (
            <div className="absolute inset-x-0 bottom-0 bg-yellow-100/80 p-2 text-[10px] text-center font-bold print:hidden">
              MODO EDICIÓN ACTIVO - Arrastra o usa las flechas para reordenar bloques.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentPrint;
