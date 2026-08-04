import React from "react";
import RecipeItemRow from "./RecipeItemRow";

const RecipeSection = ({ title, items, isEditing, onCheck, onSave }) => (
  <div>
    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h4>
    {items.length > 0
      ? items.map(item => <RecipeItemRow key={item.key} item={item} isEditing={isEditing} onCheck={onCheck} onSave={onSave} />)
      : <p className="text-xs text-slate-400 italic py-2">Sin elementos.</p>}
  </div>
);

export default RecipeSection;
