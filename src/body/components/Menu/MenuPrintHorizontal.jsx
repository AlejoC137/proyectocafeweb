import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import supabase from "../../../config/supabaseClient";

// Modular Components
import { HorizontalStyles } from "./MenuPrintHorizontal/HorizontalStyles";
import HorizontalPage from "./MenuPrintHorizontal/HorizontalPage";
import HorizontalControls from "./MenuPrintHorizontal/HorizontalControls";
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";

function MenuPrintHorizontal() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leng, setLeng] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const menuData = useSelector((state) => state.allMenu);
  const [zoom, setZoom] = useState(0.4);
  const [showIcons, setShowIcons] = useState(true);
  const [showBlockSelector, setShowBlockSelector] = useState(null); // { pageIndex, colIdx }


  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [pageSize, setPageSize] = useState({ width: 210, height: 297, unit: 'mm' });
  const [qrScale, setQrScale] = useState(1);
  const [uploadTargetPage, setUploadTargetPage] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null); // { pageIndex, colIdx }
  const [colors, setColors] = useState({
    mainTitle: "#000000",
    mainBorder: "#000000",
    categoryTitle: "#000000",
    categoryBorder: "#000000",
    categoryBg: "#f0f0f0",
    itemName: "#000000",
    itemPrice: "#000000",
    itemComment: "#6b7280",
    gridBorder: "#0000001a",
    footerBg: "#000000",
    footerText: "#ffffff",
    blockBg: "#ffffff",
    imgBorder: "#000000",
    imgShadow: "#000000",
    // Typography defaults
    fontTitle: 'First Bunny',
    fontCategory: 'First Bunny',
    fontItem: 'Space Grotesk',
    fontBody: 'Inter',
    sizeTitle: 26,
    sizeCategory: 20,
    sizeItem: 11,
    sizePrice: 11,
    sizeComment: 9,
    fontSizeUnit: 'px',
  });

  const [pages, setPages] = useState([
    { id: 'PAGE_1', columns: [{ id: 'COL_1', blocks: ["CAFE", "QR"] }] },
    { id: 'PAGE_2', columns: [{ id: 'COL_1', blocks: ["BEBIDAS"] }] },
    { id: 'PAGE_3', columns: [{ id: 'COL_1', blocks: ["ALIMENTOS"] }] },
    { id: 'PAGE_4', columns: [{ id: 'COL_1', blocks: ["INFO"] }] }
  ]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(AGENDA))
        ]);
        await fetchConfig();
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const fetchConfig = async () => {
    try {
      // Using ID 2 for the horizontal version to avoid clashing with the regular one
      const { data, error } = await supabase.from('menu_print_config').select('*').eq('id', 2);
      if (error) {
        console.error("Error fetching config:", error);
        return;
      }
      if (data && data.length > 0) {
        const config = data[0];
        setPrintImages(config.images || []);
        setGroupDescriptions(config.group_descriptions || {});

        const layout = config.group_descriptions?.__layout || {};
        if (layout.pageSize) setPageSize(layout.pageSize);
        if (layout.pages) {
          let loadedPages = layout.pages;
          while (loadedPages.length < 4) {
            loadedPages.push({ id: 'PAGE_' + (loadedPages.length + 1), columns: [{ id: 'COL_1', blocks: [] }] });
          }
          setPages(loadedPages);
        }

        if (layout.qrScale) setQrScale(layout.qrScale);
        if (layout.showIcons !== undefined) setShowIcons(layout.showIcons);
        if (layout.leng !== undefined) setLeng(layout.leng);
        if (layout.colors) setColors(prev => ({ ...prev, ...layout.colors }));
      } else {
        // Initial insert if not exists
        await supabase.from('menu_print_config').insert([{
          id: 2,
          images: [],
          group_descriptions: { __layout: { pages, pageSize, colors, showIcons } },
          show_icons: true
        }]);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const layoutUpdate = {
        pages,
        pageSize,
        colors,
        qrScale,
        showIcons,
        leng
      };
      
      const updatedDescriptions = {
        ...groupDescriptions,
        __layout: { ...(groupDescriptions.__layout || {}), ...layoutUpdate }
      };

      const { error } = await supabase.from('menu_print_config').update({
        group_descriptions: updatedDescriptions,
        images: printImages,
        show_icons: showIcons
      }).eq('id', 2);

      if (error) throw error;
      setGroupDescriptions(updatedDescriptions);
    } catch (e) {
      console.error("Error saving config:", e);
      alert("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceImage = async (e, blockId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("La imagen es demasiado pesada. Sube una de menos de 4MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `menu_print_images/${Date.now()}_replaced.${ext}`;
      const { error } = await supabase.storage.from("Images_eventos").upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from("Images_eventos").getPublicUrl(fileName);

      const newImages = [...printImages];
      const index = newImages.findIndex(img => String(img.id) === String(blockId));
      if (index !== -1) {
        const oldImage = newImages[index];
        if (oldImage.path) {
          supabase.storage.from("Images_eventos").remove([oldImage.path]).catch(err => console.error("Error removing old image", err));
        }

        newImages[index].url = data.publicUrl;
        newImages[index].path = fileName;
        setPrintImages(newImages);
        // Save to DB
        await supabase.from('menu_print_config').update({ images: newImages }).eq('id', 2);
      }
    } catch (err) {
      console.error("Error replacing image:", err);
      alert("Error reemplazando imagen.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const deleteImage = async (blockId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen permanentemente?")) return;
    const index = printImages.findIndex(img => String(img.id) === String(blockId));
    if (index === -1) return;
    const image = printImages[index];
    try {
      if (image.path) {
        await supabase.storage.from("Images_eventos").remove([image.path]);
      }
      const newImages = printImages.filter((_, i) => i !== index);
      setPrintImages(newImages);
      // Save images list
      await supabase.from('menu_print_config').update({ images: newImages }).eq('id', 2);

      const newPages = pages.map(p => ({
        ...p,
        columns: p.columns.map(c => ({
          ...c,
          blocks: c.blocks.filter(b => b !== blockId)
        }))
      }));
      setPages(newPages);
      setTimeout(() => saveConfig(), 200);
    } catch (e) {
      console.error("Error deleting image:", e);
      alert("Error eliminando imagen");
    }
  };

  const updateImageHeight = (blockId, val) => {
    const newImages = printImages.map(img => 
      String(img.id) === String(blockId) ? { ...img, height: Number(val) } : img
    );
    setPrintImages(newImages);
    saveImagesConfig(newImages);
  };

  const saveImagesConfig = async (newImages) => {
    setPrintImages(newImages);
    try {
      await supabase.from('menu_print_config').update({ images: newImages }).eq('id', 2);
    } catch (e) {
      console.error("Error saving images config:", e);
    }
  };

  const moveBlock = (blockId, direction, pageIndex, colIdx) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    const currentBlocks = newPages[pageIndex].columns[colIdx].blocks;
    const idx = currentBlocks.indexOf(blockId);

    if (direction === 'up' && idx > 0) {
      [currentBlocks[idx - 1], currentBlocks[idx]] = [currentBlocks[idx], currentBlocks[idx - 1]];
    } else if (direction === 'down' && idx < currentBlocks.length - 1) {
      [currentBlocks[idx + 1], currentBlocks[idx]] = [currentBlocks[idx], currentBlocks[idx + 1]];
    } else if (direction === 'left' && colIdx > 0) {
      currentBlocks.splice(idx, 1);
      newPages[pageIndex].columns[colIdx - 1].blocks.push(blockId);
    } else if (direction === 'right' && colIdx < newPages[pageIndex].columns.length - 1) {
      currentBlocks.splice(idx, 1);
      newPages[pageIndex].columns[colIdx + 1].blocks.push(blockId);
    } else if (direction === 'left' && colIdx === 0 && pageIndex > 0) {
      currentBlocks.splice(idx, 1);
      const lastColOfPrevPage = newPages[pageIndex - 1].columns.length - 1;
      newPages[pageIndex - 1].columns[lastColOfPrevPage].blocks.push(blockId);
    } else if (direction === 'right' && colIdx === newPages[pageIndex].columns.length - 1 && pageIndex < pages.length - 1) {
      currentBlocks.splice(idx, 1);
      newPages[pageIndex + 1].columns[0].blocks.push(blockId);
    }

    setPages(newPages);
  };

  const addColumn = (pageIndex) => {
    const newPages = [...pages];
    newPages[pageIndex].columns.push({ id: 'COL_' + Date.now(), blocks: [], flex: 1 });
    setPages(newPages);
    // Trigger save after state update
    setTimeout(() => saveConfig(), 100);
  };

  const updateColumnFlex = (pageIndex, colIdx, flexValue, shouldSave = false) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    if (newPages[pageIndex] && newPages[pageIndex].columns[colIdx]) {
      newPages[pageIndex].columns[colIdx].flex = flexValue;
      setPages(newPages);
      if (shouldSave) {
        setTimeout(() => saveConfig(), 100);
      }
    }
  };

  const removeColumn = (pageIndex, colIdx) => {
    if (!window.confirm("¿Eliminar esta columna y sus bloques?")) return;
    const newPages = [...pages];
    newPages[pageIndex].columns.splice(colIdx, 1);
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const addBlock = (pageIndex, colIdx) => {
    setShowBlockSelector({ pageIndex, colIdx });
  };

  const handleSelectBlockType = (type, category = null) => {
    if (!showBlockSelector) return;
    const { pageIndex, colIdx } = showBlockSelector;
    
    let newBlockId;
    if (type === 'MENU') {
      newBlockId = category;
    } else if (type === 'QR') {
      newBlockId = 'QR';
    } else if (type === 'INFO') {
      newBlockId = 'INFO';
    } else if (type === 'IMAGE') {
      fileInputRef.current.click();
      setShowBlockSelector(null);
      return;
    } else {
      newBlockId = 'CUSTOM_' + Math.random().toString(36).substr(2, 9);
    }

    const newPages = [...pages];
    newPages[pageIndex].columns[colIdx].blocks.push(newBlockId);
    setPages(newPages);
    setShowBlockSelector(null);
    setTimeout(() => saveConfig(), 100);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || uploadTargetPage === null) return;
    const pageIndex = uploadTargetPage;

    if (file.size > 4 * 1024 * 1024) {
      alert("Imagen demasiado pesada (<4MB)");
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `menu_print_images/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("Images_eventos").upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from("Images_eventos").getPublicUrl(fileName);
      const newImageId = 'IMG_' + Math.random().toString(36).substr(2, 9);
      const newImage = { id: newImageId, url: data.publicUrl, path: fileName, height: 150, nameES: '', nameEN: '' };

      setPrintImages(prev => [...prev, newImage]);

      const newPages = [...pages];
      if (newPages[pageIndex].columns.length === 0) {
        newPages[pageIndex].columns.push({ id: 'COL_1', blocks: [] });
      }
      newPages[pageIndex].columns[0].blocks.push(newImageId);
      setPages(newPages);
      setTimeout(() => saveConfig(), 200);

    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
      setUploadTargetPage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteBlock = (blockId) => {
    if (!window.confirm("¿Eliminar este bloque?")) return;
    const newPages = JSON.parse(JSON.stringify(pages));
    newPages.forEach(p => {
      p.columns.forEach(c => {
        c.blocks = c.blocks.filter(b => b !== blockId);
      });
    });
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const addPage = () => {
    const newPage = { id: 'PAGE_' + (pages.length + 1), columns: [{ id: 'COL_1', blocks: [] }] };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const removePage = (pageIndex) => {
    if (pages.length <= 1) return;
    if (!window.confirm("¿Estás seguro de eliminar esta página y todo su contenido?")) return;
    const newPages = pages.filter((_, i) => i !== pageIndex);
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="text-center p-10">Cargando...</div>;

  const commonProps = {
    editMode,
    moveBlock,
    colors,
    leng,
    groupDescriptions,
    setGroupDescriptions,
    saveGroupDescriptions: async (updated) => {
      setGroupDescriptions(updated);
      // We call saveConfig with the most recent descriptions
      setIsSaving(true);
      try {
        const layoutUpdate = { pages, pageSize, colors, qrScale, showIcons };
        const updatedFull = {
          ...updated,
          __layout: { ...(updated.__layout || {}), ...layoutUpdate }
        };
        await supabase.from('menu_print_config').update({
          group_descriptions: updatedFull,
          images: printImages,
          show_icons: showIcons
        }).eq('id', 2);
      } catch (e) {
        console.error("Error auto-saving descriptions:", e);
      } finally {
        setIsSaving(false);
      }
    },
    saveLayoutSizes: (newColorsObj) => {
      if (newColorsObj && newColorsObj.colors) {
        setColors(newColorsObj.colors);
        // We'll let the user save with the main button or we can auto-save colors too
      }
    },
    menuData,
    showIcons,
    setShowIcons,
    qrScale,
    setQrScale,
    printImages,
    setPrintImages,
    saveImagesConfig,
    uploadingImage,
    handleReplaceImage,
    deleteImage,
    updateImageHeight,
    deleteBlock,
    pagesCount: pages.length
  };

  return (
    <div className="flex-1 w-full flex flex-col items-start justify-start bg-zinc-100 pt-[180px] print:bg-white print:p-0 print:m-0 print:block overflow-hidden">
      <HorizontalStyles width={pageSize.width} height={pageSize.height} unit={pageSize.unit} />

      <HorizontalControls
        handlePrint={handlePrint}
        leng={leng}
        setLeng={(newLeng) => {
          setLeng(newLeng);
          setTimeout(() => saveConfig(), 100);
        }}
        editMode={editMode}
        setEditMode={setEditMode}
        showColorPanel={showColorPanel}
        setShowColorPanel={setShowColorPanel}
        pageSize={pageSize}
        setPageSize={setPageSize}
        saveConfig={saveConfig}
        isSaving={isSaving}
        zoom={zoom}
        setZoom={setZoom}
        showIcons={showIcons}
        setShowIcons={setShowIcons}
        addPage={addPage}
        selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn}
        pages={pages}
        updateColumnFlex={updateColumnFlex}
      />


      {showColorPanel && (
        <MenuPrintColorPanel
          colors={colors}
          setColors={setColors}
          saveLayoutSizes={() => { }}
          setShowColorPanel={setShowColorPanel}
        />
      )}

      <div id="print-area" className="flex-1 w-full overflow-auto bg-zinc-200/50 p-8 flex justify-center items-start print:bg-white print:p-0 print:block">
        <div 
          className="transition-all duration-300 ease-in-out"
          style={{ 
            width: `calc((${pageSize.width}${pageSize.unit} * ${pages.length} + 2.5rem * ${pages.length - 1}) * ${zoom})`,
            height: `calc(${pageSize.height}${pageSize.unit} * ${zoom} + 4rem)`,
            position: 'relative'
          }}
        >
          <div 
            className="flex flex-row flex-nowrap items-start justify-start gap-10" 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              width: 'max-content',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {pages.map((p, idx) => (
              <div key={p.id} className="relative group/page">
                {editMode && pages.length > 1 && (
                  <Button 
                    onClick={() => removePage(idx)} 
                    variant="destructive" 
                    className="absolute -top-4 -right-4 z-[100] rounded-full h-8 w-8 p-0 border-2 border-white shadow-lg print:hidden"
                    title="Eliminar Página"
                  >
                    X
                  </Button>
                )}
                <HorizontalPage
                  key={p.id}
                  page={p}
                  pageIndex={idx}
                  width={pageSize.width}
                  height={pageSize.height}
                  unit={pageSize.unit}
                  colors={colors}
                  leng={leng}
                  editMode={editMode}
                  commonProps={commonProps}
                  onAddColumn={addColumn}
                  onRemoveColumn={removeColumn}
                  updateColumnFlex={updateColumnFlex}
                  onAddBlock={addBlock}
                  triggerImageUpload={(idx) => {
                    setUploadTargetPage(idx);
                    fileInputRef.current.click();
                  }}
                  uploadingImage={uploadingImage}
                  selectedColumn={selectedColumn}
                  setSelectedColumn={setSelectedColumn}
                />
            </div>
          ))}
        </div>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />

      {showBlockSelector && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-4 border-black p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
              <h3 className="font-black text-xl uppercase italic">Seleccionar Bloque</h3>
              <button onClick={() => setShowBlockSelector(null)} className="font-black hover:text-red-600 transition-colors">CERRAR X</button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Menú de Productos</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSelectBlockType('MENU', 'CAFE')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">☕ CAFÉ</button>
                  <button onClick={() => handleSelectBlockType('MENU', 'BEBIDAS')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">🍹 BEBIDAS</button>
                  <button onClick={() => handleSelectBlockType('MENU', 'ALIMENTOS')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">🍰 ALIMENTOS</button>
                  <button onClick={() => handleSelectBlockType('MENU', 'EXTRAS')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">➕ ADICIONES</button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Otros Elementos</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSelectBlockType('INFO')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">📄 INFO TEXTO</button>
                  <button onClick={() => handleSelectBlockType('QR')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">📱 CÓDIGO QR</button>
                  <button onClick={() => handleSelectBlockType('CUSTOM')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">✏️ TEXTO LIBRE</button>
                  <button onClick={() => handleSelectBlockType('IMAGE')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-1">🖼️ IMAGEN</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPrintHorizontal;
