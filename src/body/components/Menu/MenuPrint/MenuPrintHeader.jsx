import React from "react";
import BaseSillaLogo from "@/assets/BASE SILLA TEST_LOGO.svg";

const MenuPrintHeader = ({ colors, leng }) => {
  return (
    <div 
      className="border-[3px] p-2 md:p-3 mb-3 shadow-[6px_6px_0px_0px] flex justify-between items-center rounded-[6px] overflow-hidden relative z-10" 
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        borderColor: colors.mainBorder, 
        boxShadow: `6px 6px 0px 0px ${colors.mainBorder}` 
      }}
    >
      <div className="flex items-center gap-3">
        <img src={BaseSillaLogo} alt="Logo" className="h-10 w-auto" />
        <h1 
          className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none m-0 p-0" 
          style={{ fontFamily: "'First Bunny', sans-serif", color: colors.mainTitle }}
        >
          {leng ? "Proyecto Café Menu" : "Menú Proyecto Café"}
        </h1>
      </div>
      <div className="text-right" style={{ color: colors.mainTitle }}>
        <p className="text-[11px] font-black uppercase tracking-widest leading-none">TRANSVERSAL 39 #65D - 22</p>
        <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">Conquistadores, Medellín</p>
      </div>
    </div>
  );
};

export default MenuPrintHeader;
