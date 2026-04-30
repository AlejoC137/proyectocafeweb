import React, { useState, useEffect } from 'react';
import { marked } from 'marked';

function MenuPrintInfo({ isEnglish, editMode, groupDescriptions, saveGroupDescriptions }) {
  const infoFija = {
    ES: {
      Intro: `**Más sobre el menú.**
En Proyecto Café hacemos todo lo posible para servir platos y bebidas con ingredientes frescos y bien cuidados.

**Desayuno:** 8:00 am - 11:30 am.  **Almuerzo:** Cambia cada día, inicia a 12:30. 

**Horario de atención:** L-V: 8:00 a.m. – 7:00 p.m. | Sáb: 8:00 a.m. – 6:00 p.m. Domingo y festivo: Cerrado

**WiFi:** Proyecto_cafe | **Contraseña:** FreddieMercury *(El WiFi es gratis pero recomendamos un consumo mínimo de $10.000)*

**Pregunta por promociones, especiales, eventos, talleres y el menú del día.**`
    },
    EN: {
      Intro: `**More about the menu.**
At Proyecto Café we do everything possible to serve dishes and drinks with fresh and well-cared ingredients.

**Breakfast:** 8:00 am - 11:30 am. **Lunch:** Changes daily, starts at 12:30.

**Opening hours:** Mon-Fri: 8:00 a.m. – 7:00 p.m. | Sat: 8:00 a.m. – 6:00 p.m. Sunday and Holidays: Closed

**WiFi:** Proyecto_cafe | **Password:** FreddieMercury *(WiFi is free but we recommend a minimum consumption of $10.000)*

**Ask about promotions, specials, events, workshops, and the daily menu.**`
    }
  };

  const [localTextES, setLocalTextES] = useState(infoFija.ES.Intro);
  const [localTextEN, setLocalTextEN] = useState(infoFija.EN.Intro);

  useEffect(() => {
    if (groupDescriptions?.__info_text_es !== undefined) setLocalTextES(groupDescriptions.__info_text_es);
    else setLocalTextES(infoFija.ES.Intro);
    
    if (groupDescriptions?.__info_text_en !== undefined) setLocalTextEN(groupDescriptions.__info_text_en);
    else setLocalTextEN(infoFija.EN.Intro);
  }, [groupDescriptions]);

  const currentText = isEnglish ? localTextEN : localTextES;

  const handleBlur = () => {
     if (!saveGroupDescriptions) return;
     const updated = {
        ...(groupDescriptions || {}),
        __info_text_es: localTextES,
        __info_text_en: localTextEN
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
      className="text-md font-SpaceGrotesk text-justify w-full leading-[1.15] tracking-tight print-markdown-content columns-2 gap-4"
      style={{ fontSize: '13px' }}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(currentText) }}
    />
  );
}

export default MenuPrintInfo;
