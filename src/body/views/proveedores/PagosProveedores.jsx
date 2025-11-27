import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Button } from "@/components/ui/button";
import { getAllFromTable } from "../../../redux/actions";
import { updateCompra } from "../../../redux/actions-VentasCompras";
import { COMPRAS, PROVEE } from "../../../redux/actions-types";

function PagosProveedores() {
  const dispatch = useDispatch();
  const [selecciones, setSelecciones] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const proveedores = useSelector((state) => state.Proveedores || []);
  const compras = useSelector((state) => state.allCompras || []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        dispatch(getAllFromTable(PROVEE)),
        dispatch(getAllFromTable(COMPRAS))
      ]);
    };

    fetchData();
  }, [dispatch]);

  const comprasPendientes = useMemo(() => {
    return compras.filter((compra) => {
      const pagado = compra?.Pagado;
      let pagadoObj = { pagadoFull: false };

      if (typeof pagado === "string") {
        try {
          pagadoObj = JSON.parse(pagado);
        } catch (error) {
          console.error("No se pudo parsear Pagado", error);
        }
      } else if (typeof pagado === "object" && pagado !== null) {
        pagadoObj = pagado;
      }

      return !pagadoObj?.pagadoFull;
    });
  }, [compras]);

  const handleProveedorChange = (compraId, proveedorId) => {
    setSelecciones((prev) => ({
      ...prev,
      [compraId]: proveedorId
    }));
  };

  const handleAsignarProveedor = async (compraId) => {
    const proveedorId = selecciones[compraId];
    if (!proveedorId) return;

    try {
      setUpdatingId(compraId);
      await dispatch(updateCompra(compraId, { Proveedor_Id: proveedorId }));
      await dispatch(getAllFromTable(COMPRAS));
    } finally {
      setUpdatingId(null);
    }
  };

  const proveedoresMap = useMemo(() => {
    return new Map(proveedores.map((proveedor) => [proveedor._id, proveedor.Nombre_Proveedor]));
  }, [proveedores]);

  return (
    <PageLayout
      title="Pagos a Proveedores"
      subtitle="Compras pendientes por pagar y sin proveedor asignado"
      loading={false}
    >
      <ContentCard title="Compras con pago pendiente">
        {comprasPendientes.length === 0 ? (
          <p className="text-sm text-slate-600">
            No hay compras pendientes de pago.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Concepto</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Adelanto</th>
                  <th className="py-2 pr-4">Proveedor</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprasPendientes.map((compra) => {
                  const pagado = compra?.Pagado;
                  let pagadoObj = { adelanto: "N/A" };

                  if (typeof pagado === "string") {
                    try {
                      pagadoObj = JSON.parse(pagado);
                    } catch (error) {
                      pagadoObj = { adelanto: "N/A" };
                    }
                  } else if (typeof pagado === "object" && pagado !== null) {
                    pagadoObj = pagado;
                  }

                  const proveedorSeleccionado = selecciones[compra._id] ?? compra.Proveedor_Id ?? "";

                  return (
                    <tr key={compra._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{compra.Date || "Sin fecha"}</td>
                      <td className="py-2 pr-4">{compra.Concepto || "Sin concepto"}</td>
                      <td className="py-2 pr-4">{compra.Valor || ""}</td>
                      <td className="py-2 pr-4">{pagadoObj?.adelanto ?? "N/A"}</td>
                      <td className="py-2 pr-4">
                        <select
                          className="border rounded px-2 py-1 w-full bg-white"
                          value={proveedorSeleccionado}
                          onChange={(e) => handleProveedorChange(compra._id, e.target.value)}
                        >
                          <option value="">Selecciona un proveedor</option>
                          {proveedores.map((proveedor) => (
                            <option key={proveedor._id} value={proveedor._id}>
                              {proveedor.Nombre_Proveedor}
                            </option>
                          ))}
                        </select>
                        {compra.Proveedor_Id && proveedoresMap.get(compra.Proveedor_Id) && (
                          <p className="text-xs text-slate-500 mt-1">
                            Actual: {proveedoresMap.get(compra.Proveedor_Id)}
                          </p>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Button
                          variant="default"
                          disabled={!selecciones[compra._id] || updatingId === compra._id}
                          onClick={() => handleAsignarProveedor(compra._id)}
                        >
                          {updatingId === compra._id ? "Guardando..." : "Asignar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </PageLayout>
  );
}

export default PagosProveedores;
