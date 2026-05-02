import React from "react";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";

const MenuPrintHeader = ({ colors, leng }) => {
  return (
    <div
      className="border-[3px] px-1 py-1 mb-3 shadow-[8px_8px_0px_0px] flex justify-between items-center rounded-[8px] relative z-10 gap-2"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: colors.mainBorder,
        boxShadow: `5px 5px 0px 0px ${colors.mainBorder}`
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img src={BaseSillaLogo} alt="Logo" className="h-8 ml-1   object-contain" />
        <h1
          className="text-[26px] font-black tracking-tighter uppercase leading-none pt-1 truncate"
          style={{ fontFamily: "'First Bunny', sans-serif", color: colors.mainTitle }}
        >
          {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
        </h1>
      </div>
      <div className="text-right ml-6 shrink-0" style={{ color: colors.mainTitle }}>
        <p className="text-[13px] font-black uppercase tracking-widest leading-tight">TRANSVERSAL 39 #65D - 22</p>
        <p className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70 leading-tight">Conquistadores, Medellín</p>
      </div>
    </div>
  );
};

export default MenuPrintHeader;
