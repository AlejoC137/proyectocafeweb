import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA, CATEGORIES_t } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import supabase from "../../../config/supabaseClient";

// Modular Components
import { HorizontalStyles } from "./MenuPrintHorizontal/HorizontalStyles";
import HorizontalPage from "./MenuPrintHorizontal/HorizontalPage";
import HorizontalControls from "./MenuPrintHorizontal/HorizontalControls";
import HorizontalGallery from "./MenuPrintHorizontal/HorizontalGallery";
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";
import PrintCanvas from "./MenuPrintHorizontal/PrintCanvas";

export const normalizePageSize = (val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const w = Number(val.width);
    const h = Number(val.height);
    const u = String(val.unit || 'mm').toLowerCase();
    return {
      width: !isNaN(w) && w > 0 ? w : 297,
      height: !isNaN(h) && h > 0 ? h : 210,
      unit: ['mm', 'cm', 'in', 'px'].includes(u) ? u : 'mm'
    };
  }
  if (typeof val === 'string') {
    const upper = val.toUpperCase();
    if (upper.includes('LETTER') || upper.includes('CARTA')) return { width: 279.4, height: 215.9, unit: 'mm' };
    if (upper.includes('TABLOID') || upper.includes('TABLOIDE')) return { width: 431.8, height: 279.4, unit: 'mm' };
    if (upper.includes('A3')) return { width: 420, height: 297, unit: 'mm' };
    if (upper.includes('65')) return { width: 65, height: 65, unit: 'cm' };
  }
  return { width: 297, height: 210, unit: 'mm' };
};

