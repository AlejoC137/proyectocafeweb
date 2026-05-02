import React from "react";
import MenuPrintBlock from "./MenuPrintBlock";

const MenuPrintColumn = ({ blocks, pageIndex, columnId, ...props }) => {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map(blockId => (
        <MenuPrintBlock
          key={blockId}
          blockId={blockId}
          pageIndex={pageIndex}
          columnId={columnId}
          {...props}
        />
      ))}
    </div>
  );
};

export default MenuPrintColumn;
