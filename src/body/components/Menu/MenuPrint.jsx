import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "../../../redux/actions";
import { MENU, ITEMS, DESAYUNO, PANADERIA, REPOSTERIA, TARDEO, BEBIDAS, CAFE, ENLATADOS, ADICIONES, DESAYUNO_DULCE, DESAYUNO_SALADO, CAFE_METODOS, CAFE_ESPRESSO, BEBIDAS_FRIAS, BEBIDAS_CALIENTES, PANADERIA_REPOSTERIA_DULCE, PANADERIA_REPOSTERIA_SALADA, ADICIONES_COMIDAS, ADICIONES_BEBIDAS, AGENDA } from "../../../redux/actions-types";
import { CardGridPrintMatrix } from "@/components/ui/cardGridPrintMatrix";
import { Button } from "@/components/ui/button";
import QrMenu from "@/assets/QR MENU.png";
import MenuPrintInfo from "./MenuPrintInfo";
import MenuPrintFormInfo from "./MenuPrintForm";
import PointingHand from "@/assets/icons/POINTINGHAND.svg";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";
import FondoWeb from "@/assets/fondo.png";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import supabase from "../../../config/supabaseClient";

function ColorSelector({ col, colors, setColors, saveLayoutSizes }) {
  return (
    <div className="flex flex-col gap-1 p-1.5 rounded border border-black/5 hover:bg-black/5 transition-colors group">
      <label className="text-[9px] font-black uppercase tracking-tight leading-none text-gray-500">{col.label}</label>
      <div className="flex items-center gap-1.5">
        <input 
          type="color" 
          value={colors[col.id]} 
          onChange={e => { 
            const c = { ...colors, [col.id]: e.target.value }; 
            setColors(c); 
            saveLayoutSizes({ colors: c }); 
          }} 
          className="w-7 h-7 border border-black p-0 cursor-pointer rounded-sm bg-white shrink-0" 
        />
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-mono font-bold uppercase">{colors[col.id]}</span>
          <span className="text-[7px] text-gray-400 font-medium italic mt-0.5">{col.desc}</span>
        </div>
      </div>
    </div>
  );
}

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  const menuData = useSelector((state) => state.allMenu);

  useEffect(() => {
    if (menuData && menuData.length > 0) {
      const shownItems = menuData
        .filter(p => p.PRINT === true && p.Estado === "Activo")
        .sort((a, b) => (Number(a.Order) || 9999) - (Number(b.Order) || 9999));
      console.log("Items currently visible on the menu (PRINT: true & Active, sorted by Order):", shownItems);
    }
  }, [menuData]);

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
    footerText: "#ffffff"
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
        // Auto-insert initial row if the user created the table but forgot to insert a record
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
    try {
      await supabase.from('menu_print_config').update({ group_descriptions: newDescriptions }).eq('id', 1);
    } catch (e) {
      console.error("Error saving descriptions:", e);
    }
  };

  const renderGroupDescription = (groupId) => {
    const langKey = leng ? 'en' : 'es';
    const text = groupDescriptions[groupId]?.[langKey] || '';

    if (editMode) {
      return (
        <div className="flex-1 min-w-0 flex items-center">
          <input
            type="text"
            className="w-full text-[9px] font-SpaceGrotesk px-1 py-0 border-b border-dashed border-gray-400 bg-yellow-50 print:hidden outline-none"
            placeholder={`Desc ${langKey}...`}
            value={text}
            onChange={(e) => {
              setGroupDescriptions(prev => ({
                ...prev,
                [groupId]: { ...(prev[groupId] || {}), [langKey]: e.target.value }
              }));
            }}
            onBlur={() => saveGroupDescriptions(groupDescriptions)}
          />
        </div>
      );
    }

    if (!text.trim()) return null;

    return (
      <div className="flex-1 min-w-0 flex items-center pb-[2px]">
        <p className="text-[9px] font-SpaceGrotesk leading-none text-gray-500 italic truncate">
          {text}
        </p>
      </div>
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Límite de 4MB para evitar errores 504 Timeout en Supabase
    if (file.size > 4 * 1024 * 1024) {
      alert("La imagen es demasiado pesada. Por favor, sube una imagen de menos de 4MB para evitar problemas de conexión.");
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
      // El error de "Unexpected token <" ocurre cuando el servidor devuelve un HTML 504 en vez de JSON
      if (err.message && (err.message.includes('JSON') || err.message.includes('504'))) {
        alert("El servidor tardó mucho en responder y canceló la subida (Error 504). Asegúrate de tener buena conexión o intenta subir una imagen un poco más ligera.");
      } else {
        alert("Error subiendo imagen.");
      }
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

  const renderBlockControls = (blockId) => {
    if (!editMode) return null;
    let colName = leftColBlocks.includes(blockId) ? 'left' : centerColBlocks.includes(blockId) ? 'center' : 'right';
    let colArray = colName === 'left' ? leftColBlocks : colName === 'center' ? centerColBlocks : rightColBlocks;
    const idx = colArray.indexOf(blockId);
    return (
      <div className="absolute -top-3 -right-3 flex flex-col gap-1 z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'up')} disabled={idx === 0} title="Subir">↑</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'down')} disabled={idx === colArray.length - 1} title="Bajar">↓</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'right')} disabled={colName === 'right'} title="Mover a Derecha">→</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'left')} disabled={colName === 'left'} title="Mover a Izquierda">←</Button>
      </div>
    );
  };

  const headerStyles = {
    CAFE: {
      backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 7px)',
      backgroundColor: '#f0f0f0',
    },
    BEBIDAS: {
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1.5px, transparent 1.5px)',
      backgroundSize: '7px 7px',
      backgroundColor: '#f0f0f0',
    },
    ALIMENTOS: {
      backgroundImage: [
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 8px)',
        'repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 8px)',
      ].join(', '),
      backgroundColor: '#f0f0f0',
    },
    EXTRAS: {
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8'%3E%3Cline x1='1' y1='2' x2='7' y2='2' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3Cline x1='9' y1='6' x2='15' y2='6' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3C/svg%3E\")",
      backgroundSize: '16px 8px',
      backgroundColor: '#f0f0f0',
    },
    INFO: {
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Cline x1='7' y1='3' x2='7' y2='11' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3Cline x1='3' y1='7' x2='11' y2='7' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3C/svg%3E\")",
      backgroundSize: '14px 14px',
      backgroundColor: '#f0f0f0',
    },
  };

  const renderBlock = (blockId) => {
    switch (blockId) {
      case "CAFE":
        return (
          <div key="CAFE" className="border-[2px] bg-white shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}` }}>
            {renderBlockControls("CAFE")}
            <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.CAFE, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.categoryTitle }}>
                {!leng ? "Café" : "Coffee"}
              </h2>
              {renderGroupDescription("CAFE")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            </div>
          </div>
        );
      case "BEBIDAS":
        return (
          <div key="BEBIDAS" className="border-[2px] bg-white shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}` }}>
            {renderBlockControls("BEBIDAS")}
            <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.BEBIDAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.categoryTitle }}>
                {!leng ? "Bebidas" : "Drinks"}
              </h2>
              {renderGroupDescription("BEBIDAS")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            </div>
          </div>
        );
      case "ALIMENTOS":
        return (
          <div key="ALIMENTOS" className="border-[2px] bg-white shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}` }}>
            {renderBlockControls("ALIMENTOS")}
            <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.ALIMENTOS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.categoryTitle }}>
                {!leng ? "Alimentos" : "Food"}
              </h2>
              {renderGroupDescription("ALIMENTOS")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} colors={colors} />
            </div>
          </div>
        );
      case "EXTRAS":
        return (
          <div key="EXTRAS" className="border-[2px] bg-white shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}` }}>
            {renderBlockControls("EXTRAS")}
            <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.EXTRAS, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.categoryTitle }}>
                {!leng ? "Adiciones" : "Extras"}
              </h2>
              {renderGroupDescription("ADICIONES")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={3} editMode={editMode} showIcons={showIcons} colors={colors} />
              <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={3} editMode={editMode} showIcons={showIcons} colors={colors} />
            </div>
          </div>
        );
      case "QR":
        return (
          <div key="QR" className="border-[2px] bg-[#fff] p-2 flex flex-row items-center gap-3 shadow-[4px_4px_0px_0px] mt-auto relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.mainBorder, boxShadow: `4px 4px 0px 0px ${colors.mainBorder}` }}>
            {renderBlockControls("QR")}
            <img src={QrMenu} alt="QR Menu" className="mix-blend-multiply flex-shrink-0" style={{ width: `${64 * qrScale}px`, height: `${64 * qrScale}px`, minWidth: `${64 * qrScale}px` }} />
            <div>
              <p className="font-SpaceGrotesk font-black uppercase leading-tight" style={{ fontSize: `${Math.max(6, 10 * qrScale)}px`, color: colors.mainTitle }}>
                {!leng ? "Escanea para ver fotos y promociones" : "Scan for photos and specials"}
              </p>
              <div className="flex gap-1 mt-1">
                <img src={PointingHand} alt="Point" style={{ height: `${48 * qrScale}px`, width: 'auto' }} />
              </div>
            </div>
            {editMode && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden text-white p-2 text-xs font-SpaceGrotesk">
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="text-right font-bold">Escalar Todo:</span>
                  <input type="range" min="0.5" max="3" step="0.1" value={qrScale} onChange={e => setQrScale(Number(e.target.value))} onMouseUp={() => saveLayoutSizes({ qrScale: Number(qrScale) })} onTouchEnd={() => saveLayoutSizes({ qrScale: Number(qrScale) })} className="w-24 cursor-pointer" />
                  <span>{(qrScale * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        );
      case "INFO":
        return (
          <div key="INFO" className="border-[2px] bg-white shadow-[4px_4px_0px_0px] relative group rounded-[6px] overflow-hidden" style={{ borderColor: colors.categoryBorder, boxShadow: `4px 4px 0px 0px ${colors.categoryBorder}` }}>
            {renderBlockControls("INFO")}
            <div className="border-b-[2px] px-2 py-1 flex items-end gap-2 overflow-hidden" style={{ ...headerStyles.INFO, backgroundColor: colors.categoryBg, borderColor: colors.categoryBorder }}>
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.categoryTitle }}>
                {!leng ? "Más sobre el Menú" : "More About"}
              </h2>
            </div>
            <div className="p-2 text-[9px] leading-tight font-SpaceGrotesk italic" style={{ color: colors.itemComment }}>
              <MenuPrintInfo
                isEnglish={leng}
                editMode={editMode}
                groupDescriptions={groupDescriptions}
                saveGroupDescriptions={saveLayoutSizes ? (updated) => saveGroupDescriptions(updated) : undefined}
                className="p-0 m-0 w-full"
              />
            </div>
          </div>
        );
      default:
        const imgObj = printImages.find(img => String(img.id) === String(blockId));
        if (imgObj) {
          return (
            <div key={blockId} className="relative group border-[2px] border-black p-2 bg-white flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-[6px] overflow-hidden">
              {renderBlockControls(blockId)}

              <div className="w-full flex justify-between items-center mb-1">
                {editMode ? (
                  <input
                    type="text"
                    defaultValue={leng ? (imgObj.nameEN || '') : (imgObj.nameES || '')}
                    placeholder={leng ? "Image Name (English)" : "Nombre de Imagen (Español)"}
                    onBlur={(e) => {
                      const updatedName = e.target.value;
                      const newImages = printImages.map(img =>
                        String(img.id) === String(blockId)
                          ? { ...img, [leng ? 'nameEN' : 'nameES']: updatedName }
                          : img
                      );
                      setPrintImages(newImages);
                      saveImagesConfig(newImages);
                    }}
                    className="text-[11px] font-bold font-SpaceGrotesk uppercase w-full border-b border-black/30 focus:outline-none focus:border-black print:hidden mb-1"
                  />
                ) : (
                  (leng ? imgObj.nameEN : imgObj.nameES) && (
                    <span className="text-[11px] font-bold font-SpaceGrotesk uppercase mb-1 w-full border-b-[2px] border-black pb-1 leading-none text-center">
                      {leng ? imgObj.nameEN : imgObj.nameES}
                    </span>
                  )
                )}
                {editMode && (
                  <div className="flex gap-2 print:hidden ml-2 items-center shrink-0">
                    <label className="text-blue-600 font-bold p-1 bg-blue-100 rounded leading-none text-[10px] cursor-pointer flex items-center justify-center uppercase" title="Reemplazar Imagen">
                      Cambiar
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplaceImage(e, blockId)} disabled={uploadingImage} />
                    </label>
                    <button onClick={() => deleteImage(blockId)} className="text-red-600 font-bold p-1 px-2 bg-red-100 rounded leading-none text-xs flex items-center justify-center">X</button>
                  </div>
                )}
              </div>

              <div className="w-full relative" style={{ height: `${imgObj.height || 150}px` }}>
                <img
                  src={imgObj.url}
                  alt={imgObj.nameES || "Menu Image"}
                  className="w-full h-full object-cover rounded-none grayscale-[30%] contrast-[1.1] brightness-[1.05] border border-black"
                />
              </div>

              {editMode && (
                <div className="absolute bottom-1 left-1 bg-white border border-black p-0.5 text-[9px] z-10 print:hidden font-SpaceGrotesk opacity-0 group-hover:opacity-100 transition-opacity">
                  Alto: <input type="number" defaultValue={imgObj.height || 150} onBlur={(e) => { updateImageHeight(blockId, e.target.value); saveImagesConfig(printImages); }} className="w-10 border-b border-black/30 text-center focus:outline-none" /> px
                </div>
              )}
            </div>
          );
        }
        return null;
    }
  };

  // Usa @media print en CSS para ocultar nav/overlay — sin tocar el DOM de React
  const handlePrint = () => window.print();

  if (loading) {
    return <div className="text-center text-black text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center bg-gray-200 min-h-screen pb-10 print:bg-white print:p-0 print:m-0 print:block">
      <div className="flex gap-4 mt-8 mb-4 print:hidden flex-wrap justify-center items-center">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setEditMode(!editMode)} className={`font-SpaceGrotesk font-medium ${editMode ? 'bg-red-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          {editMode ? "💾 Salir Modo Edición" : "✏️ Editar Orden / Fotos"}
        </Button>
        <Button onClick={toggleShowIcons} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showIcons ? "🚫 Ocultar Iconos" : "👁️ Mostrar Iconos"}
        </Button>
        <Button onClick={() => setShowColorPanel(!showColorPanel)} className={`font-SpaceGrotesk font-medium ${showColorPanel ? 'bg-purple-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          🎨 {showColorPanel ? "Cerrar Colores" : "Personalizar Colores"}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              const next = !showWebsiteBg;
              setShowWebsiteBg(next);
              saveLayoutSizes({ showWebsiteBg: next });
            }} 
            className={`font-SpaceGrotesk font-medium ${showWebsiteBg ? 'bg-blue-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}
          >
            {showWebsiteBg ? "🖼️ Quitar Fondo" : "🖼️ Poner Fondo"}
          </Button>
          {showWebsiteBg && (
            <div className="flex items-center gap-2 bg-black/5 p-1 px-3 rounded-md border border-black/10 h-10">
              <span className="text-xs font-SpaceGrotesk font-bold">Opacidad:</span>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={websiteBgOpacity} 
                onChange={(e) => setWebsiteBgOpacity(Number(e.target.value))}
                onMouseUp={() => saveLayoutSizes({ websiteBgOpacity: Number(websiteBgOpacity) })}
                onTouchEnd={() => saveLayoutSizes({ websiteBgOpacity: Number(websiteBgOpacity) })}
                className="w-24 cursor-pointer accent-black" 
              />
              <span className="text-xs font-SpaceGrotesk font-bold w-8">{(websiteBgOpacity * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {showColorPanel && (
        <div className="w-full max-w-5xl mb-4 bg-white border-2 border-black p-4 rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-300 print:hidden">
          <div className="flex items-center justify-between mb-4 border-b border-black/20 pb-2">
            <h3 className="font-black font-SpaceGrotesk uppercase text-base flex items-center gap-2">
              <span className="bg-black text-white px-1.5 py-0.5 rounded text-sm">🎨</span> Configuración de Colores
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setShowColorPanel(false)} className="h-6 w-6 p-0 border border-black font-black hover:bg-red-50 text-xs">X</Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start divide-x-2 divide-black/10">
            {/* SECCIÓN ENCABEZADO Y PIE */}
            <div className="pr-4">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
                Encabezado y Pie
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mainTitle', label: 'Título Pral.', desc: 'Texto sup.' },
                  { id: 'mainBorder', label: 'Borde/Sombra', desc: 'Líneas gral.' },
                  { id: 'footerBg', label: 'Fondo Pie', desc: 'Barra inf.' },
                  { id: 'footerText', label: 'Texto Pie', desc: 'Info footer' }
                ].map(col => (
                  <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
                ))}
              </div>
            </div>

            {/* SECCIÓN CATEGORÍAS */}
            <div className="px-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
                Secciones
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'categoryTitle', label: 'Títulos', desc: 'Nombres blq.' },
                  { id: 'categoryBorder', label: 'Bordes', desc: 'Marcos blq.' },
                  { id: 'categoryBg', label: 'Fondos', desc: 'Tras cabec.' }
                ].map(col => (
                  <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
                ))}
              </div>
            </div>

            {/* SECCIÓN PRODUCTOS */}
            <div className="pl-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2 text-gray-400">
                Productos
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'itemName', label: 'Nombres', desc: 'Texto item' },
                  { id: 'itemPrice', label: 'Precios', desc: 'Valor item' },
                  { id: 'itemComment', label: 'Comentarios', desc: 'Descrip.' },
                  { id: 'gridBorder', label: 'Divisores', desc: 'Sep. items' }
                ].map(col => (
                  <ColorSelector key={col.id} col={col} colors={colors} setColors={setColors} saveLayoutSizes={saveLayoutSizes} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && <div className="print:hidden w-full max-w-4xl mb-4"><MenuPrintFormInfo /></div>}

      {editMode && (
        <div className="flex items-center justify-center gap-8 bg-yellow-100 border border-yellow-400 p-2 text-xs font-SpaceGrotesk mb-4 print:hidden rounded flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold">Ancho Col. Fotos:</span>
            <input type="range" min={photosWidthUnit === 'px' ? "100" : "15"} max={photosWidthUnit === 'px' ? "400" : "50"} value={photosWidth} onChange={(e) => setPhotosWidth(Number(e.target.value))} onMouseUp={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} onTouchEnd={() => saveLayoutSizes({ photosWidth: Number(photosWidth) })} className="w-[150px]" />
            <span
              className="cursor-pointer font-bold text-blue-600 hover:text-blue-800 underline px-1 bg-white rounded border border-blue-300"
              title="Cambiar unidad (% / px)"
              onClick={() => {
                const newUnit = photosWidthUnit === 'px' ? '%' : 'px';
                const newVal = newUnit === '%' ? 25 : 210;
                setPhotosWidthUnit(newUnit);
                setPhotosWidth(newVal);
                saveLayoutSizes({ photosWidthUnit: newUnit, photosWidth: newVal });
              }}
            >
              {photosWidth}{photosWidthUnit}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-yellow-400 pl-4">
            <span className="font-bold">Col. Bebidas vs Comida:</span>
            <input type="range" min="30" max="70" value={leftColRatio} onChange={(e) => setLeftColRatio(Number(e.target.value))} onMouseUp={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} onTouchEnd={() => saveLayoutSizes({ leftColRatio: Number(leftColRatio) })} className="w-[150px]" />
            <span>{leftColRatio}%</span>
          </div>
        </div>
      )}

      <style>
        {`
          @media print {
            @page {
              size: 11in 17in !important;
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 11in !important;
              height: 17in !important;
              max-height: 17in !important;
              overflow: hidden !important;
              background: white !important;
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 11in !important;
              height: 17in !important;
              max-height: 17in !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
          }
          
          /* Markdown Styles */
          .print-markdown-content p {
            margin-bottom: 0.5em;
          }
          .print-markdown-content p:last-child {
            margin-bottom: 0;
          }
          .print-markdown-content h1, .print-markdown-content h2, .print-markdown-content h3 {
            font-weight: bold;
            margin-top: 0.5em;
            margin-bottom: 0.2em;
            line-height: 1.1;
            color: #000;
          }
          .print-markdown-content h1 { font-size: 1.4em; }
          .print-markdown-content h2 { font-size: 1.2em; }
          .print-markdown-content h3 { font-size: 1.1em; }
          .print-markdown-content strong { font-weight: bold; }
          .print-markdown-content hr {
            border: 0;
            border-bottom: 1px solid #ccc;
            margin: 0.5em 0;
          }
          .print-markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0.5em;
            font-size: 11px;
          }
          .print-markdown-content th, .print-markdown-content td {
            border: 1px solid #000;
            padding: 2px 4px;
            text-align: left;
          }
          .print-markdown-content th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-markdown-content blockquote {
            border-left: 2px solid #000;
            padding-left: 6px;
            margin-left: 0;
            color: #444;
          }
          .print-markdown-content table, 
          .print-markdown-content blockquote, 
          .print-markdown-content ul, 
          .print-markdown-content ol, 
          .print-markdown-content h1, 
          .print-markdown-content h2, 
          .print-markdown-content h3 {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        `}
      </style>

      <div id="print-area" className="flex flex-col gap-10">

        {/* VERSIÓN MATRIZ: SIN DESCRIPCIONES */}
        <div
          className="bg-[#fcfbf9] print:bg-white text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page print:shadow-none print:border-none print:mx-0 print:my-0"
        >
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
            {/* HEADER */}
            <div className="border-[3px] p-2 md:p-3 mb-3 shadow-[6px_6px_0px_0px] flex justify-between items-center rounded-[6px] overflow-hidden relative z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: colors.mainBorder, boxShadow: `6px 6px 0px 0px ${colors.mainBorder}` }}>
              <div className="flex items-center gap-3">
                <img src={BaseSillaLogo} alt="Logo" className="h-10 w-auto" />
                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none m-0 p-0" style={{ fontFamily: "'First Bunny', sans-serif", color: colors.mainTitle }}>
                  {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
                </h1>
              </div>
              <div className="text-right" style={{ color: colors.mainTitle }}>
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">TRANSVERSAL 39 #65D - 22</p>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">Conquistadores, Medellín</p>
              </div>
            </div>

            <div className="flex-grow grid gap-4 items-start h-full relative z-10" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>

              {/* COLUMNA IZQUIERDA */}
              <div className="flex flex-col gap-3">
                {leftColBlocks.map(blockId => renderBlock(blockId))}
              </div>

              {/* COLUMNA CENTRO */}
              <div className="flex flex-col gap-3">
                {centerColBlocks.map(blockId => renderBlock(blockId))}
              </div>

              {/* COLUMNA DERECHA: FRANJA DE FOTOS */}
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
                {rightColBlocks.map(blockId => renderBlock(blockId))}
              </div>

            </div>

            {/* FOOTER */}
            <div className="mt-auto border-[3px] flex justify-between items-center tracking-[0.2em] text-[10px] font-black font-SpaceGrotesk uppercase px-3 py-1.5 shadow-[4px_4px_0px_0px] rounded-[6px] relative z-10" style={{ backgroundColor: colors.footerBg, color: colors.footerText || '#ffffff', borderColor: colors.mainBorder, boxShadow: `4px 4px 0px 0px ${colors.mainBorder}` }}>
              <span>PROYECTO CAFÉ</span>
              <div className="flex gap-4">
                <span>+57 300 821 4593</span>
                <span>@PROYECTO__CAFE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MenuPrint;