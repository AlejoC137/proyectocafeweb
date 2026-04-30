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
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import supabase from "../../../config/supabaseClient";

function MenuPrint() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [leng, setLeng] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
        setPrintImages(config.images || []);
        setGroupDescriptions(config.group_descriptions || {});
        setShowIcons(config.show_icons ?? true);
        setPhotosWidth(config.group_descriptions?.__layout?.photosWidth ?? 210);
        setPhotosWidthUnit(config.group_descriptions?.__layout?.photosWidthUnit ?? 'px');
        setLeftColRatio(config.group_descriptions?.__layout?.leftColRatio ?? 50);
        setQrScale(config.group_descriptions?.__layout?.qrScale ?? 1);
        setLeftColBlocks(config.group_descriptions?.__layout?.leftColBlocks ?? ["CAFE", "BEBIDAS", "QR"]);
        setCenterColBlocks(config.group_descriptions?.__layout?.centerColBlocks ?? ["ALIMENTOS", "EXTRAS", "INFO"]);
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
      const newImages = [...printImages, { id: Date.now(), url: data.publicUrl, path: fileName }];
      setPrintImages(newImages);
      await saveImagesConfig(newImages);
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

  const moveImage = async (index, direction) => {
    if (index + direction < 0 || index + direction >= printImages.length) return;
    const newImages = [...printImages];
    const temp = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = temp;
    setPrintImages(newImages);
    await saveImagesConfig(newImages);
  };

  const deleteImage = async (index) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen?")) return;
    const image = printImages[index];
    try {
      if (image.path) {
        await supabase.storage.from("Images_eventos").remove([image.path]);
      }
      const newImages = printImages.filter((_, i) => i !== index);
      setPrintImages(newImages);
      await saveImagesConfig(newImages);
    } catch (e) {
      console.error("Error deleting image:", e);
      alert("Error eliminando imagen");
    }
  };

  const updateImageHeight = (index, val) => {
    const newImages = [...printImages];
    newImages[index].height = Number(val);
    setPrintImages(newImages);
  };

  const saveLayoutSizes = (updates = {}) => {
    saveGroupDescriptions({ 
      ...groupDescriptions, 
      __layout: { photosWidth, photosWidthUnit, leftColRatio, qrScale, leftColBlocks, centerColBlocks, ...updates } 
    });
  };

  const moveBlock = (blockId, direction) => {
    let inLeft = leftColBlocks.includes(blockId);
    let col = inLeft ? leftColBlocks : centerColBlocks;
    const idx = col.indexOf(blockId);
    if (direction === 'up' && idx > 0) {
      const newCol = [...col];
      [newCol[idx - 1], newCol[idx]] = [newCol[idx], newCol[idx - 1]];
      if (inLeft) setLeftColBlocks(newCol); else setCenterColBlocks(newCol);
      saveLayoutSizes({ [inLeft ? 'leftColBlocks' : 'centerColBlocks']: newCol });
    } else if (direction === 'down' && idx < col.length - 1) {
      const newCol = [...col];
      [newCol[idx + 1], newCol[idx]] = [newCol[idx], newCol[idx + 1]];
      if (inLeft) setLeftColBlocks(newCol); else setCenterColBlocks(newCol);
      saveLayoutSizes({ [inLeft ? 'leftColBlocks' : 'centerColBlocks']: newCol });
    } else if (direction === 'right' && inLeft) {
      const newLeft = leftColBlocks.filter(b => b !== blockId);
      const newCenter = [...centerColBlocks, blockId];
      setLeftColBlocks(newLeft);
      setCenterColBlocks(newCenter);
      saveLayoutSizes({ leftColBlocks: newLeft, centerColBlocks: newCenter });
    } else if (direction === 'left' && !inLeft) {
      const newCenter = centerColBlocks.filter(b => b !== blockId);
      const newLeft = [...leftColBlocks, blockId];
      setLeftColBlocks(newLeft);
      setCenterColBlocks(newCenter);
      saveLayoutSizes({ leftColBlocks: newLeft, centerColBlocks: newCenter });
    }
  };

  const renderBlockControls = (blockId) => {
    if (!editMode) return null;
    let inLeft = leftColBlocks.includes(blockId);
    let col = inLeft ? leftColBlocks : centerColBlocks;
    const idx = col.indexOf(blockId);
    return (
      <div className="absolute -top-3 -right-3 flex flex-col gap-1 z-20 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'up')} disabled={idx === 0} title="Subir">↑</Button>
        <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'down')} disabled={idx === col.length - 1} title="Bajar">↓</Button>
        {inLeft ? (
          <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'right')} title="Mover a Derecha">→</Button>
        ) : (
          <Button size="sm" variant="secondary" className="h-6 w-6 p-0 text-xs rounded-sm border border-black" onClick={() => moveBlock(blockId, 'left')} title="Mover a Izquierda">←</Button>
        )}
      </div>
    );
  };

  const renderBlock = (blockId) => {
    switch(blockId) {
      case "CAFE":
        return (
          <div key="CAFE" className="border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group">
            {renderBlockControls("CAFE")}
            <div className="border-b-[2px] border-black bg-[#f0f0f0] px-2 py-1 flex items-end gap-2 overflow-hidden">
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {!leng ? "Café" : "Coffee"}
              </h2>
              {renderGroupDescription("CAFE")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_ESPRESSO} TITTLE={{ ES: "Espresso", EN: "Espresso" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} SUB_GRUPO={CAFE_METODOS} TITTLE={{ ES: "Métodos", EN: "Methods" }} GRUPO={CAFE} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
            </div>
          </div>
        );
      case "BEBIDAS":
        return (
          <div key="BEBIDAS" className="border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group">
            {renderBlockControls("BEBIDAS")}
            <div className="border-b-[2px] border-black bg-[#f0f0f0] px-2 py-1 flex items-end gap-2 overflow-hidden">
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {!leng ? "Bebidas" : "Drinks"}
              </h2>
              {renderGroupDescription("BEBIDAS")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_CALIENTES} TITTLE={{ ES: "Caliente", EN: "Hot" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={BEBIDAS} SUB_GRUPO={BEBIDAS_FRIAS} TITTLE={{ ES: "Frío", EN: "Cold" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={"ENLATADOS"} TITTLE={{ ES: "Embotellados", EN: "Bottled" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
            </div>
          </div>
        );
      case "ALIMENTOS":
        return (
          <div key="ALIMENTOS" className="border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group">
            {renderBlockControls("ALIMENTOS")}
            <div className="border-b-[2px] border-black bg-[#f0f0f0] px-2 py-1 flex items-end gap-2 overflow-hidden">
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {!leng ? "Alimentos" : "Food"}
              </h2>
              {renderGroupDescription("ALIMENTOS")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_DULCE} TITTLE={{ ES: "Desayuno Dulce", EN: "Sweet Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={DESAYUNO} SUB_GRUPO={DESAYUNO_SALADO} TITTLE={{ ES: "Desayuno Salado", EN: "Savory Breakfast" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={PANADERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_SALADA} TITTLE={{ ES: "Horneados Salados", EN: "Savory Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={REPOSTERIA} SUB_GRUPO={PANADERIA_REPOSTERIA_DULCE} TITTLE={{ ES: "Horneados Dulces", EN: "Sweet Baked" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={TARDEO} TITTLE={{ ES: "Tardeo", EN: "Evening" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
            </div>
          </div>
        );
      case "EXTRAS":
        return (
          <div key="EXTRAS" className="border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group">
            {renderBlockControls("EXTRAS")}
            <div className="border-b-[2px] border-black bg-[#f0f0f0] px-2 py-1 flex items-end gap-2 overflow-hidden">
              <h2 className="font-black text-xl uppercase leading-none m-0 whitespace-nowrap" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {!leng ? "Adiciones" : "Extras"}
              </h2>
              {renderGroupDescription("ADICIONES")}
            </div>
            <div className="p-2">
              <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_BEBIDAS} TITTLE={{ ES: "Bebidas", EN: "Drinks" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
              <CardGridPrintMatrix products={menuData} GRUPO={"ADICIONES"} SUB_GRUPO={ADICIONES_COMIDAS} TITTLE={{ ES: "Comida", EN: "Food" }} isEnglish={leng} columns={2} editMode={editMode} showIcons={showIcons} />
            </div>
          </div>
        );
      case "QR":
        return (
          <div key="QR" className="border-[2px] border-black bg-[#fff] p-2 flex flex-row items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-auto relative group">
            {renderBlockControls("QR")}
            <img src={QrMenu} alt="QR Menu" className="mix-blend-multiply flex-shrink-0" style={{ width: `${64 * qrScale}px`, height: `${64 * qrScale}px`, minWidth: `${64 * qrScale}px` }} />
            <div>
              <p className="font-SpaceGrotesk font-black uppercase leading-tight" style={{ fontSize: `${Math.max(6, 10 * qrScale)}px` }}>
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
          <div key="INFO" className="mt-1 border-[2px] border-black p-2 text-[9px] leading-tight font-SpaceGrotesk italic text-gray-700 bg-white relative group">
            {renderBlockControls("INFO")}
            <MenuPrintInfo isEnglish={leng} className="p-0 m-0 w-full" />
          </div>
        );
      default:
        return null;
    }
  };

  // Usa @media print en CSS para ocultar nav/overlay — sin tocar el DOM de React
  const handlePrint = () => window.print();

  if (loading) {
    return <div className="text-center text-black text-2xl font-SpaceGrotesk font-light">Cargando menú...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center bg-gray-200 min-h-screen pb-10">
      <div className="flex gap-4 mt-8 mb-4 print:hidden flex-wrap justify-center">
        <Button onClick={handlePrint} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          🖨️ Imprimir
        </Button>
        <Button onClick={() => setLeng(!leng)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {leng ? "Switch to Spanish" : "Switch to English"}
        </Button>
        <Button onClick={() => setEditMode(!editMode)} className={`font-SpaceGrotesk font-medium ${editMode ? 'bg-red-600' : 'bg-black'} text-white hover:opacity-80 transition-colors`}>
          {editMode ? "💾 Salir Modo Edición" : "✏️ Editar Orden / Fotos"}
        </Button>
        <Button onClick={() => setShowForm((prev) => !prev)} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showForm ? "Ocultar Mapeo" : "Mostrar Mapeo"}
        </Button>
        <Button onClick={toggleShowIcons} className="font-SpaceGrotesk font-medium bg-black text-white hover:bg-gray-800">
          {showIcons ? "🚫 Ocultar Iconos" : "👁️ Mostrar Iconos"}
        </Button>
      </div>

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

      <div id="print-area" className="flex flex-col gap-10">

        {/* VERSIÓN MATRIZ: SIN DESCRIPCIONES */}
        <div
          className="bg-[#fcfbf9] text-black shadow-2xl w-[11in] h-[17in] border mx-auto overflow-hidden flex flex-col box-border print:break-after-page"
        >
          <div className="p-4 h-full flex flex-col relative print:p-3 bg-[#fcfbf9]">
            {/* HEADER */}
            <div className="border-[3px] border-black bg-white p-2 md:p-3 mb-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none m-0 p-0" style={{ fontFamily: "'First Bunny', sans-serif" }}>
                {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
              </h1>
              <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">TRANSVERSAL 39 #65D - 22</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mt-1">Conquistadores, Medellín</p>
              </div>
            </div>

            <div className="flex-grow grid gap-4 items-start h-full" style={{ gridTemplateColumns: `minmax(0, ${leftColRatio}fr) minmax(0, ${100 - leftColRatio}fr) ${photosWidth}${photosWidthUnit}` }}>

              {/* COLUMNA IZQUIERDA */}
              <div className="flex flex-col gap-3">
                {leftColBlocks.map(blockId => renderBlock(blockId))}
              </div>

              {/* COLUMNA CENTRO */}
              <div className="flex flex-col gap-3">
                {centerColBlocks.map(blockId => renderBlock(blockId))}
              </div>

              {/* COLUMNA DERECHA: FRANJA DE FOTOS */}
              <div className="flex flex-col gap-3 h-full pb-4">
                <div className="border-[2px] border-black bg-[#fff] p-2 flex flex-col items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full overflow-hidden">
                  <div className="flex-grow w-full flex flex-col gap-2 overflow-y-auto print:overflow-hidden hide-scrollbar">

                    {printImages.length === 0 && !editMode && (
                      <div className="text-[10px] text-gray-400 font-bold uppercase text-center mt-10">Sin imágenes</div>
                    )}

                    {printImages.map((img, i) => (
                      <div key={img.id} className="relative w-full border-[2px] border-black bg-gray-100 flex-shrink-0 group" style={{ height: img.height ? `${img.height}px` : (photosWidthUnit === 'px' ? `${photosWidth}px` : '210px') }}>
                        <img src={img.url} alt="Menu photo" className="absolute inset-0 w-full h-full object-cover grayscale-[30%] contrast-[1.1] brightness-[1.05]" />

                        {editMode && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <div className="absolute top-1 left-1 right-1 bg-white p-1 rounded">
                              <span className="text-[9px] font-bold block text-center mb-1">Alto: {img.height || photosWidth}px</span>
                              <input type="range" min="100" max="600" value={img.height || photosWidth} onChange={(e) => updateImageHeight(i, e.target.value)} onMouseUp={() => saveImagesConfig(printImages)} onTouchEnd={() => saveImagesConfig(printImages)} className="w-full h-1 cursor-pointer" />
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => moveImage(i, -1)} disabled={i === 0}><ArrowUp size={16} /></Button>
                              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => moveImage(i, 1)} disabled={i === printImages.length - 1}><ArrowDown size={16} /></Button>
                            </div>
                            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => deleteImage(i)}><Trash2 size={16} /></Button>
                          </div>
                        )}
                      </div>
                    ))}

                    {editMode && (
                      <div className="relative w-full border-[2px] border-dashed border-gray-400 bg-gray-50 flex-shrink-0 print:hidden cursor-pointer hover:bg-gray-100 transition-colors" style={{ height: photosWidthUnit === 'px' ? `${photosWidth}px` : '210px' }}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {uploadingImage ? (
                            <span className="text-xs font-bold text-gray-500 animate-pulse">Subiendo...</span>
                          ) : (
                            <>
                              <Plus size={24} className="text-gray-400 mb-1" />
                              <span className="text-[10px] text-gray-500 font-bold uppercase">Añadir Foto</span>
                              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} ref={fileInputRef} />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="mt-auto border-[3px] border-black flex justify-between items-center tracking-[0.2em] text-[10px] font-black font-SpaceGrotesk uppercase px-3 bg-black text-white py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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