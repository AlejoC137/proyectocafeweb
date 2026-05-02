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

  if (editMode) {
    return (
      <div className="flex flex-col gap-1 w-full print:hidden">
        <label className="text-xs font-bold text-gray-500 uppercase">{isEnglish ? "Edit Markdown (English)" : "Editar Markdown (Español)"}</label>
        <textarea
          className="w-full min-h-[250px] text-[11px] font-mono border border-gray-400 p-2 outline-none focus:border-black bg-yellow-50"
          value={currentText}
          onChange={(e) => {
            if (isEnglish) setLocalTextEN(e.target.value);
            else setLocalTextES(e.target.value);
          }}
          onBlur={handleBlur}
        />
        <p className="text-[9px] text-gray-500 mt-1">Soporta Markdown completo: # Títulos, **negrita**, *cursiva*, &gt; Citas, - Listas, | Tablas |.</p>
      </div>
    );
  }

  return (
    <div
      className={`font-SpaceGrotesk text-justify w-full leading-[1.15] tracking-tight print-markdown-content columns-${columns} gap-4`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(currentText) }}
    />
  );
}

export default MenuPrintInfo;
