import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import MenuPrintFormInfo from "./MenuPrintForm";
import FondoWeb from "@/assets/fondo.png";
import supabase from "../../../config/supabaseClient";

// Modular Components
import { MenuPrintStyles } from "./MenuPrint/MenuPrintStyles";
import MenuPrintHeader from "./MenuPrint/MenuPrintHeader";
import MenuPrintFooter from "./MenuPrint/MenuPrintFooter";
import MenuPrintControls from "./MenuPrint/MenuPrintControls";
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";
import MenuPrintColumn from "./MenuPrint/MenuPrintColumn";
import MenuPage from "./MenuPrint/MenuPage";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const menuData = useSelector((state) => state.allMenu);

  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [photosWidth, setPhotosWidth] = useState(210);
  const [photosWidthUnit, setPhotosWidthUnit] = useState('px');
  const [leftColRatio, setLeftColRatio] = useState(50);
  const [qrScale, setQrScale] = useState(1);
  
  // New State: Array of pages
  const [pages, setPages] = useState([
    { id: 'PAGE_1', left: ["CAFE", "BEBIDAS", "QR"], center: ["ALIMENTOS", "EXTRAS", "INFO"], right: [] }
  ]);

  const [showWebsiteBg, setShowWebsiteBg] = useState(false);
  const [websiteBgOpacity, setWebsiteBgOpacity] = useState(0.5);
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
    imgShadow: "#000000"
  });
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
      const { data, error } = await supabase.from('menu_print_config').select('*').eq('id', 1);
      if (error) {
        console.error("Error fetching config from table:", error);
        return;
      }
      if (data && data.length > 0) {
        const config = data[0];
        let loadedImages = config.images || [];
        let modifiedImages = false;
        loadedImages = loadedImages.map(img => {
          if (!img.id) { modifiedImages = true; return { ...img, id: 'IMG_' + Math.random().toString(36).substr(2, 9), nameES: '', nameEN: '' }; }
          return img;
        });
        if (modifiedImages) {
          supabase.from('menu_print_config').update({ images: loadedImages }).eq('id', 1).then();
        }
        setPrintImages(loadedImages);
        setGroupDescriptions(config.group_descriptions || {});
        setShowIcons(config.show_icons ?? true);
        
        const layout = config.group_descriptions?.__layout || {};
        setPhotosWidth(layout.photosWidth ?? 210);
        setPhotosWidthUnit(layout.photosWidthUnit ?? 'px');
        setLeftColRatio(layout.leftColRatio ?? 50);
        setQrScale(layout.qrScale ?? 1);
        setShowWebsiteBg(layout.showWebsiteBg ?? false);
        setWebsiteBgOpacity(layout.websiteBgOpacity ?? 0.5);
        if (layout.colors) {
          setColors(prev => ({ ...prev, ...layout.colors }));
        }

        // Migration or Load multi-page config
        let savedPages = layout.pages;
        if (!savedPages) {
          // Fallback/Migration for legacy single-page data
          const savedLeft = layout.leftColBlocks ?? ["CAFE", "BEBIDAS", "QR"];
          const savedCenter = layout.centerColBlocks ?? ["ALIMENTOS", "EXTRAS", "INFO"];
          let savedRight = layout.rightColBlocks || [];

          // Also include missing images in the right column if they weren't anywhere
          const allBlocks = [...savedLeft, ...savedCenter, ...savedRight];
          const missingImageIds = loadedImages.filter(img => !allBlocks.includes(img.id)).map(img => img.id);
          savedRight = [...savedRight, ...missingImageIds];

          savedPages = [{ id: 'PAGE_1', left: savedLeft, center: savedCenter, right: savedRight }];
        }

        // Cleanup duplicates within columns to prevent key collision warnings
        const cleanedPages = savedPages.map(page => ({
          ...page,
          left: [...new Set(page.left || [])],
          center: [...new Set(page.center || [])],
          right: [...new Set(page.right || [])]
        }));
        
        setPages(cleanedPages);

      } else {
        await supabase.from('menu_print_config').insert([{ id: 1, images: [], group_descriptions: {}, show_icons: true }]);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const saveImagesConfig = async (newImages) => {
    try {
      await supabase.from('menu_print_config').update({ images: newImages }).eq('id', 1);
    } catch (e) {
      console.error("Error saving images config:", e);
    }
  };

  const toggleShowIcons = async () => {
    const nextState = !showIcons;
    setShowIcons(nextState);
    try {
      await supabase.from('menu_print_config').update({ show_icons: nextState }).eq('id', 1);
    } catch (e) {
      console.error("Error saving showIcons config:", e);
    }
  };

  const saveGroupDescriptions = async (newDescriptions) => {
    setGroupDescriptions(newDescriptions);
    try {
      await supabase.from('menu_print_config').update({ group_descriptions: newDescriptions }).eq('id', 1);
    } catch (e) {
      console.error("Error saving descriptions:", e);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("La imagen es demasiado pesada. Por favor, sube una imagen de menos de 4MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      const newImages = [...printImages, { id: newImageId, url: data.publicUrl, path: fileName, height: 100, nameES: '', nameEN: '' }];
      setPrintImages(newImages);
      await saveImagesConfig(newImages);

      // Add to the right column of the FIRST page by default
      const newPages = [...pages];
      newPages[0] = { ...newPages[0], right: [...(newPages[0].right || []), newImageId] };
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });

    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Error subiendo imagen.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        await saveImagesConfig(newImages);
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
      await saveImagesConfig(newImages);

      // Remove from all pages/columns
      const newPages = pages.map(page => ({
        ...page,
        left: page.left.filter(b => b !== blockId),
        center: page.center.filter(b => b !== blockId),
        right: page.right.filter(b => b !== blockId),
      }));
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    } catch (e) {
      console.error("Error deleting image:", e);
      alert("Error eliminando imagen");
    }
  };

  const updateImageHeight = (blockId, val) => {
    const newImages = [...printImages];
    const index = newImages.findIndex(img => img.id === blockId);
    if (index !== -1) {
      newImages[index].height = Number(val);
      setPrintImages(newImages);
    }
  };

  const saveLayoutSizes = (updates = {}) => {
    saveGroupDescriptions({
      ...groupDescriptions,
      __layout: { photosWidth, photosWidthUnit, leftColRatio, qrScale, pages, showWebsiteBg, websiteBgOpacity, colors, ...updates }
    });
  };

  const moveBlock = (blockId, direction, pageIndex, columnId) => {
    const newPages = [...pages];
    const page = { ...newPages[pageIndex] };
    const colArray = [...page[columnId]];
    const idx = colArray.indexOf(blockId);

    if (direction === 'up' && idx > 0) {
      [colArray[idx - 1], colArray[idx]] = [colArray[idx], colArray[idx - 1]];
      page[columnId] = colArray;
      newPages[pageIndex] = page;
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    } else if (direction === 'down' && idx < colArray.length - 1) {
      [colArray[idx + 1], colArray[idx]] = [colArray[idx], colArray[idx + 1]];
      page[columnId] = colArray;
      newPages[pageIndex] = page;
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    } else if (direction === 'right') {
      if (columnId === 'left') {
        page.left = page.left.filter(b => b !== blockId);
        page.center = [...page.center, blockId];
      } else if (columnId === 'center') {
        page.center = page.center.filter(b => b !== blockId);
        page.right = [...page.right, blockId];
      } else if (columnId === 'right' && pageIndex < pages.length - 1) {
        // Move to next page's left column
        page.right = page.right.filter(b => b !== blockId);
        newPages[pageIndex + 1] = { ...newPages[pageIndex + 1], left: [blockId, ...newPages[pageIndex + 1].left] };
      }
      newPages[pageIndex] = page;
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    } else if (direction === 'left') {
      if (columnId === 'right') {
        page.right = page.right.filter(b => b !== blockId);
        page.center = [...page.center, blockId];
      } else if (columnId === 'center') {
        page.center = page.center.filter(b => b !== blockId);
        page.left = [...page.left, blockId];
      } else if (columnId === 'left' && pageIndex > 0) {
        // Move to previous page's right column
        page.left = page.left.filter(b => b !== blockId);
        newPages[pageIndex - 1] = { ...newPages[pageIndex - 1], right: [...newPages[pageIndex - 1].right, blockId] };
      }
      newPages[pageIndex] = page;
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    }
  };

  const addPage = () => {
    const newPageId = 'PAGE_' + (pages.length + 1);
    const newPages = [...pages, { id: newPageId, left: [], center: [], right: [] }];
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const addBlock = () => {
    const newBlockId = 'CUSTOM_' + Math.random().toString(36).substr(2, 9);
    const newPages = [...pages];
    // Por defecto lo añadimos a la columna central de la primera página
    newPages[0] = { ...newPages[0], center: [...newPages[0].center, newBlockId] };
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const deleteBlock = (blockId) => {
    // Si es un bloque estándar (no empieza por CUSTOM_ o IMG_), pedimos doble confirmación
    const isCustom = blockId.startsWith('CUSTOM_') || blockId.startsWith('IMG_');
    if (!isCustom && !window.confirm("Este es un bloque de sistema. ¿Estás seguro de que quieres quitarlo del menú?")) return;
    if (isCustom && !window.confirm("¿Eliminar este bloque permanentemente?")) return;

    const newPages = pages.map(page => ({
      ...page,
      left: page.left.filter(b => b !== blockId),
      center: page.center.filter(b => b !== blockId),
      right: page.right.filter(b => b !== blockId),
    }));
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const deletePage = (index) => {
    if (pages.length <= 1) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta página y devolver sus bloques a la página anterior o siguiente?")) return;
    
    const newPages = pages.map(p => ({ ...p }));
    const pageToDelete = newPages[index];
    const targetIdx = index > 0 ? index - 1 : 0; // If deleting first page, move to what was the second page
    
    if (newPages[targetIdx] && targetIdx !== index) {
      newPages[targetIdx].left = [...newPages[targetIdx].left, ...pageToDelete.left];
      newPages[targetIdx].center = [...newPages[targetIdx].center, ...pageToDelete.center];
      newPages[targetIdx].right = [...newPages[targetIdx].right, ...pageToDelete.right];
    } else if (newPages[index + 1]) {
      newPages[index + 1].left = [...pageToDelete.left, ...newPages[index + 1].left];
      newPages[index + 1].center = [...pageToDelete.center, ...newPages[index + 1].center];
      newPages[index + 1].right = [...pageToDelete.right, ...newPages[index + 1].right];
    }

    newPages.splice(index, 1);
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="text-center text-black text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  const commonProps = {
    editMode,
    moveBlock,
    colors,
    leng,
    groupDescriptions,
    setGroupDescriptions,
    saveGroupDescriptions: (updated) => saveGroupDescriptions(updated),
    saveLayoutSizes,
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
    pagesCount: pages.length,
    deleteBlock
  };

  return (
    <div className="flex w-full flex-col items-center justify-center bg-gray-200 min-h-screen pb-10 print:bg-white print:p-0 print:m-0 print:block">
      <MenuPrintStyles />

      <MenuPrintControls 
        handlePrint={handlePrint}
        leng={leng}
        setLeng={setLeng}
        editMode={editMode}
        setEditMode={setEditMode}
        toggleShowIcons={toggleShowIcons}
        showIcons={showIcons}
        showColorPanel={showColorPanel}
        setShowColorPanel={setShowColorPanel}
        showWebsiteBg={showWebsiteBg}
        setShowWebsiteBg={setShowWebsiteBg}
        saveLayoutSizes={saveLayoutSizes}
        websiteBgOpacity={websiteBgOpacity}
        setWebsiteBgOpacity={setWebsiteBgOpacity}
        photosWidth={photosWidth}
        setPhotosWidth={setPhotosWidth}
        photosWidthUnit={photosWidthUnit}
        setPhotosWidthUnit={setPhotosWidthUnit}
        leftColRatio={leftColRatio}
        setLeftColRatio={setLeftColRatio}
        addPage={addPage}
        deletePage={deletePage}
        pagesCount={pages.length}
        addBlock={addBlock}
      />

      {showColorPanel && (
        <MenuPrintColorPanel 
          colors={colors}
          setColors={setColors}
          saveLayoutSizes={saveLayoutSizes}
          setShowColorPanel={setShowColorPanel}
        />
      )}

      {showForm && <div className="print:hidden w-full max-w-4xl mb-4"><MenuPrintFormInfo /></div>}

      <div id="print-area" className="flex flex-col gap-10">
        {pages.map((page, idx) => (
          <MenuPage 
            key={page.id}
            page={page}
            pageIndex={idx}
            showWebsiteBg={showWebsiteBg}
            FondoWeb={FondoWeb}
            websiteBgOpacity={websiteBgOpacity}
            colors={colors}
            leng={leng}
            leftColRatio={leftColRatio}
            photosWidth={photosWidth}
            photosWidthUnit={photosWidthUnit}
            editMode={editMode}
            handleImageUpload={handleImageUpload}
            fileInputRef={fileInputRef}
            uploadingImage={uploadingImage}
            Button={Button}
            commonProps={commonProps}
          />
        ))}
      </div>
    </div>
  );
}

export default MenuPrint;