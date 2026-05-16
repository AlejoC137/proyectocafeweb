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
import HorizontalGallery from "./MenuPrintHorizontal/HorizontalGallery";
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";

function MenuPrintHorizontal() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leng, setLeng] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const menuData = useSelector((state) => state.allMenu);
  const [zoom, setZoom] = useState(0.6);
  const [showIcons, setShowIcons] = useState(true);
  const [showBlockSelector, setShowBlockSelector] = useState(null); // { pageIndex, colIdx }

  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [pageSize, setPageSize] = useState({ width: 210, height: 297, unit: 'mm' });
  const [qrScale, setQrScale] = useState(1);
  const [uploadTargetPage, setUploadTargetPage] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null); // { pageIndex, colIdx }
  const [showGallery, setShowGallery] = useState(false);
  const [galleryContext, setGalleryContext] = useState(null); // 'ADD_BLOCK' | 'REPLACE_IMAGE' | 'SET_BACKGROUND'
  const [galleryTarget, setGalleryTarget] = useState(null); 
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
    { id: 'PAGE_1', columns: [{ id: 'COL_1', blocks: ["CAFE", "QR"], flex: 1 }] },
    { id: 'PAGE_2', columns: [{ id: 'COL_1', blocks: ["BEBIDAS"], flex: 1 }] },
    { id: 'PAGE_3', columns: [{ id: 'COL_1', blocks: ["ALIMENTOS"], flex: 1 }] },
    { id: 'PAGE_4', columns: [{ id: 'COL_1', blocks: ["INFO"], flex: 1 }] }
  ]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Define functions before useEffect to avoid TDZ
  const fetchConfig = async () => {
    try {
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
            loadedPages.push({ id: 'PAGE_' + (loadedPages.length + 1), columns: [{ id: 'COL_1', blocks: [], flex: 1 }] });
          }
          setPages(loadedPages);
        }

        if (layout.qrScale) setQrScale(layout.qrScale);
        if (layout.showIcons !== undefined) setShowIcons(layout.showIcons);
        if (layout.leng !== undefined) setLeng(layout.leng);
        if (layout.colors) setColors(prev => ({ ...prev, ...layout.colors }));
      } else {
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

      await supabase.from('menu_print_config').update({
        group_descriptions: updatedDescriptions,
        images: printImages,
        show_icons: showIcons
      }).eq('id', 2);
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
        __layout: { ...(updated.__layout || {}), pages, pageSize, colors, qrScale, showIcons, leng }
      };
      await supabase.from('menu_print_config').update({
        group_descriptions: updatedLayout
      }).eq('id', 2);
    } catch (e) {
      console.error("Error saving descriptions:", e);
    } finally {
      setIsSaving(false);
    }
  };

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

  const handlePrint = () => {
    window.print();
  };

  const addPage = () => {
    const newPages = [...pages, { id: 'PAGE_' + (pages.length + 1), columns: [{ id: 'COL_1', blocks: [], flex: 1 }] }];
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const removePage = (idx) => {
    if (pages.length <= 1) return;
    if (!window.confirm("¿Eliminar esta página completa?")) return;
    const newPages = pages.filter((_, i) => i !== idx);
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
  };

  const addColumn = (pageIndex) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    newPages[pageIndex].columns.push({ id: 'COL_' + Date.now(), blocks: [], flex: 1 });
    setPages(newPages);
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
    const newPages = JSON.parse(JSON.stringify(pages));
    newPages[pageIndex].columns.splice(colIdx, 1);
    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
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
      return;
    }

    let newBlockId = type;
    if (type === 'MENU' && categoryId) {
      newBlockId = categoryId;
    } else if (type === 'CUSTOM') {
      newBlockId = 'CUSTOM_' + Math.random().toString(36).substr(2, 9);
    }

    const newPages = JSON.parse(JSON.stringify(pages));
    newPages[pageIndex].columns[colIdx].blocks.push(newBlockId);
    setPages(newPages);
    setShowBlockSelector(null);
    setTimeout(() => saveConfig(), 100);
  };

  const openGallery = (context, target) => {
    if (context === 'REMOVE_BACKGROUND') {
      const newPages = JSON.parse(JSON.stringify(pages));
      newPages[target.pageIndex].bgImage = null;
      setPages(newPages);
      setTimeout(() => saveConfig(), 100);
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
      newPages[pageIndex].columns[colIdx].blocks.push(img.id);
      // Ensure the image exists in printImages for this config
      if (!printImages.find(pi => pi.id === img.id)) {
        setPrintImages([...printImages, img]);
      }
    } else if (galleryContext === 'REPLACE_IMAGE') {
      // Logic for replacing image in printImages
      const updatedImages = printImages.map(pi => pi.id === blockId ? { ...pi, url: img.url, storagePath: img.storagePath } : pi);
      setPrintImages(updatedImages);
      // If the image was NOT in printImages, add it
      if (!printImages.find(pi => pi.id === img.id)) {
        setPrintImages([...updatedImages, img]);
      }
    } else if (galleryContext === 'SET_BACKGROUND') {
      newPages[pageIndex].bgImage = img;
    }

    setPages(newPages);
    setShowGallery(false);
    setTimeout(() => saveConfig(), 100);
  };

  const moveBlock = (blockId, direction, pageIndex, colIdx) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    const currentBlocks = newPages[pageIndex].columns[colIdx].blocks;
    const blockIndex = currentBlocks.indexOf(blockId);

    if (direction === 'up' && blockIndex > 0) {
      [currentBlocks[blockIndex], currentBlocks[blockIndex - 1]] = [currentBlocks[blockIndex - 1], currentBlocks[blockIndex]];
    } else if (direction === 'down' && blockIndex < currentBlocks.length - 1) {
      [currentBlocks[blockIndex], currentBlocks[blockIndex + 1]] = [currentBlocks[blockIndex + 1], currentBlocks[blockIndex]];
    } else if (direction === 'left' || direction === 'right') {
      // Logic for moving between columns or pages could go here
    }

    setPages(newPages);
    setTimeout(() => saveConfig(), 100);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-assets')
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
        // Default to adding as block if no specific context or adding block
        newPages[pageIndex].columns[0].blocks.push(newImage.id);
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
        await supabase.storage.from('menu-assets').remove([oldImage.storagePath]);
      }

      const fileExt = newFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-assets')
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-assets')
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
        await supabase.storage.from('menu-assets').remove([imgToDelete.storagePath]);
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
        __layout: { ...(groupDescriptions.__layout || {}), pages, pageSize, colors, qrScale, showIcons, leng }
      };
      await supabase.from('menu_print_config').update({
        images: newImages,
        group_descriptions: updatedLayout
      }).eq('id', 2);
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
    openGallery
  };

  if (loading) return <div className="flex items-center justify-center h-screen font-black italic uppercase text-2xl animate-pulse">Cargando Editor...</div>;

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

      <div id="print-area" className="flex-1 w-full overflow-auto bg-[#e5e7eb] print:bg-white print:p-0 custom-scrollbar">
        {/* Scrollable Canvas Wrapper */}
        <div
          style={{
            width: `calc((${pageSize.width}${pageSize.unit} * ${pages.length} + 3rem * ${pages.length - 1}) * ${zoom} + 4rem)`,
            height: `calc((${pageSize.height}${pageSize.unit} + 8rem) * ${zoom})`,
          }}
          className="relative transition-all duration-300 p-8"
        >
          {/* Actual Scaled Content */}
          <div
            className="transition-all duration-300 ease-in-out shadow-2xl origin-top-left"
            style={{
              width: `calc(${pageSize.width}${pageSize.unit} * ${pages.length} + 3rem * ${pages.length - 1})`,
              height: `calc(${pageSize.height}${pageSize.unit} + 4rem)`,
              transform: `scale(${zoom})`,
            }}
          >
            <div className="flex gap-12 print:gap-0 print:block">
              {pages.map((p, idx) => (
                <div key={p.id} className="relative group/page-container bg-white shadow-xl">
                  <HorizontalPage
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
                  {editMode && pages.length > 1 && (
                    <button
                      onClick={() => removePage(idx)}
                      className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 text-white rounded-full font-black shadow-lg hover:scale-110 transition-transform z-50 print:hidden flex items-center justify-center border-2 border-white"
                      title="Eliminar Página"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
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
      {showGallery && (
        <HorizontalGallery 
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          onUploadNew={() => {
            setShowGallery(false);
            if (galleryContext === 'SET_BACKGROUND') {
              setUploadTargetPage(galleryTarget.pageIndex);
              // We need to handle background upload separately or reuse handleImageUpload
              // For simplicity, let's just trigger the same file input
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
