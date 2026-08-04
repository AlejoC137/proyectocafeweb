import React from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { getProteinType } from '../utils/lunchUtils';

export const EditableCell = ({ 
    item, 
    field, 
    isBase, 
    hasVariations, 
    variations, 
    type = 'text', 
    options = [], 
    className = "",
    showEdit,
    handleChange,
    handleBlur,
    handleFillDown
}) => {
    const isComp = field.startsWith('Comp_Lunch.');
    let val = '';
    
    if (field === 'proteina') {
        val = getProteinType(item);
    } else if (isComp) {
        const parts = field.split('.');
        let comp = {};
        try { comp = item.Comp_Lunch ? (typeof item.Comp_Lunch === 'string' ? JSON.parse(item.Comp_Lunch) : item.Comp_Lunch) : {}; } catch(e) {}
        val = comp[parts[1]]?.[parts[2]] || '';
    } else {
        val = item[field] || '';
    }

    return (
        <td className={`py-2 px-4 ${className}`}>
            <div className="flex items-center gap-1 w-full relative group min-w-[120px]">
                {showEdit ? (
                    type === 'select' ? (
                        <select
                            className="w-full px-2 py-1 text-xs font-bold border rounded bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={val}
                            onChange={(e) => handleChange(item._id, field, e.target.value)}
                            onBlur={() => handleBlur(item._id)}
                        >
                            <option value="">--</option>
                            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    ) : (
                        <input 
                            type={type} 
                            className="w-full px-2 py-1 text-xs border rounded bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={val}
                            onChange={(e) => handleChange(item._id, field, e.target.value)}
                            onBlur={() => handleBlur(item._id)}
                        />
                    )
                ) : (
                    <span className="truncate block w-full text-xs text-slate-600">{val}</span>
                )}
                {showEdit && isBase && hasVariations && (
                    <button 
                        onClick={() => handleFillDown(item, field, variations)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-all absolute -right-5 z-10 shadow-sm border border-blue-200"
                        title="Propagar a variaciones"
                    >
                        <ArrowDownToLine size={12} />
                    </button>
                )}
            </div>
        </td>
    );
};
