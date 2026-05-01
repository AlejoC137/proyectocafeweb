import React from "react";

const MenuPrintFooter = ({ colors }) => {
  return (
    <div 
      className="mt-auto border-[3px] flex justify-between items-center tracking-[0.2em] text-[10px] font-black font-SpaceGrotesk uppercase px-3 py-1.5 shadow-[4px_4px_0px_0px] rounded-[6px] relative z-10" 
      style={{ 
        backgroundColor: colors.footerBg, 
        color: colors.footerText || '#ffffff', 
        borderColor: colors.mainBorder, 
        boxShadow: `4px 4px 0px 0px ${colors.mainBorder}` 
      }}
    >
      <span>PROYECTO CAFÉ</span>
      <div className="flex gap-4">
        <span>+57 300 821 4593</span>
        <span>@PROYECTO__CAFE</span>
      </div>
    </div>
  );
};

export default MenuPrintFooter;
