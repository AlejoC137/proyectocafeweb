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
  const [leftColBlocks, setLeftColBlocks] = useState(["CAFE", "BEBIDAS", "QR"]);
  const [centerColBlocks, setCenterColBlocks] = useState(["ALIMENTOS", "EXTRAS", "INFO"]);
  const [rightColBlocks, setRightColBlocks] = useState([]);
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
        setPhotosWidth(config.group_descriptions?.__layout?.photosWidth ?? 210);
        setPhotosWidthUnit(config.group_descriptions?.__layout?.photosWidthUnit ?? 'px');
        setLeftColRatio(config.group_descriptions?.__layout?.leftColRatio ?? 50);
        setQrScale(config.group_descriptions?.__layout?.qrScale ?? 1);
        setShowWebsiteBg(config.group_descriptions?.__layout?.showWebsiteBg ?? false);
        setWebsiteBgOpacity(config.group_descriptions?.__layout?.websiteBgOpacity ?? 0.5);
        if (config.group_descriptions?.__layout?.colors) {
          setColors(prev => ({ ...prev, ...config.group_descriptions.__layout.colors }));
        }

        const savedLeft = config.group_descriptions?.__layout?.leftColBlocks ?? ["CAFE", "BEBIDAS", "QR"];
        const savedCenter = config.group_descriptions?.__layout?.centerColBlocks ?? ["ALIMENTOS", "EXTRAS", "INFO"];
        let savedRight = config.group_descriptions?.__layout?.rightColBlocks;

        const allBlocks = [...savedLeft, ...savedCenter, ...(savedRight || [])];
        const missingImageIds = loadedImages.filter(img => !allBlocks.includes(img.id)).map(img => img.id);
        if (!savedRight) savedRight = missingImageIds;
        else savedRight = [...savedRight, ...missingImageIds];

        setLeftColBlocks(savedLeft);
        setCenterColBlocks(savedCenter);
        setRightColBlocks(savedRight);
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

      const newRight = [...rightColBlocks, newImageId];
      setRightColBlocks(newRight);
      saveLayoutSizes({ rightColBlocks: newRight });
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
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen?")) return;
    const index = printImages.findIndex(img => img.id === blockId);
    if (index === -1) return;
    const image = printImages[index];
    try {
      if (image.path) {
        await supabase.storage.from("Images_eventos").remove([image.path]);
      }
      const newImages = printImages.filter((_, i) => i !== index);
      setPrintImages(newImages);
      await saveImagesConfig(newImages);

      const newLeft = leftColBlocks.filter(b => b !== blockId);
      const newCenter = centerColBlocks.filter(b => b !== blockId);
      const newRight = rightColBlocks.filter(b => b !== blockId);
      setLeftColBlocks(newLeft);
      setCenterColBlocks(newCenter);
      setRightColBlocks(newRight);
      saveLayoutSizes({ leftColBlocks: newLeft, centerColBlocks: newCenter, rightColBlocks: newRight });
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
      __layout: { photosWidth, photosWidthUnit, leftColRatio, qrScale, leftColBlocks, centerColBlocks, rightColBlocks, showWebsiteBg, websiteBgOpacity, colors, ...updates }
    });
  };

  const moveBlock = (blockId, direction) => {
    let colName = leftColBlocks.includes(blockId) ? 'left' : centerColBlocks.includes(blockId) ? 'center' : 'right';
    let colArray = colName === 'left' ? leftColBlocks : colName === 'center' ? centerColBlocks : rightColBlocks;
    const idx = colArray.indexOf(blockId);

    if (direction === 'up' && idx > 0) {
      const newCol = [...colArray];
      [newCol[idx - 1], newCol[idx]] = [newCol[idx], newCol[idx - 1]];
      if (colName === 'left') setLeftColBlocks(newCol);
      else if (colName === 'center') setCenterColBlocks(newCol);
      else setRightColBlocks(newCol);
      saveLayoutSizes({ [`${colName}ColBlocks`]: newCol });
    } else if (direction === 'down' && idx < colArray.length - 1) {
      const newCol = [...colArray];
      [newCol[idx + 1], newCol[idx]] = [newCol[idx], newCol[idx + 1]];
      if (colName === 'left') setLeftColBlocks(newCol);
      else if (colName === 'center') setCenterColBlocks(newCol);
      else setRightColBlocks(newCol);
      saveLayoutSizes({ [`${colName}ColBlocks`]: newCol });
    } else if (direction === 'right') {
      if (colName === 'left') {
        const newLeft = leftColBlocks.filter(b => b !== blockId);
        const newCenter = [...centerColBlocks, blockId];
        setLeftColBlocks(newLeft); setCenterColBlocks(newCenter);
        saveLayoutSizes({ leftColBlocks: newLeft, centerColBlocks: newCenter });
      } else if (colName === 'center') {
        const newCenter = centerColBlocks.filter(b => b !== blockId);
        const newRight = [...rightColBlocks, blockId];
        setCenterColBlocks(newCenter); setRightColBlocks(newRight);
        saveLayoutSizes({ centerColBlocks: newCenter, rightColBlocks: newRight });
      }
    } else if (direction === 'left') {
      if (colName === 'right') {
        const newRight = rightColBlocks.filter(b => b !== blockId);
        const newCenter = [...centerColBlocks, blockId];
        setRightColBlocks(newRight); setCenterColBlocks(newCenter);
        saveLayoutSizes({ rightColBlocks: newRight, centerColBlocks: newCenter });
      } else if (colName === 'center') {
        const newCenter = centerColBlocks.filter(b => b !== blockId);
        const newLeft = [...leftColBlocks, blockId];
        setCenterColBlocks(newCenter); setLeftColBlocks(newLeft);
        saveLayoutSizes({ centerColBlocks: newCenter, leftColBlocks: newLeft });
      }
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="text-center text-black text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  const commonProps = {
    editMode,
    moveBlock,
    leftColBlocks,
    centerColBlocks,
    rightColBlocks,
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
    updateImageHeight
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
        <div className="bg-[#fcfbf9] print:bg-white text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page print:shadow-none print:border-none print:mx-0 print:my-0">
          <div className="p-4 h-full flex flex-col relative print:p-3 bg-[#fcfbf9] print:bg-white">
            {showWebsiteBg && (
              <div 
                className="absolute inset-0 pointer-events-none z-0"
                style={{ 
                  backgroundImage: `url(${FondoWeb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: websiteBgOpacity 
                }}
              />
            )}

            <MenuPrintHeader colors={colors} leng={leng} />

            <div className="flex-grow grid gap-4 items-start h-full relative z-10" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>
              
              <MenuPrintColumn blocks={leftColBlocks} {...commonProps} />
              
              <MenuPrintColumn blocks={centerColBlocks} {...commonProps} />

              <div className="flex flex-col gap-3 relative">
                {editMode && (
                  <div className="absolute -top-10 right-0 z-[60] print:hidden">
                    <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
                    <Button onClick={() => fileInputRef.current.click()} disabled={uploadingImage} className="font-SpaceGrotesk text-[10px] bg-green-600 p-1 px-2 h-auto text-white hover:bg-green-700">
                      {uploadingImage ? "Subiendo..." : "+ Añadir Foto"}
                    </Button>
                  </div>
                )}

                {rightColBlocks.length === 0 && !editMode && (
                  <div className="text-[10px] text-gray-400 font-bold uppercase text-center mt-10">Sin elementos</div>
                )}
                
                <MenuPrintColumn blocks={rightColBlocks} {...commonProps} />
              </div>

            </div>

            <MenuPrintFooter colors={colors} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuPrint;