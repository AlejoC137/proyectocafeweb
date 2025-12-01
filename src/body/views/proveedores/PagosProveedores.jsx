import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { getAllFromTable } from "../../../redux/actions";
import { COMPRAS } from "../../../redux/actions-types";

function PagosProveedores() {
  const dispatch = useDispatch();
  const compras = useSelector((state) => state.allCompras || []);

  const parsePagos = (pagos) => {
    let pagosObj = { pagadoFull: false, adelanto: "N/A" };

    if (typeof pagos === "string") {
      try {
        pagosObj = JSON.parse(pagos);
      } catch (error) {
        console.error("No se pudo parsear la información de pagos", error);
      }
    } else if (typeof pagos === "object" && pagos !== null) {
      pagosObj = pagos;
    }

    return pagosObj;
  };

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getAllFromTable(COMPRAS));
    };

    fetchData();
  }, [dispatch]);

  const comprasPendientes = useMemo(() => {
    return compras.filter((compra) => {
      const pagosObj = parsePagos(compra?.Pagado ?? compra?.pagos);
      return !pagosObj?.pagadoFull;
    });
  }, [compras, parsePagos]);

  return (
    <PageLayout
      title="Pagos a Proveedores"
      subtitle="Compras pendientes por pagar (pagadoFull = false)"
      loading={false}
    >
      <ContentCard title="Compras con pagadoFull en falso">{
        comprasPendientes.length === 0 ? (
          <p className="text-sm text-slate-600">
            No hay compras con pagadoFull en falso.
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
                </tr>
              </thead>
              <tbody>
                {comprasPendientes.map((compra) => {
                  const pagosObj = parsePagos(compra?.Pagado ?? compra?.pagos);

                  return (
                    <tr key={compra._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{compra.Date || "Sin fecha"}</td>
                      <td className="py-2 pr-4">{compra.Concepto || "Sin concepto"}</td>
                      <td className="py-2 pr-4">{compra.Valor || ""}</td>
                      <td className="py-2 pr-4">{pagosObj?.adelanto ?? "N/A"}</td>
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