function MenuPrintHorizontal({ menuId = 2, controlTopClass = "top-[64px]", containerPaddingClass = "pt-[180px]" }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leng, setLeng] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const menuData = useSelector((state) => state.allMenu);
  const [showIcons, setShowIcons] = useState(true);
  const [showItemDescriptions, setShowItemDescriptions] = useState(true);
  const [showBlockSelector, setShowBlockSelector] = useState(null); // { pageIndex, colIdx }
  const [blockSearchTerm, setBlockSearchTerm] = useState("");

  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [pageSize, setPageSize] = useState({ width: 297, height: 210, unit: 'mm' });
  const [qrScale, setQrScale] = useState(1);
  const [uploadTargetPage, setUploadTargetPage] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null); // { pageIndex, colIdx }
  const [showGallery, setShowGallery] = useState(false);
  const [galleryContext, setGalleryContext] = useState(null); // 'ADD_BLOCK' | 'REPLACE_IMAGE' | 'SET_BACKGROUND'
  const [galleryTarget, setGalleryTarget] = useState(null);
  const DEFAULT_COLORS = {
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
  };

  const [colors, setColors] = useState(DEFAULT_COLORS);

  const getDefaultPages = (id) => {
    if (Number(id) === 3) {
      return [
        { id: 'PAGE_1', columns: [{ id: 'COL_1', blocks: ["HELADOS", "EXTRAS", "QR"], flex: 1 }] }
      ];
    }
    return [
      { id: 'PAGE_1', columns: [{ id: 'COL_1', blocks: ["CAFE", "QR"], flex: 1 }] },
      { id: 'PAGE_2', columns: [{ id: 'COL_1', blocks: ["BEBIDAS"], flex: 1 }] },
      { id: 'PAGE_3', columns: [{ id: 'COL_1', blocks: ["ALIMENTOS"], flex: 1 }] },
      { id: 'PAGE_4', columns: [{ id: 'COL_1', blocks: ["INFO"], flex: 1 }] }
    ];
  };

  const [pages, setPages] = useState(getDefaultPages(menuId));

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Define functions before useEffect to avoid TDZ
  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('menu_print_config').select('*').eq('id', menuId);
      if (error) {
        console.error("Error fetching config:", error);
        return;
      }
      if (data && data.length > 0) {
        const config = data[0];
        setPrintImages(config.images || []);
        setGroupDescriptions(config.group_descriptions || {});

        const layout = config.group_descriptions?.__layout || {};
        setPageSize(layout.pageSize ? normalizePageSize(layout.pageSize) : { width: 297, height: 210, unit: 'mm' });

        let pagesToUse = layout.pages;
        if (pagesToUse && Array.isArray(pagesToUse) && pagesToUse.length > 0) {
          setPages(pagesToUse);
        } else {
          setPages(getDefaultPages(menuId));
        }

        setQrScale(layout.qrScale ?? 1);
        setShowIcons(layout.showIcons ?? config.show_icons ?? true);
        setShowItemDescriptions(layout.showItemDescriptions ?? true);
        setLeng(layout.leng ?? true);
        setColors(layout.colors ? { ...DEFAULT_COLORS, ...layout.colors } : DEFAULT_COLORS);
      } else {
        const initialPages = getDefaultPages(menuId);
        setPrintImages([]);
        setGroupDescriptions({});
        setPageSize({ width: 297, height: 210, unit: 'mm' });
        setQrScale(1);
        setShowIcons(true);
        setShowItemDescriptions(true);
        setLeng(true);
        setColors(DEFAULT_COLORS);
        setPages(initialPages);
        await supabase.from('menu_print_config').insert([{
          id: menuId,
          images: [],
          group_descriptions: { __layout: { pages: initialPages, pageSize: normalizePageSize({ width: 297, height: 210, unit: 'mm' }), colors: DEFAULT_COLORS, showIcons: true, showItemDescriptions: true } },
          show_icons: true
        }]);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const saveConfig = async (overridePages = null, overrideColors = null, overridePageSize = null) => {
    setIsSaving(true);
    try {
      // Evitar que objetos de evento de React (como MouseEvent de onClick) se tomen como overridePages
      const pagesToSave = Array.isArray(overridePages) ? overridePages : pages;
      const colorsToSave = (overrideColors && typeof overrideColors === 'object' && !overrideColors.nativeEvent && !overrideColors.target) ? overrideColors : colors;
      const pageSizeToSave = normalizePageSize(overridePageSize || pageSize);

      const layoutUpdate = {
        pages: pagesToSave,
        pageSize: pageSizeToSave,
        colors: colorsToSave,
        qrScale,
        showIcons,
        showItemDescriptions,
        leng
      };

      const updatedDescriptions = {
        ...groupDescriptions,
        __layout: { ...(groupDescriptions.__layout || {}), ...layoutUpdate }
      };

      const { error } = await supabase.from('menu_print_config').upsert([{
        id: Number(menuId),
        group_descriptions: updatedDescriptions,
        images: printImages,
        show_icons: showIcons
      }]);

      if (error) throw error;
    } catch (e) {
      console.error("Error saving config:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const saveGroupDescriptions = async (updated) => {
    setGroupDescriptions(updated);
    setIsSaving(true);
    try {
      const updatedLayout = {
        ...updated,
        __layout: { ...(updated.__layout || {}), pages, pageSize, colors, qrScale, showIcons, showItemDescriptions, leng }
      };
      const { error } = await supabase.from('menu_print_config').upsert([{
        id: Number(menuId),
        group_descriptions: updatedLayout,
        images: printImages,
        show_icons: showIcons
      }]);

      if (error) throw error;
    } catch (e) {
      console.error("Error saving descriptions:", e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(AGENDA))
        ]);
        await fetchConfig();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch, menuId]);

  const handlePrint = () => {
    window.print();
  };

  const addPage = () => {
    const newPages = [...pages, { id: 'PAGE_' + (pages.length + 1), columns: [{ id: 'COL_1', blocks: [], flex: 1 }] }];
    setPages(newPages);
    saveConfig(newPages);
  };

  const removePage = (idx) => {
    if (pages.length <= 1) {
      alert("El menú debe tener al menos 1 página.");
      return;
    }
    if (!window.confirm("¿Eliminar esta página completa?")) return;
    const newPages = pages.filter((_, i) => i !== idx);
    setPages(newPages);
    saveConfig(newPages);
  };

  const addColumn = (pageIndex) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    if (!newPages[pageIndex].columns) newPages[pageIndex].columns = [];
    newPages[pageIndex].columns.push({ id: 'COL_' + Date.now(), blocks: [], flex: 1 });
    setPages(newPages);
    saveConfig(newPages);
  };

  const updateColumnFlex = (pageIndex, colIdx, flexValue, shouldSave = false) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    if (newPages[pageIndex] && newPages[pageIndex].columns[colIdx]) {
      newPages[pageIndex].columns[colIdx].flex = flexValue;
      setPages(newPages);
      if (shouldSave) {
        saveConfig(newPages);
      }
    }
  };

  const removeColumn = (pageIndex, colIdx) => {
    if (!window.confirm("¿Eliminar esta columna y sus bloques?")) return;
    const newPages = JSON.parse(JSON.stringify(pages));
    newPages[pageIndex].columns.splice(colIdx, 1);
    setPages(newPages);
    saveConfig(newPages);
  };

  const addBlock = (pageIndex, colIdx) => {
    setShowBlockSelector({ pageIndex, colIdx });
  };

  const handleSelectBlockType = (type, categoryId = null) => {
    if (!showBlockSelector) return;
    const { pageIndex, colIdx } = showBlockSelector;

    if (type === 'IMAGE') {
      openGallery('ADD_BLOCK', { pageIndex, colIdx });
      setShowBlockSelector(null);
      setBlockSearchTerm("");
      return;
    }

    let newBlockId = type;
    let updatedDescriptions = groupDescriptions;

    if (type === 'MENU' && categoryId) {
      newBlockId = categoryId + '_' + Math.random().toString(36).substr(2, 9);
    } else if (type === 'ITEM') {
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      newBlockId = categoryId ? `ITEM_${categoryId}_${randomSuffix}` : `ITEM_${randomSuffix}`;
      if (categoryId) {
        updatedDescriptions = {
          ...groupDescriptions,
          [`item_${newBlockId}_productId`]: categoryId,
          [`item_${newBlockId}_mode`]: 'normal'
        };
        setGroupDescriptions(updatedDescriptions);
      }
    } else if (type === 'CUSTOM') {
      newBlockId = 'CUSTOM_' + Math.random().toString(36).substr(2, 9);
    } else if (type === 'INFO' || type === 'QR') {
      newBlockId = type + '_' + Math.random().toString(36).substr(2, 9);
    }

    const newPages = JSON.parse(JSON.stringify(pages));
    if (!newPages[pageIndex].columns) newPages[pageIndex].columns = [];
    if (!newPages[pageIndex].columns[colIdx].blocks) newPages[pageIndex].columns[colIdx].blocks = [];
    newPages[pageIndex].columns[colIdx].blocks.push(newBlockId);
    setPages(newPages);
    setShowBlockSelector(null);
    setBlockSearchTerm("");
    saveConfig(newPages);
    if (type === 'ITEM' && categoryId) {
      saveGroupDescriptions(updatedDescriptions);
    }
  };

  const openGallery = (context, target) => {
    if (context === 'REMOVE_BACKGROUND') {
      const newPages = JSON.parse(JSON.stringify(pages));
      newPages[target.pageIndex].bgImage = null;
      setPages(newPages);
      saveConfig(newPages);
      return;
    }
    setGalleryContext(context);
    setGalleryTarget(target);
    setShowGallery(true);
  };

  const handleGallerySelect = async (img) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    const { pageIndex, colIdx, blockId } = galleryTarget;

    if (galleryContext === 'ADD_BLOCK') {
      if (!newPages[pageIndex].columns) newPages[pageIndex].columns = [];
      if (!newPages[pageIndex].columns[colIdx].blocks) newPages[pageIndex].columns[colIdx].blocks = [];
      newPages[pageIndex].columns[colIdx].blocks.push(img.id);
      if (!printImages.find(pi => pi.id === img.id)) {
        setPrintImages([...printImages, img]);
      }
    } else if (galleryContext === 'REPLACE_IMAGE') {
      const updatedImages = printImages.map(pi => pi.id === blockId ? { ...pi, url: img.url, storagePath: img.storagePath } : pi);
      setPrintImages(updatedImages);
      if (!printImages.find(pi => pi.id === img.id)) {
        setPrintImages([...updatedImages, img]);
      }
    } else if (galleryContext === 'SET_BACKGROUND') {
      newPages[pageIndex].bgImage = img;
    }

    setPages(newPages);
    setShowGallery(false);
    saveConfig(newPages);
  };

  const moveBlock = (blockId, direction, pageIndex, colIdx) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    const currentBlocks = newPages[pageIndex].columns[colIdx].blocks;
    const blockIndex = currentBlocks.indexOf(blockId);

    if (direction === 'up' && blockIndex > 0) {
      [currentBlocks[blockIndex], currentBlocks[blockIndex - 1]] = [currentBlocks[blockIndex - 1], currentBlocks[blockIndex]];
    } else if (direction === 'down' && blockIndex < currentBlocks.length - 1) {
      [currentBlocks[blockIndex], currentBlocks[blockIndex + 1]] = [currentBlocks[blockIndex + 1], currentBlocks[blockIndex]];
    }

    setPages(newPages);
    saveConfig(newPages);
  };

  const updatePageTitle = (pageIndex, newTitle) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    if (newPages[pageIndex]) {
      newPages[pageIndex].title = newTitle;
      setPages(newPages);
      saveConfig(newPages);
    }
  };

  const deleteBlock = (blockId) => {
    if (!window.confirm("¿Eliminar este bloque?")) return;
    const newPages = JSON.parse(JSON.stringify(pages));
    newPages.forEach(p => {
      p.columns.forEach(c => {
        const idx = c.blocks.indexOf(blockId);
        if (idx !== -1) c.blocks.splice(idx, 1);
      });
    });
    setPages(newPages);
    saveConfig(newPages);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Images_eventos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Images_eventos')
        .getPublicUrl(filePath);

      const newImage = {
        id: 'IMG_' + Date.now(),
        url: publicUrl,
        storagePath: filePath,
        height: 300
      };

      const updatedImages = [...printImages, newImage];
      setPrintImages(updatedImages);

      const newPages = JSON.parse(JSON.stringify(pages));

      if (galleryContext === 'SET_BACKGROUND') {
        newPages[pageIndex].bgImage = newImage;
      } else {
        if (newPages[pageIndex]) {
          if (!newPages[pageIndex].columns) newPages[pageIndex].columns = [];
          if (!newPages[pageIndex].columns[0]) newPages[pageIndex].columns[0] = { id: 'COL_1', blocks: [], flex: 1 };
          if (!newPages[pageIndex].columns[0].blocks) newPages[pageIndex].columns[0].blocks = [];
          newPages[pageIndex].columns[0].blocks.push(newImage.id);
        }
      }

      setPages(newPages);
      await saveImagesConfig(updatedImages);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
      setUploadTargetPage(null);
      setGalleryContext(null);
    }
  };

  const handleReplaceImage = async (oldImageId, newFile) => {
    setUploadingImage(true);
    try {
      const oldImage = printImages.find(img => img.id === oldImageId);
      if (oldImage && oldImage.storagePath) {
        await supabase.storage.from('Images_eventos').remove([oldImage.storagePath]);
      }

      const fileExt = newFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Images_eventos')
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Images_eventos')
        .getPublicUrl(filePath);

      const updatedImages = printImages.map(img =>
        img.id === oldImageId ? { ...img, url: publicUrl, storagePath: filePath } : img
      );

      setPrintImages(updatedImages);
      await saveImagesConfig(updatedImages);
    } catch (error) {
      console.error("Error replacing image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm("¿Eliminar imagen permanentemente?")) return;
    const imgToDelete = printImages.find(img => img.id === imageId);

    try {
      if (imgToDelete && imgToDelete.storagePath) {
        await supabase.storage.from('Images_eventos').remove([imgToDelete.storagePath]);
      }

      const updatedImages = printImages.filter(img => img.id !== imageId);
      setPrintImages(updatedImages);

      const newPages = JSON.parse(JSON.stringify(pages));
      newPages.forEach(p => {
        p.columns.forEach(c => {
          const idx = c.blocks.indexOf(imageId);
          if (idx !== -1) c.blocks.splice(idx, 1);
        });
      });
      setPages(newPages);

      await saveImagesConfig(updatedImages);
    } catch (error) {
      console.error("Error deleting image:", error);
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
      const updatedLayout = {
        ...groupDescriptions,
        __layout: { ...(groupDescriptions.__layout || {}), pages, pageSize, colors, qrScale, showIcons, showItemDescriptions, leng }
      };
      const { error } = await supabase.from('menu_print_config').upsert([{
        id: Number(menuId),
        images: newImages,
        group_descriptions: updatedLayout,
        show_icons: showIcons
      }]);
      if (error) throw error;
    } catch (e) {
      console.error("Error saving images:", e);
    }
  };

  const commonProps = {
    editMode,
    moveBlock,
    colors,
    leng,
    menuData,
    showIcons,
    showItemDescriptions,
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
    groupDescriptions,
    setGroupDescriptions,
    saveGroupDescriptions,
    pagesCount: pages.length,
    openGallery,
    updatePageTitle
  };

  if (loading) return <div className="flex items-center justify-center h-screen font-black italic uppercase text-2xl animate-pulse">Cargando Editor...</div>;

  return (
    <div className={`flex-1 w-full flex flex-col bg-zinc-100 ${containerPaddingClass} print:bg-white print:p-0 print:m-0 print:block overflow-x-hidden`}>
      <HorizontalStyles width={pageSize.width} height={pageSize.height} unit={pageSize.unit} />

      <HorizontalControls
        controlTopClass={controlTopClass}
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
        showIcons={showIcons}
        setShowIcons={setShowIcons}
        showItemDescriptions={showItemDescriptions}
        setShowItemDescriptions={setShowItemDescriptions}
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
          saveLayoutSizes={(updates) => saveConfig(null, updates?.colors || colors)}
          setShowColorPanel={setShowColorPanel}
        />
      )}

      <PrintCanvas
        pages={pages}
        pageSize={pageSize}
        colors={colors}
        leng={leng}
        editMode={editMode}
        commonProps={commonProps}
        onAddColumn={addColumn}
        onRemoveColumn={removeColumn}
        updateColumnFlex={updateColumnFlex}
        onAddBlock={addBlock}
        setUploadTargetPage={setUploadTargetPage}
        fileInputRef={fileInputRef}
        uploadingImage={uploadingImage}
        selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn}
        removePage={removePage}
      />

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />

      {showBlockSelector && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white border-4 border-black p-4 md:p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b-2 border-black pb-3 shrink-0">
              <div>
                <h3 className="font-black text-xl uppercase italic">Seleccionar Bloque</h3>
                <p className="text-xs text-gray-500 font-bold">Elige un elemento de layout, categoría o busca un ítem del menú</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    placeholder="🔍 Buscar categoría o ítem..."
                    value={blockSearchTerm}
                    onChange={(e) => setBlockSearchTerm(e.target.value)}
                    className="w-full border-2 border-black px-3 py-1.5 text-xs font-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-yellow-50"
                  />
                  {blockSearchTerm && (
                    <button 
                      onClick={() => setBlockSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => { setShowBlockSelector(null); setBlockSearchTerm(""); }} 
                  className="font-black hover:text-red-600 transition-colors border-2 border-black px-3 py-1.5 text-xs rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100 hover:bg-gray-200 shrink-0"
                >
                  CERRAR X
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              {/* Layout Elements */}
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Elementos de Layout</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <button onClick={() => handleSelectBlockType('INFO')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><span>📄</span><span>INFO TEXTO</span></button>
                  <button onClick={() => handleSelectBlockType('QR')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><span>📱</span><span>CÓDIGO QR</span></button>
                  <button onClick={() => handleSelectBlockType('CUSTOM')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><span>✏️</span><span>TEXTO LIBRE</span></button>
                  <button onClick={() => handleSelectBlockType('IMAGE')} className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><span>🖼️</span><span>IMAGEN</span></button>
                  <button onClick={() => handleSelectBlockType('ITEM')} className="border-2 border-black p-2 font-bold text-xs hover:bg-yellow-300 hover:text-black transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><span>🏷️</span><span>ÍTEM MENÚ</span></button>
                </div>
              </div>

              {/* Action Types / Categories */}
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">
                  Categorías de Productos ({Object.entries(CATEGORIES_t).filter(([k, v]) => !blockSearchTerm || v.es.toLowerCase().includes(blockSearchTerm.toLowerCase()) || v.en.toLowerCase().includes(blockSearchTerm.toLowerCase())).length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {Object.entries(CATEGORIES_t)
                    .filter(([catKey, catObj]) => 
                      !blockSearchTerm || 
                      catObj.es.toLowerCase().includes(blockSearchTerm.toLowerCase()) || 
                      catObj.en.toLowerCase().includes(blockSearchTerm.toLowerCase()) ||
                      catKey.toLowerCase().includes(blockSearchTerm.toLowerCase())
                    )
                    .map(([catKey, catObj]) => (
                      <button
                        key={catKey}
                        onClick={() => handleSelectBlockType('MENU', catKey)}
                        className="border-2 border-black p-2 font-bold text-xs hover:bg-black hover:text-white transition-all rounded active:translate-y-0.5 flex items-center gap-2 text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <span className="text-sm">{catObj.icon || "📌"}</span>
                        <span className="truncate">{catObj.es.toUpperCase()}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Direct Menu Item Selector */}
              {Array.isArray(menuData) && menuData.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      Ítems Singulares de Menú ({
                        menuData.filter(p => 
                          p.Estado !== "Inactivo" && p.Estado !== "INACTIVO" &&
                          (!blockSearchTerm || p.NombreES?.toLowerCase().includes(blockSearchTerm.toLowerCase()) || p.NombreEN?.toLowerCase().includes(blockSearchTerm.toLowerCase()) || p.GRUPO?.toLowerCase().includes(blockSearchTerm.toLowerCase()))
                        ).length
                      })
                    </p>
                    <span className="text-[9px] text-gray-400 font-bold">Haz clic en un ítem para agregarlo directamente</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border-2 border-black/10 rounded bg-gray-50">
                    {menuData
                      .filter(p => 
                        p.Estado !== "Inactivo" && p.Estado !== "INACTIVO" &&
                        (!blockSearchTerm || p.NombreES?.toLowerCase().includes(blockSearchTerm.toLowerCase()) || p.NombreEN?.toLowerCase().includes(blockSearchTerm.toLowerCase()) || p.GRUPO?.toLowerCase().includes(blockSearchTerm.toLowerCase()))
                      )
                      .slice(0, blockSearchTerm ? 40 : 20)
                      .map(item => (
                        <button
                          key={item._id}
                          onClick={() => handleSelectBlockType('ITEM', item._id)}
                          className="border-2 border-black p-2 font-bold text-xs hover:bg-yellow-200 transition-all rounded text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 group"
                        >
                          <div className="flex flex-col truncate">
                            <span className="truncate text-[11px] font-black group-hover:text-black">{item.NombreES}</span>
                            <span className="text-[9px] text-gray-500 font-normal uppercase">{item.GRUPO}</span>
                          </div>
                          <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded shrink-0">${item.Precio >= 1000 ? `${(item.Precio/1000).toFixed(item.Precio % 1000 === 0 ? 0 : 1)}K` : item.Precio}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showGallery && (
        <HorizontalGallery
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          onUploadNew={() => {
            setShowGallery(false);
            if (galleryContext === 'SET_BACKGROUND') {
              setUploadTargetPage(galleryTarget.pageIndex);
              fileInputRef.current.click();
            } else if (galleryContext === 'ADD_BLOCK') {
              setUploadTargetPage(galleryTarget.pageIndex);
              fileInputRef.current.click();
            } else {
              fileInputRef.current.click();
            }
          }}
        />
      )}
    </div>
  );
}

export default MenuPrintHorizontal;
