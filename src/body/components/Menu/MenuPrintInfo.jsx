import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

function MenuPrintInfo({ isEnglish, editMode, groupDescriptions, saveGroupDescriptions, storageKey = 'INFO' }) {
  const infoFija = {
    ES: {
      Intro: `**Texto personalizado.** Haz clic en editar para cambiar este contenido.`
    },
    EN: {
      Intro: `**Custom text.** Click edit to change this content.`
    }
  };

  // Fixed Intro for the main INFO block
  const isMainInfo = storageKey === 'INFO';
  const defaultTextES = isMainInfo ? `**Más sobre el menú.**
En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados.

**Desayuno:** 8:00 am - 11:30 am.  **Almuerzo:** Cambia cada día, inicia a 12:30. 

**Horario de atención:** L-V: 8:00 a.m. – 7:00 p.m. | Sáb: 8:00 a.m. – 6:00 p.m. Domingo y festivo: Cerrado

**WiFi:** Proyecto_cafe | **Contraseña:** FreddieMercury *(El WiFi es gratis pero recomendamos un consumo mínimo de $10.000)*

**Pregunta por promociones, especiales, eventos, talleres y el menú del día.**` : infoFija.ES.Intro;

  const defaultTextEN = isMainInfo ? `**More about the menu.**
At Proyecto Café we do everything possible to serve dishes and drinks with fresh and well-cared ingredients.

**Breakfast:** 8:00 am - 11:30 am. **Lunch:** Changes daily, starts at 12:30.

**Opening hours:** Mon-Fri: 8:00 a.m. – 7:00 p.m. | Sat: 8:00 a.m. – 6:00 p.m. Sunday and Holidays: Closed

**WiFi:** Proyecto_cafe | **Password:** FreddieMercury *(WiFi is free but we recommend a minimum consumption of $10.000)*

**Ask about promotions, specials, events, workshops, and the daily menu.**` : infoFija.EN.Intro;

  const keyES = `__${storageKey}_text_es`;
  const keyEN = `__${storageKey}_text_en`;
  const keyCols = `__${storageKey}_columns`;

  const [localTextES, setLocalTextES] = useState(defaultTextES);
  const [localTextEN, setLocalTextEN] = useState(defaultTextEN);

  useEffect(() => {
    // Solo sincronizar con las props si NO estamos editando, 
    // para evitar que el texto se borre mientras el usuario escribe si hay actualizaciones en segundo plano.
    if (!editMode) {
      if (groupDescriptions?.[keyES] !== undefined) setLocalTextES(groupDescriptions[keyES]);
      else setLocalTextES(defaultTextES);

      if (groupDescriptions?.[keyEN] !== undefined) setLocalTextEN(groupDescriptions[keyEN]);
      else setLocalTextEN(defaultTextEN);
    }
  }, [groupDescriptions, keyES, keyEN, defaultTextES, defaultTextEN, editMode]);

  const currentText = isEnglish ? localTextEN : localTextES;
  const columns = groupDescriptions?.[keyCols] || 2;

  const handleBlur = () => {
    if (!saveGroupDescriptions) return;
    const updated = {
      ...(groupDescriptions || {}),
      [keyES]: localTextES,
      [keyEN]: localTextEN
    };
    saveGroupDescriptions(updated);
  };

  const parseMarkdown = (text) => {
    if (!text) return "";
    marked.setOptions({ breaks: true, gfm: true });
    return marked.parse(text);
  };

  const [isEditingText, setIsEditingText] = useState(false);

  if (editMode && isEditingText) {
    return (
      <div className="flex flex-col gap-1 w-full print:hidden p-1 bg-yellow-50/80 border border-black rounded">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-gray-700 uppercase">{isEnglish ? "Editar Markdown (English)" : "Editar Markdown (Español)"}</label>
          <button 
            type="button" 
            onClick={() => setIsEditingText(false)}
            className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded uppercase hover:bg-gray-800"
          >
            ✓ Guardar / Listo
          </button>
        </div>
        <textarea
          autoFocus
          className="w-full min-h-[180px] text-[11px] font-mono border border-gray-400 p-2 outline-none focus:border-black bg-white rounded"
          value={currentText}
          onChange={(e) => {
            if (isEnglish) setLocalTextEN(e.target.value);
            else setLocalTextES(e.target.value);
          }}
          onBlur={() => {
            handleBlur();
          }}
        />
        <p className="text-[9px] text-gray-500 mt-0.5">Soporta Markdown completo: **negrita**, *cursiva*, # Títulos, - Listas.</p>
      </div>
    );
  }

  return (
    <div className="relative group/info">
      {editMode && (
        <button
          type="button"
          onClick={() => setIsEditingText(true)}
          className="absolute -top-3 right-0 bg-yellow-300 text-black border border-black px-1.5 py-0.5 text-[8px] font-black uppercase rounded shadow-sm opacity-90 group-hover/info:opacity-100 transition-opacity z-20 cursor-pointer print:hidden"
          title="Haz clic para editar el contenido Markdown"
        >
          ✏️ Editar Texto
        </button>
      )}
      <div
        className={`font-SpaceGrotesk text-justify w-full leading-[1.15] tracking-tight print-markdown-content columns-${columns} gap-4 ${editMode ? 'cursor-pointer hover:bg-yellow-50/60 transition-colors p-1 rounded border border-dashed border-yellow-300' : ''}`}
        onClick={() => { if (editMode) setIsEditingText(true); }}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(currentText) }}
        title={editMode ? "Haz clic para editar texto" : ""}
      />
    </div>
  );
}

export default MenuPrintInfo;
