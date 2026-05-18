import { useState, useEffect, useCallback } from "react";
import supabase from "../config/supabaseClient";

export const useImageUsage = () => {
  const [usages, setUsages] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUsages = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('menu_print_config').select('*');
      if (error) throw error;

      const usageMap = {};
      data.forEach(row => {
        const layoutType = row.id === 2 ? "Horizontal" : "Vertical";
        const layout = row.group_descriptions?.__layout || {};
        const pages = layout.pages || [];

        pages.forEach((page, pageIdx) => {
          // 1. Fondos de página
          if (page.bgImage) {
            const keys = [page.bgImage.id, page.bgImage.url].filter(Boolean);
            keys.forEach(key => {
              if (!usageMap[key]) usageMap[key] = [];
              const desc = `Fondo Pág. ${pageIdx + 1} (${layoutType})`;
              if (!usageMap[key].includes(desc)) {
                usageMap[key].push(desc);
              }
            });
          }

          // 2. Bloques en columnas
          if (page.columns && Array.isArray(page.columns)) {
            page.columns.forEach((col, colIdx) => {
              if (col.blocks && Array.isArray(col.blocks)) {
                col.blocks.forEach(blockId => {
                  if (blockId) {
                    if (!usageMap[blockId]) usageMap[blockId] = [];
                    const desc = `Col. ${colIdx + 1}, Pág. ${pageIdx + 1} (${layoutType})`;
                    if (!usageMap[blockId].includes(desc)) {
                      usageMap[blockId].push(desc);
                    }
                  }
                });
              }
            });
          }
        });
      });

      setUsages(usageMap);
    } catch (err) {
      console.error("Error computing image usages across menus:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsages();
  }, [fetchUsages]);

  return { usages, loading, refetch: fetchUsages };
};
