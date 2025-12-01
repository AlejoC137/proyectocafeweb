import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Columns3, ChevronDown, ChevronUp, History } from "lucide-react";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getAllFromTable, toggleShowEdit } from "../../../redux/actions";
import { COMPRAS, PROVEE, STAFF } from "../../../redux/actions-types";

import { updateCompra } from "../../../redux/actions-VentasCompras.js";
import Gastos from "../../components/gastos/Gastos.jsx";
import { Eye, UtensilsCrossed } from "lucide-react"; // Iconos para los botones

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});

const availableColumns = {
  Beneficiario: { label: "Beneficiario (Staff/Prov)", default: true },
  Valor: { label: "Valor", default: true },
  DatosPago: { label: "Datos de Pago", default: true },
  adelanto: { label: "Adelanto", default: true },
  pagadoFull: { label: "Estado Pago", default: true },
  acciones: { label: "Acciones", default: true, fixed: true },

  // Columnas ocultas por defecto pero disponibles
  Date: { label: "Fecha", default: false },
  Concepto: { label: "Concepto", default: true },
  MedioDeCompra: { label: "Medio de Compra", default: false },
  MedioDePago: { label: "Medio de Pago", default: false },
  Comprador: { label: "Comprador", default: false },
  Categoria: { label: "Categoría", default: false },
  Proveedor_Id: { label: "Proveedor (ID)", default: false },
  staff_id: { label: "Staff (ID)", default: false },
  linkDocSoporte: { label: "Doc. Soporte", default: false },
};

export function PagosProveedores() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const compras = useSelector((state) => state.allCompras || []);
  const proveedores = useSelector((state) => state.Proveedores || []);
  const staff = useSelector((state) => state.allStaff || []);
  const showEdit = useSelector((state) => state.showEdit);


  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    medioCompra: "",
    medioPago: "",
    categoria: "",
    proveedor: "",
    comprador: "",
  });
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "Date", direction: "desc" });
  const [editingRows, setEditingRows] = useState({});
  const [showGastos, setShowGastos] = useState(false);

  useEffect(() => {
    const defaults = {};
    Object.entries(availableColumns).forEach(([key, col]) => {
      defaults[key] = col.default;
    });
    setVisibleColumns(defaults);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(getAllFromTable(PROVEE)),
          dispatch(getAllFromTable(COMPRAS)),
          dispatch(getAllFromTable(STAFF)),
        ]);

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const proveedoresMap = useMemo(() => {
    if (!proveedores || proveedores.length === 0) return new Map();
    return new Map(proveedores.map((p) => [p._id, p.Nombre_Proveedor]));
  }, [proveedores]);

  const staffMap = useMemo(() => {
    if (!staff || staff.length === 0) return new Map();
    return new Map(staff.map((s) => [s._id, `${s.Nombre} ${s.Apellido} `]));
  }, [staff]);


  const parsePagos = useCallback((pagos) => {
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
  }, []);

  const decoratedCompras = useMemo(
    () =>
      (compras || []).map((compra) => {
        const pagosObj = parsePagos(compra?.Pagado ?? compra?.pagos);
        return { ...compra, pagosObj };
      }),
    [compras, parsePagos]
  );

  const mergeItemWithEdits = useCallback(
    (item) => {
      const edits = editingRows[item._id];
      if (!edits) return item;

      const mergedPagado = edits.Pagado
        ? { ...(item.pagosObj || {}), ...edits.Pagado }
        : item.pagosObj;

      return { ...item, ...edits, pagosObj: mergedPagado };
    },
    [editingRows]
  );

  const comprasPendientes = useMemo(() => {
    return decoratedCompras
      .map(mergeItemWithEdits)
      .filter((compra) => !compra.pagosObj?.pagadoFull);
  }, [decoratedCompras, mergeItemWithEdits]);

  const uniqueFilters = useMemo(() => {
    return {
      medioCompra: [...new Set(comprasPendientes.map((c) => c.MedioDeCompra).filter(Boolean))],
      medioPago: [...new Set(comprasPendientes.map((c) => c.MedioDePago).filter(Boolean))],
      categoria: [...new Set(comprasPendientes.map((c) => c.Categoria).filter(Boolean))],
      comprador: [...new Set(comprasPendientes.map((c) => c.Comprador).filter(Boolean))],
      proveedor: [
        ...new Set(
          comprasPendientes
            .map((c) => c.Proveedor_Id)
            .filter(Boolean)
        ),
      ],
    };
  }, [comprasPendientes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSort = (column) => {
    if (column === "acciones") return;
    setSortConfig((prev) => {
      if (prev.key === column) {
        return { key: column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key: column, direction: "asc" };
    });
  };

  const SortIcon = ({ column }) => {
    if (column === "acciones") return null;
    if (sortConfig.key !== column) return <ChevronDown className="w-4 h-4 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleCellEdit = (item, field, value) => {
    setEditingRows((prev) => {
      const current = prev[item._id] || {};
      if (field === "pagadoFull" || field === "adelanto") {
        const basePagado = current.Pagado || parsePagos(item?.Pagado ?? item?.pagos);
        const updatedPagado =
          field === "pagadoFull"
            ? { ...basePagado, pagadoFull: value }
            : { ...basePagado, adelanto: value };

        return { ...prev, [item._id]: { ...current, Pagado: updatedPagado } };
      }

      return { ...prev, [item._id]: { ...current, [field]: value } };
    });
  };

  const handleSaveRow = async (item) => {
    const editedData = editingRows[item._id];
    if (!editedData) return;

    const payload = { ...editedData };
    if (payload.Valor !== undefined) {
      payload.Valor = Number(payload.Valor) || 0;
    }

    try {
      await dispatch(updateCompra(item._id, payload));
      setEditingRows((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });
    } catch (error) {
      console.error("Error al actualizar la compra:", error);
    }
  };

  const handleCancelRow = (itemId) => {
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleSaveAll = async () => {
    const promises = Object.keys(editingRows).map(async (id) => {
      const editedData = editingRows[id];
      const payload = { ...editedData };
      if (payload.Valor !== undefined) {
        payload.Valor = Number(payload.Valor) || 0;
      }
      return dispatch(updateCompra(id, payload));
    });

    try {
      await Promise.all(promises);
      setEditingRows({});
    } catch (error) {
      console.error("Error al guardar todo:", error);
    }
  };


  const filteredCompras = useMemo(() => {
    const normalized = comprasPendientes.map((item) => mergeItemWithEdits(item));
    const filtered = normalized.filter((item) => {
      const proveedorNombre = proveedoresMap.get(item.Proveedor_Id) || "";
      const searchTarget = `${item.Concepto || ""} ${item.Comprador || ""} ${proveedorNombre} `.toLowerCase();
      const matchesSearch =
        !filters.search || searchTarget.includes(filters.search.trim().toLowerCase());
      const matchesMedioCompra = !filters.medioCompra || item.MedioDeCompra === filters.medioCompra;
      const matchesMedioPago = !filters.medioPago || item.MedioDePago === filters.medioPago;
      const matchesCategoria = !filters.categoria || item.Categoria === filters.categoria;
      const matchesProveedor = !filters.proveedor || item.Proveedor_Id === filters.proveedor;
      const matchesComprador = !filters.comprador || item.Comprador === filters.comprador;

      return (
        matchesSearch &&
        matchesMedioCompra &&
        matchesMedioPago &&
        matchesCategoria &&
        matchesProveedor &&
        matchesComprador
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const column = sortConfig.key;
      let aVal = a[column];
      let bVal = b[column];

      if (column === "pagadoFull") {
        aVal = a.pagosObj?.pagadoFull ? 1 : 0;
        bVal = b.pagosObj?.pagadoFull ? 1 : 0;
      } else if (column === "adelanto") {
        aVal = a.pagosObj?.adelanto || "";
        bVal = b.pagosObj?.adelanto || "";
      } else if (column === "Valor") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (column === "Date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = aVal || "";
        bVal = bVal || "";
      }

      if (sortConfig.direction === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

    return sorted;
  }, [comprasPendientes, mergeItemWithEdits, filters, sortConfig, proveedoresMap]);

  const toggleColumn = (key) => {
    if (availableColumns[key]?.fixed) return;
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllColumns = (show) => {
    const next = {};
    Object.keys(availableColumns).forEach((key) => {
      next[key] = show;
    });
    setVisibleColumns(next);
  };

  const resetColumns = () => {
    const defaults = {};
    Object.entries(availableColumns).forEach(([key, col]) => {
      defaults[key] = col.default;
    });
    setVisibleColumns(defaults);
  };

  const headerActions = (
    <div className="flex gap-2">
      {Object.keys(editingRows).length > 0 && (
        <Button
          onClick={handleSaveAll}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Guardar Cambios ({Object.keys(editingRows).length})
        </Button>
      )}

      <Button onClick={() => setShowGastos(!showGastos)} variant="outline" className="gap-2">
        <Eye size={16} />
        {showGastos ? "Ocultar Gastos" : "Mostrar Gastos"}
      </Button>

      <Button onClick={() => dispatch(toggleShowEdit())}>
        {showEdit ? "Desactivar Edición" : "Activar Edición"}
      </Button>
    </div>
  );


  const renderCellContent = (item, key) => {
    const effective = mergeItemWithEdits(item);
    switch (key) {
      case "Beneficiario":
        if (effective.staff_id) {
          return staffMap.get(effective.staff_id) || "Staff no encontrado";
        } else if (effective.Proveedor_Id) {
          return proveedoresMap.get(effective.Proveedor_Id) || "Proveedor no encontrado";
        }
        return "N/A";

      case "DatosPago":
        if (effective.staff_id) {
          const staffMember = staff.find(s => s._id === effective.staff_id);
          if (!staffMember) return "N/A";

          let cuenta = "N/A";
          try {
            // Helper function to parse loose JSON or standard JSON
            const parseInfo = (str) => {
              if (!str) return {};
              if (typeof str === 'object') return str;

              try {
                return JSON.parse(str);
              } catch (e) {
                // Try to parse "loose" JSON (e.g. { key: "value" }) using regex
                const bancoMatch = str.match(/banco:\s*"([^"]+)"/i);
                const tipoMatch = str.match(/tipo:\s*"([^"]+)"/i);
                const numeroMatch = str.match(/numero:\s*"([^"]+)"/i);

                if (bancoMatch || tipoMatch || numeroMatch) {
                  return {
                    banco: bancoMatch ? bancoMatch[1] : '',
                    tipo: tipoMatch ? tipoMatch[1] : '',
                    numero: numeroMatch ? numeroMatch[1] : ''
                  };
                }
                // If regex fails, return it as a simple string in 'numero' field to be displayed
                return { numero: str };
              }
            };

            if (staffMember.Cuenta) {
              const cuentaObj = parseInfo(staffMember.Cuenta);

              const banco = cuentaObj.banco || '';
              const tipo = cuentaObj.tipo || '';
              const numero = cuentaObj.numero || '';

              // Clean up the display if it's just the raw string that looks like an object
              if (numero && typeof numero === 'string' && numero.trim().startsWith('{')) {
                // Fallback for when regex failed but it looks like an object
                // Try one more aggressive cleanup or just display it as is but cleaner? 
                // Actually, if we are here, regex failed. Let's just try to remove braces.
                cuenta = numero.replace(/[{}]/g, '').trim();
              } else if (banco || tipo || numero) {
                cuenta = `${banco} ${tipo} ${numero}`.trim();
              } else {
                cuenta = "Sin datos de cuenta";
              }

            } else if (staffMember.infoContacto) {
              const contactoObj = parseInfo(staffMember.infoContacto);
              // For contact info, we might look for 'numeroDeContacto'
              let contactoNum = contactoObj.numeroDeContacto;

              if (!contactoNum && typeof contactoObj.numero === 'string') {
                // If parseInfo returned { numero: "..." } because it failed to parse
                contactoNum = contactoObj.numero;
              }

              // If we still have a raw object string, try to clean it
              if (contactoNum && typeof contactoNum === 'string' && contactoNum.trim().startsWith('{')) {
                const numMatch = contactoNum.match(/numeroDeContacto:\s*"([^"]+)"/i);
                if (numMatch) contactoNum = numMatch[1];
              }

              cuenta = `Contacto: ${contactoNum || 'N/A'}`;
            }
          } catch (e) {
            console.error("Error parsing staff payment info", e);
            cuenta = "Error datos";
          }
          return <span className="text-xs text-gray-600">{cuenta}</span>;

        } else if (effective.Proveedor_Id) {
          const proveedor = proveedores.find(p => p._id === effective.Proveedor_Id);
          if (!proveedor) return "N/A";

          // Intento de mostrar datos de pago de proveedor si existen, sino mostrar NIT o Contacto
          let info = "";
          if (proveedor.Cuenta) {
            try {
              const c = typeof proveedor.Cuenta === 'string' ? JSON.parse(proveedor.Cuenta) : proveedor.Cuenta;
              info = `${c.banco || ''} ${c.numero || ''} `;
            } catch (e) { }
          }

          if (!info || info.trim() === "") {
            info = `NIT: ${proveedor["NIT/CC"] || 'N/A'} `;
          }
          return <span className="text-xs text-gray-600">{info}</span>;
        }
        return "N/A";

      case "Date":
        try {
          return new Date(effective.Date).toLocaleDateString("es-CO");
        } catch {
          return effective.Date || "Sin fecha";
        }
      case "Concepto":
        return effective.Concepto || "Sin concepto";
      case "Valor":
        return currencyFormatter.format(effective.Valor || 0);
      case "MedioDeCompra":
        return effective.MedioDeCompra || "N/A";
      case "MedioDePago":
        return effective.MedioDePago || "N/A";
      case "Comprador":
        return effective.Comprador || "N/A";
      case "Categoria":
        return effective.Categoria || "N/A";
      case "Proveedor_Id":
        return proveedoresMap.get(effective.Proveedor_Id) || "N/A";
      case "staff_id":
        return staffMap.get(effective.staff_id) || "N/A";
      case "adelanto":

        return effective.pagosObj?.adelanto ?? "N/A";
      case "pagadoFull":
        return (
          <span
            className={`px - 2 py - 1 rounded - full text - xs ${effective.pagosObj?.pagadoFull
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
              } `}
          >
            {effective.pagosObj?.pagadoFull ? "Pagado" : "Pendiente"}
          </span>
        );
      case "linkDocSoporte":
        return effective.linkDocSoporte ? (
          <a
            href={effective.linkDocSoporte}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            Ver
          </a>
        ) : (
          "N/A"
        );
      default:
        return effective[key] ?? "";
    }
  };

  const renderEditableCell = (item, key) => {
    const current = mergeItemWithEdits(item);
    const inputClass =
      "w-full p-1 border border-gray-300 rounded text-xs bg-gray-100 text-gray-900";

    switch (key) {
      case "Beneficiario":
        // Si es Staff, mostramos select de Staff. Si es Proveedor, select de Proveedor.
        if (current.staff_id) {
          return (
            <select
              value={current.staff_id || ""}
              onChange={(e) => handleCellEdit(item, "staff_id", e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar Staff --</option>
              {Array.isArray(staff) &&
                staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.Nombre} {s.Apellido}
                  </option>
                ))}
            </select>
          );
        } else {
          return (
            <select
              value={current.Proveedor_Id || ""}
              onChange={(e) => handleCellEdit(item, "Proveedor_Id", e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {Array.isArray(proveedores) &&
                proveedores.map((prov) => (
                  <option key={prov._id} value={prov._id}>
                    {prov.Nombre_Proveedor}
                  </option>
                ))}
            </select>
          );
        }

      case "pagadoFull": {
        const checked = !!current.pagosObj?.pagadoFull;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={checked}
              onCheckedChange={(val) => handleCellEdit(item, "pagadoFull", val)}
            />
            <span className="text-xs">{checked ? "Pagado" : "Pendiente"}</span>
          </div>
        );
      }
      case "adelanto": {
        return (
          <input
            type="text"
            value={current.pagosObj?.adelanto ?? ""}
            onChange={(e) => handleCellEdit(item, "adelanto", e.target.value)}
            className={inputClass}
          />
        );
      }
      case "Valor":
        return (
          <input
            type="number"
            value={current.Valor ?? ""}
            onChange={(e) => handleCellEdit(item, "Valor", e.target.value)}
            className={inputClass}
          />
        );
      case "Proveedor_Id":
        return (
          <select
            value={current.Proveedor_Id || ""}
            onChange={(e) => handleCellEdit(item, "Proveedor_Id", e.target.value)}
            className={inputClass}
          >
            <option value="">-- Seleccionar --</option>
            {Array.isArray(proveedores) &&
              proveedores.map((prov) => (
                <option key={prov._id} value={prov._id}>
                  {prov.Nombre_Proveedor}
                </option>
              ))}
          </select>
        );
      case "staff_id":
        return (
          <select
            value={current.staff_id || ""}
            onChange={(e) => handleCellEdit(item, "staff_id", e.target.value)}
            className={inputClass}
          >
            <option value="">-- Seleccionar --</option>
            {Array.isArray(staff) &&
              staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.Nombre} {s.Apellido}
                </option>
              ))}
          </select>
        );
      case "DatosPago":
        return <span className="text-xs text-gray-400">No editable</span>;
      default:

        return (
          <input
            type="text"
            value={current[key] ?? ""}
            onChange={(e) => handleCellEdit(item, key, e.target.value)}
            className={inputClass}
          />
        );
    }
  };


  return (
    <PageLayout
      title="Pagos a Proveedores"
      subtitle="Compras pendientes por pagar desde Alcompras (pagadoFull = false)"
      loading={loading}
      actions={headerActions}
    >
      {showGastos && <div className="bg-white rounded-lg shadow-md p-4"><Gastos /></div>}

      <ContentCard title="Pendientes por pagar">
        {comprasPendientes.length === 0 ? (
          <p className="text-sm text-slate-600">No hay compras con pagadoFull en falso.</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-1">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar concepto, comprador o proveedor"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="text-sm outline-none"
                  />
                </div>

                <select
                  value={filters.medioCompra}
                  onChange={(e) => handleFilterChange("medioCompra", e.target.value)}
                  className="border bg-white border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Medio de compra</option>
                  {uniqueFilters.medioCompra.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.medioPago}
                  onChange={(e) => handleFilterChange("medioPago", e.target.value)}
                  className="border bg-white border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Medio de pago</option>
                  {uniqueFilters.medioPago.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.categoria}
                  onChange={(e) => handleFilterChange("categoria", e.target.value)}
                  className="border bg-white border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Categoría</option>
                  {uniqueFilters.categoria.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.comprador}
                  onChange={(e) => handleFilterChange("comprador", e.target.value)}
                  className="border bg-white border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Comprador</option>
                  {uniqueFilters.comprador.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.proveedor}
                  onChange={(e) => handleFilterChange("proveedor", e.target.value)}
                  className="border bg-white border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Proveedor</option>
                  {uniqueFilters.proveedor.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt ? proveedoresMap.get(opt) || opt : "Sin proveedor"}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      search: "",
                      medioCompra: "",
                      medioPago: "",
                      categoria: "",
                      proveedor: "",
                      comprador: "",
                    })
                  }
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Limpiar filtros
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/compras')}
                  className="flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Historial
                </Button>

                <Button
                  onClick={() => setShowColumnSelector(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Columns3 className="w-4 h-4" />
                  Columnas
                </Button>

                <div className="text-sm text-gray-600 ml-auto">
                  Mostrando {filteredCompras.length} de {comprasPendientes.length} pendientes
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    {Object.entries(availableColumns)
                      .filter(([key]) => visibleColumns[key])
                      .map(([key, col]) => (
                        <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                          <button
                            onClick={() => handleSort(key)}
                            className="flex items-center gap-1 hover:text-blue-600"
                          >
                            {col.label} <SortIcon column={key} />
                          </button>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompras.map((item) => {
                    const hasPendingChanges = !!editingRows[item._id];
                    return (
                      <tr
                        key={item._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        {Object.keys(availableColumns)
                          .filter((key) => visibleColumns[key])
                          .map((key) => (
                            <td key={key} className="px-3 py-2 align-top">
                              {key === "acciones" ? (
                                <div className="flex gap-2 items-center">
                                  {showEdit && hasPendingChanges && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => handleSaveRow(item)}
                                      >
                                        Guardar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCancelRow(item._id)}
                                      >
                                        Cancelar
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : showEdit ? (
                                renderEditableCell(item, key)
                              ) : (
                                renderCellContent(item, key)
                              )}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentCard>

      {showColumnSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 column-selector-container">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Columns3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Personalizar columnas</h3>
                  <p className="text-sm text-gray-600">Activa o desactiva columnas de la tabla.</p>
                </div>
              </div>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <Button onClick={() => toggleAllColumns(true)} variant="outline">
                Mostrar todas
              </Button>
              <Button onClick={() => toggleAllColumns(false)} variant="outline">
                Ocultar todas
              </Button>
              <Button onClick={resetColumns} variant="outline">
                Por defecto
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 border rounded-lg p-3">
              {Object.entries(availableColumns).map(([key, column]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`col-${key}`}
                    checked={visibleColumns[key] || false}
                    onChange={() => toggleColumn(key)}
                    disabled={column.fixed}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`col-${key}`}
                    className={`ml-2 text-sm ${column.fixed ? "text-gray-500" : "text-gray-700"
                      }`}
                  >
                    {column.label} {column.fixed && "(fija)"}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default PagosProveedores;
