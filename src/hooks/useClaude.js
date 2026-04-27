import { useState, useCallback } from "react";
import { useSelector } from "react-redux";

export function useClaude() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);

  const query = useCallback(
    async ({ recipeType, porciones, sources }) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeType,
            porciones,
            sources,
            itemsAlmacen: allItems.map((i) => ({ _id: i._id, Nombre_del_producto: i.Nombre_del_producto })),
            produccionInterna: allProduccion.map((i) => ({ _id: i._id, Nombre_del_producto: i.Nombre_del_producto })),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }
        const json = await res.json();
        setData(json.result);
        return json.result;
      } catch (err) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [allItems, allProduccion]
  );

  return { data, loading, error, query };
}
