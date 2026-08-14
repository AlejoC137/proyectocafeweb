import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, AGENDA } from "../../../redux/actions-types";
import { Button } from "@/components/ui/button";
import MenuPrintFormInfo from "./MenuPrintForm";
import supabase from "../../../config/supabaseClient";

// Modular Components
import { MenuPrintStyles } from "./MenuPrint/MenuPrintStyles";
import MenuPrintHeader from "./MenuPrint/MenuPrintHeader";
import MenuPrintFooter from "./MenuPrint/MenuPrintFooter";
import MenuPrintControls from "./MenuPrint/MenuPrintControls";
import MenuPrintColorPanel from "./MenuPrint/MenuPrintColorPanel";
import MenuPrintColumn from "./MenuPrint/MenuPrintColumn";
import MenuPage from "./MenuPrint/MenuPage";
import HorizontalGallery from "./MenuPrintHorizontal/HorizontalGallery";

function MenuPrint({ menuId = 1, filterOnlyHelados = false, hideControls = false, previewMode = false }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const [showItemDescriptions, setShowItemDescriptions] = useState(true);

  const rawMenuData = useSelector((state) => state.allMenu || []);
  const menuData = React.useMemo(() => {
    if (!filterOnlyHelados) return rawMenuData;
    const filtered = rawMenuData.filter((item) => {
      const g = (item.GRUPO || "").toUpperCase();
      const sg = (item.SUB_GRUPO || "").toUpperCase();
      const n = (item.NombreES || item.NombreEN || "").toUpperCase();
      return (
        g === "HELADOS" ||
        sg.includes("HELADO") ||
        sg.includes("SOFT") ||
        sg.includes("GELATO") ||
        sg.includes("SORBETE") ||
        n.includes("HELADO") ||
        n.includes("GELATO") ||
        n.includes("SOFT") ||
        n.includes("SORBETE")
      );
    });
    return filtered.length > 0 ? filtered : rawMenuData;
  }, [rawMenuData, filterOnlyHelados]);

  const [printImages, setPrintImages] = useState([]);
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [photosWidth, setPhotosWidth] = useState(210);
  const [photosWidthUnit, setPhotosWidthUnit] = useState('px');
  const [leftColRatio, setLeftColRatio] = useState(50);
  const [qrScale, setQrScale] = useState(1);
  const [zoom, setZoom] = useState(0.5);
  const [pageWidth, setPageWidth] = useState(filterOnlyHelados ? 65 : 27.94);
  const [pageHeight, setPageHeight] = useState(filterOnlyHelados ? 65 : 43.18);
  const [pageSizeUnit, setPageSizeUnit] = useState('cm');

  const [pages, setPages] = useState([
    {
      id: 'PAGE_1',
      left: filterOnlyHelados ? ["HELADOS", "QR"] : ["CAFE", "BEBIDAS", "QR"],
      center: filterOnlyHelados ? ["INFO"] : ["ALIMENTOS", "EXTRAS", "INFO"],
      right: []
    }
  ]);

  const [showWebsiteBg, setShowWebsiteBg] = useState(false);
  const [websiteBgOpacity, setWebsiteBgOpacity] = useState(0.1);
  const [backgroundUrl, setBackgroundUrl] = useState('');
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
    imgShadow: "#000000"
  };

  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryContext, setGalleryContext] = useState(null);
  const [galleryTarget, setGalleryTarget] = useState(null);

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

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.from('menu_print_config').select('*').eq('id', menuId);
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
          supabase.from('menu_print_config').update({ images: loadedImages }).eq('id', menuId).then();
        }
        setPrintImages(loadedImages);
        setGroupDescriptions(config.group_descriptions || {});
        setShowIcons(config.show_icons ?? true);

        const layout = config.group_descriptions?.__layout || {};
        setShowItemDescriptions(layout.showItemDescriptions ?? true);
        setPhotosWidth(layout.photosWidth ?? 210);
        setPhotosWidthUnit(layout.photosWidthUnit ?? 'px');
        setLeftColRatio(layout.leftColRatio ?? 50);
        setQrScale(layout.qrScale ?? 1);
        setPageWidth(layout.pageWidth ?? (filterOnlyHelados ? 65 : 27.94));
        setPageHeight(layout.pageHeight ?? (filterOnlyHelados ? 65 : 43.18));
        setPageSizeUnit(layout.pageSizeUnit ?? 'cm');
        setShowWebsiteBg(layout.showWebsiteBg ?? false);
        setWebsiteBgOpacity(layout.websiteBgOpacity ?? config.websiteBgOpacity ?? 0.1);
        setBackgroundUrl(layout.backgroundUrl || config.backgroundUrl || '');
        setColors(layout.colors ? { ...DEFAULT_COLORS, ...layout.colors } : DEFAULT_COLORS);

        let savedPages = layout.pages || [];
        if (savedPages.length === 0) {
          const savedLeft = layout.leftColBlocks ?? (filterOnlyHelados ? ["HELADOS", "QR"] : ["CAFE", "BEBIDAS", "QR"]);
          const savedCenter = layout.centerColBlocks ?? (filterOnlyHelados ? ["INFO"] : ["ALIMENTOS", "EXTRAS", "INFO"]);
          let savedRight = layout.rightColBlocks || [];
          const allBlocks = [...savedLeft, ...savedCenter, ...savedRight];
          const missingImageIds = loadedImages.filter(img => !allBlocks.includes(img.id)).map(img => img.id);
          savedRight = [...savedRight, ...missingImageIds];
          savedPages = [{ id: 'PAGE_1', left: savedLeft, center: savedCenter, right: savedRight }];
        }

        const cleanedPages = savedPages.map(p => ({
          ...p,
          left: [...new Set(p.left || [])],
          center: [...new Set(p.center || [])],
          right: [...new Set(p.right || [])]
        }));

        setPages(cleanedPages);

      } else {
        setPrintImages([]);
        setGroupDescriptions({});
        setShowIcons(true);
        setShowItemDescriptions(true);
        setPhotosWidth(210);
        setPhotosWidthUnit('px');
        setLeftColRatio(50);
        setQrScale(1);
        setPageWidth(filterOnlyHelados ? 65 : 27.94);
        setPageHeight(filterOnlyHelados ? 65 : 43.18);
        setPageSizeUnit('cm');
        setShowWebsiteBg(false);
        setWebsiteBgOpacity(0.1);
        setBackgroundUrl('');
        setColors(DEFAULT_COLORS);
        setPages([{
          id: 'PAGE_1',
          left: filterOnlyHelados ? ["HELADOS", "QR"] : ["CAFE", "BEBIDAS", "QR"],
          center: filterOnlyHelados ? ["INFO"] : ["ALIMENTOS", "EXTRAS", "INFO"],
          right: []
        }]);
        await supabase.from('menu_print_config').insert([{ id: menuId, images: [], group_descriptions: {}, show_icons: true }]);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    }
  };

  const saveImagesConfig = async (newImages) => {
    try {
      const { error } = await supabase.from('menu_print_config').upsert([{ id: Number(menuId), images: newImages }]);
      if (error) throw error;
    } catch (e) {
      console.error("Error saving images config:", e);
    }
  };

  const toggleShowIcons = async () => {
    const nextState = !showIcons;
    setShowIcons(nextState);
    try {
      const { error } = await supabase.from('menu_print_config').upsert([{ id: Number(menuId), show_icons: nextState }]);
      if (error) throw error;
    } catch (e) {
      console.error("Error saving showIcons config:", e);
    }
  };

  const saveGroupDescriptions = async (newDescriptions) => {
    setGroupDescriptions(newDescriptions);
    try {
      const { error } = await supabase.from('menu_print_config').upsert([{ id: Number(menuId), group_descriptions: newDescriptions }]);
      if (error) throw error;
    } catch (e) {
      console.error("Error saving descriptions:", e);
    }
  };

  const handleImageUpload = async (e, pageIndex = 0) => {
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

      const newPages = [...pages];
      newPages[pageIndex].right = [...(newPages[pageIndex].right || []), newImageId];
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

  const openGallery = (context, target) => {
    setGalleryContext(context);
    setGalleryTarget(target);
    setShowGallery(true);
  };

  const handleGallerySelect = async (img) => {
    const { blockId } = galleryTarget;
    const updatedImages = printImages.map(pi => pi.id === blockId ? { ...pi, url: img.url, path: img.storagePath || img.path } : pi);
    setPrintImages(updatedImages);
    await saveImagesConfig(updatedImages);
    setShowGallery(false);
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen de fondo es demasiado pesada. Sube una de menos de 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `menu_backgrounds/${Date.now()}_bg.${ext}`;
      const { error } = await supabase.storage.from("Images_eventos").upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from("Images_eventos").getPublicUrl(fileName);
      const newUrl = data.publicUrl;
      setBackgroundUrl(newUrl);

      const newDescriptions = {
        ...groupDescriptions,
        __layout: { ...(groupDescriptions.__layout || {}), backgroundUrl: newUrl }
      };
      setGroupDescriptions(newDescriptions);
      await supabase.from('menu_print_config').update({ group_descriptions: newDescriptions }).eq('id', menuId);

    } catch (err) {
      console.error("Error uploading background:", err);
      alert("Error subiendo el fondo.");
    } finally {
      setUploadingImage(false);
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

      const newPages = pages.map(p => ({
        ...p,
        left: p.left.filter(b => b !== blockId),
        center: p.center.filter(b => b !== blockId),
        right: p.right.filter(b => b !== blockId),
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
    const safeUpdates = (updates && typeof updates === 'object' && !updates.nativeEvent && !updates.target) ? updates : {};
    const finalState = {
      pageWidth,
      pageHeight,
      pageSizeUnit,
      photosWidth,
      photosWidthUnit,
      leftColRatio,
      qrScale,
      pages,
      showWebsiteBg,
      websiteBgOpacity,
      colors,
      backgroundUrl,
      showItemDescriptions,
      ...safeUpdates
    };
    saveGroupDescriptions({
      ...groupDescriptions,
      __layout: { ...finalState }
    });
  };

  const updatePageTitle = (pageIndex, newTitle) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    if (newPages[pageIndex]) {
      newPages[pageIndex].title = newTitle;
      setPages(newPages);
      saveLayoutSizes({ pages: newPages });
    }
  };

  const moveBlock = (blockId, direction, pageIndex, columnId) => {
    const newPages = JSON.parse(JSON.stringify(pages));
    const currentPage = newPages[pageIndex];
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
      } else if (columnId === 'right' && pageIndex < pages.length - 1) {
        currentPage.right = currentPage.right.filter(b => b !== blockId);
        newPages[pageIndex+1].left = [blockId, ...newPages[pageIndex+1].left];
      }
    } else if (direction === 'left') {
      if (columnId === 'right') {
        currentPage.right = currentPage.right.filter(b => b !== blockId);
        currentPage.center = [...currentPage.center, blockId];
      } else if (columnId === 'center') {
        currentPage.center = currentPage.center.filter(b => b !== blockId);
        currentPage.left = [...currentPage.left, blockId];
      } else if (columnId === 'left' && pageIndex > 0) {
        currentPage.left = currentPage.left.filter(b => b !== blockId);
        newPages[pageIndex-1].right = [...newPages[pageIndex-1].right, blockId];
      }
    }
    
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const addBlock = (pageIndex = 0) => {
    const newBlockId = 'CUSTOM_' + Math.random().toString(36).substr(2, 9);
    const newPages = [...pages];
    newPages[pageIndex].center = [...newPages[pageIndex].center, newBlockId];
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const deleteBlock = (blockId) => {
    const isCustom = blockId.startsWith('CUSTOM_') || blockId.startsWith('IMG_');
    if (!isCustom && !window.confirm("Este es un bloque de sistema. ¿Estás seguro de que quieres quitarlo del menú?")) return;
    if (isCustom && !window.confirm("¿Eliminar este bloque permanentemente?")) return;

    const newPages = pages.map(p => ({
      ...p,
      left: p.left.filter(b => b !== blockId),
      center: p.center.filter(b => b !== blockId),
      right: p.right.filter(b => b !== blockId),
    }));
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const addPage = () => {
    const newPage = { id: 'PAGE_' + (pages.length + 1), left: [], center: [], right: [] };
    const newPages = [...pages, newPage];
    setPages(newPages);
    saveLayoutSizes({ pages: newPages });
  };

  const removePage = (pageIndex) => {
    if (pages.length <= 1) return;
    if (!window.confirm("¿Estás seguro de eliminar esta página y todo su contenido?")) return;
    const newPages = pages.filter((_, i) => i !== pageIndex);
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
    openGallery,
    pagesCount: pages.length,
    updatePageTitle
  };

  const isPreview = previewMode || hideControls;

  return (
    <div className={`flex w-full flex-col items-center justify-start ${isPreview ? "bg-transparent p-2 min-h-0" : "bg-gray-200 min-h-screen pb-10"} print:bg-white print:p-0 print:m-0 print:block overflow-x-hidden`}>
      <MenuPrintStyles pageWidth={pageWidth} pageHeight={pageHeight} pageSizeUnit={pageSizeUnit} />

      {!isPreview && (
        <MenuPrintControls
          handlePrint={handlePrint}
          leng={leng}
          setLeng={setLeng}
          editMode={editMode}
          setEditMode={setEditMode}
          toggleShowIcons={toggleShowIcons}
          showIcons={showIcons}
          showItemDescriptions={showItemDescriptions}
          setShowItemDescriptions={setShowItemDescriptions}
          showColorPanel={showColorPanel}
          setShowColorPanel={setShowColorPanel}
          showWebsiteBg={showWebsiteBg}
          setShowWebsiteBg={setShowWebsiteBg}
          websiteBgOpacity={websiteBgOpacity}
          setWebsiteBgOpacity={setWebsiteBgOpacity}
          backgroundUrl={backgroundUrl}
          setBackgroundUrl={setBackgroundUrl}
          handleBackgroundUpload={handleBackgroundUpload}
          saveLayoutSizes={saveLayoutSizes}
          photosWidth={photosWidth}
          setPhotosWidth={setPhotosWidth}
          photosWidthUnit={photosWidthUnit}
          setPhotosWidthUnit={setPhotosWidthUnit}
          leftColRatio={leftColRatio}
          setLeftColRatio={setLeftColRatio}
          addBlock={addBlock}
          addPage={addPage}
          zoom={zoom}
          setZoom={setZoom}
          pageWidth={pageWidth}
          setPageWidth={setPageWidth}
          pageHeight={pageHeight}
          setPageHeight={setPageHeight}
          pageSizeUnit={pageSizeUnit}
          setPageSizeUnit={setPageSizeUnit}
        />
      )}

      {!isPreview && showColorPanel && (
        <MenuPrintColorPanel
          colors={colors}
          setColors={setColors}
          saveLayoutSizes={saveLayoutSizes}
          setShowColorPanel={setShowColorPanel}
        />
      )}

      {!isPreview && showForm && <div className="print:hidden w-full max-w-4xl mb-4"><MenuPrintFormInfo /></div>}

      <div id="print-area" className={`flex flex-row flex-nowrap gap-8 items-start justify-center ${isPreview ? "p-2" : "p-10"} overflow-x-auto w-full print:block print:p-0 print:m-0 print:overflow-visible print:gap-0`} style={{ transform: (isPreview || !editMode) ? `scale(${zoom})` : 'none', transformOrigin: 'top center' }}>
        {pages.map((p, idx) => (
          <div key={p.id} className="relative group/page">
            {!isPreview && editMode && pages.length > 1 && (
               <Button 
                onClick={() => removePage(idx)} 
                variant="destructive" 
                className="absolute -top-4 -right-4 z-[100] rounded-full h-8 w-8 p-0 border-2 border-white shadow-lg print:hidden"
                title="Eliminar Página"
              >
                X
              </Button>
            )}
            <MenuPage
              page={p}
              pageIndex={idx}
              showWebsiteBg={showWebsiteBg}
              backgroundUrl={backgroundUrl}
              websiteBgOpacity={websiteBgOpacity}
              colors={colors}
              leng={leng}
              leftColRatio={leftColRatio}
              photosWidth={photosWidth}
              photosWidthUnit={photosWidthUnit}
              editMode={isPreview ? false : editMode}
              handleImageUpload={(e) => handleImageUpload(e, idx)}
              fileInputRef={fileInputRef}
              uploadingImage={uploadingImage}
              Button={Button}
              commonProps={commonProps}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              pageSizeUnit={pageSizeUnit}
            />
          </div>
        ))}
      </div>

      {!isPreview && showGallery && (
        <HorizontalGallery
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          onUploadNew={() => {
            setShowGallery(false);
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        />
      )}
    </div>
  );
}

export default MenuPrint;

