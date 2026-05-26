import React, { useState, useEffect } from "react";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";

const MenuPrintHeader = ({ colors, leng, title, editMode, onTitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title || (leng ? "Proyecto Café Menu" : "Menú Proyecto Café"));

  useEffect(() => {
    if (title !== undefined) {
      setLocalTitle(title);
    }
  }, [title]);

  const handleBlur = () => {
    setIsEditing(false);
    if (onTitleChange) {
      onTitleChange(localTitle);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div
      className="border-[3px] px-1 py-1 mb-3 shadow-[8px_8px_0px_0px] flex justify-between items-center rounded-[8px] relative z-10 gap-2 flex-nowrap"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: colors.mainBorder,
        boxShadow: `5px 5px 0px 0px ${colors.mainBorder}`
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap">
        <img src={BaseSillaLogo} alt="Logo" className="h-8 ml-1 shrink-0 object-contain" />
        {editMode && isEditing ? (
          <input
            autoFocus
            className="font-black tracking-tighter uppercase pt-1 bg-transparent border-b-2 border-dashed border-gray-400 outline-none w-full leading-none"
            style={{ 
              fontFamily: colors.fontTitle || "'First Bunny', sans-serif", 
              color: colors.mainTitle,
              fontSize: `${colors.sizeTitle || 26}${colors.fontSizeUnit || 'px'}`
            }}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <h1
            className={`font-black tracking-tighter uppercase leading-none pt-1 truncate !whitespace-nowrap ${editMode ? 'cursor-text hover:bg-gray-100 rounded px-1 -ml-1 transition-colors' : ''}`}
            style={{ 
              fontFamily: colors.fontTitle || "'First Bunny', sans-serif", 
              color: colors.mainTitle,
              fontSize: `${colors.sizeTitle || 26}${colors.fontSizeUnit || 'px'}`
            }}
            onClick={() => { if (editMode) setIsEditing(true); }}
            title={editMode ? "Haz clic para editar el encabezado" : ""}
          >
            {localTitle || (leng ? "Proyecto Café Menu" : "Menú Proyecto Café")}
          </h1>
        )}
      </div>
      <div className="text-right ml-6 shrink-0" style={{ color: colors.mainTitle, fontFamily: colors.fontBody || 'Inter, sans-serif' }}>
        <p className="text-[13px] font-black uppercase tracking-widest leading-tight">TRANSVERSAL 39 #65D - 22</p>
        <p className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70 leading-tight">Conquistadores, Medellín</p>
      </div>
    </div>
  );
};

export default MenuPrintHeader;
