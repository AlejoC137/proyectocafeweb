import React from "react";
import MenuPrintBlock from "./MenuPrintBlock";

const MenuPrintColumn = ({ blocks, ...props }) => {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map(blockId => (
        <MenuPrintBlock 
          key={blockId} 
          blockId={blockId} 
          {...props} 
        />
      ))}
    </div>
  );
};

export default MenuPrintColumn;
