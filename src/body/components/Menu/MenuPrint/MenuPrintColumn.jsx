import React from "react";
import MenuPrintBlock from "./MenuPrintBlock";

const MenuPrintColumn = ({ blocks, pageIndex, columnId, ...props }) => {
  return (
    <div className="flex flex-row flex-wrap gap-3 items-start content-start w-full min-w-0">
      {blocks.map((blockId, index) => (
        <MenuPrintBlock
          key={`${blockId}_${index}`}
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
