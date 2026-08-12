import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, Search, CheckCircle2 } from "lucide-react";

export function SearchableSelect({ value, onChange, options, placeholder = "Buscar o seleccionar...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => {
    for (const opt of options) {
      if (opt.options) {
        const found = opt.options.find((o) => o.value === value);
        if (found) return found;
      } else if (opt.value === value) {
        return opt;
      }
    }
    return null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();

    return options.map((opt) => {
      if (opt.options) {
        const matchingSub = opt.options.filter((sub) =>
          sub.label.toLowerCase().includes(term)
        );
        return matchingSub.length > 0 ? { ...opt, options: matchingSub } : null;
      }
      return opt.label.toLowerCase().includes(term) ? opt : null;
    }).filter(Boolean);
  }, [options, search]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-1.5 border-2 border-black bg-white flex items-center justify-between cursor-pointer hover:bg-yellow-50 text-xs font-semibold shadow-sm"
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-600" />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border-2 border-black shadow-solid max-h-64 overflow-y-auto">
          <div className="p-1.5 border-b-2 border-black sticky top-0 bg-yellow-100 z-10 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
              className="w-full p-1 text-xs border border-black bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 text-center font-medium">No se encontraron resultados</div>
            ) : (
              filteredOptions.map((item, idx) => {
                if (item.options) {
                  return (
                    <div key={idx} className="mb-1">
                      <div className="px-2 py-1 bg-gray-100 text-[10px] font-bold text-gray-700 uppercase border-y border-gray-300">
                        {item.group}
                      </div>
                      {item.options.map((subOpt) => (
                        <div
                          key={subOpt.value}
                          onClick={() => {
                            onChange(subOpt.value);
                            setIsOpen(false);
                            setSearch("");
                          }}
                          className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-sage-green hover:text-white flex items-center justify-between transition-colors ${
                            subOpt.value === value ? "bg-yellow-200 font-bold text-black" : "text-gray-800"
                          }`}
                        >
                          <span className="truncate pr-2">{subOpt.label}</span>
                          {subOpt.value === value && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sage-green" />}
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div
                    key={item.value}
                    onClick={() => {
                      onChange(item.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-sage-green hover:text-white flex items-center justify-between transition-colors ${
                      item.value === value ? "bg-yellow-200 font-bold text-black" : "text-gray-800"
                    }`}
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    {item.value === value && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sage-green" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
