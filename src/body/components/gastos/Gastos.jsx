import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// Asegúrate que la ruta a tus acciones sea correcta y que el archivo exista
import { crearCompra } from "../../../redux/actions-VentasCompras.js";
import { getAllFromTable } from "../../../redux/actions";
import { ITEMS, PRODUCCION, PROVEE, STAFF } from "../../../redux/actions-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, XCircle } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import NominaCalculator from "./NominaCalculator";

function Gastos() {
  // --- Redux State ---
  const allItems = useSelector((state) => state.allItems || []);
  const allProduccion = useSelector((state) => state.allProduccion || []);
  const Proveedores = useSelector((state) => state.Proveedores || []);
  const Staff = useSelector((state) => state.allStaff || []);
  const dispatch = useDispatch();

  // --- Component State ---
  const [hoy, setHoy] = useState(new Date().toISOString().split('T')[0]);
  const [formattedHoy, setFormattedHoy] = useState(
    new Date().toLocaleDateString("en-US", { timeZone: "America/Bogota" })
  );

  // Estados generales del Gasto
  const [MedioDeCompra, setMedioDeCompra] = useState("");
  const [MedioDePago, setMedioDePago] = useState("");
  const [Comprador, setComprador] = useState("");
  const [Pagado, setPagado] = useState({ pagadoFull: false, adelanto: "" });
  const [Categoria, setCategoria] = useState("");
  const [linkDocSoporte, setLinkDocSoporte] = useState("");
  const [Proveedor_Id, setProveedorId] = useState("");
  const [staff_id, setStaffId] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [Concepto, setConcepto] = useState("");
  const [transporteData, setTransporteData] = useState({ tipo: '', pasaje_flete: '', tiempo: '' });
  const [nominaTotal, setNominaTotal] = useState(0);
  const [ajuste, setAjuste] = useState("");

  // --- Data Fetching (Autonomous) ---
  useEffect(() => {
    if (!allItems || allItems.length === 0) dispatch(getAllFromTable(ITEMS));
    if (!allProduccion || allProduccion.length === 0) dispatch(getAllFromTable(PRODUCCION));
    if (!Proveedores || Proveedores.length === 0) dispatch(getAllFromTable(PROVEE));
    if (!Staff || Staff.length === 0) dispatch(getAllFromTable(STAFF));
  }, [dispatch, allItems, allProduccion, Proveedores, Staff]);

  // Estado para los items (productos) del Gasto
  // MODIFICADO: Se añade recipeId al estado inicial de los items
  const [Items, setItems] = useState([]); // Array de objetos { id: '', recipeId: '', Nombre_del_producto: '', cantidadCompra: '', unidadesCompra: '', costoTotalItemPagado: '', matches: [] }

  // --- Derived State (Calculated Values) ---
  const ValorTotalCalculado = useMemo(() => {
    let baseTotal = 0;
    if (isStaff && staff_id) {
      baseTotal = nominaTotal;
    } else {
      baseTotal = Items.reduce((total, item) => {
        const costoItem = Number(item.costoTotalItemPagado) || 0;
        return total + costoItem;
      }, 0);
    }

    const flete = Number(transporteData.pasaje_flete) || 0;
    const valorAjuste = Number(ajuste) || 0;
    return baseTotal + flete + valorAjuste;
  }, [Items, transporteData.pasaje_flete, isStaff, staff_id, nominaTotal, ajuste]);

  // --- Event Handlers ---
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setHoy(dateValue);
    if (dateValue) {
      const dateParts = dateValue.split("-");
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      const year = dateParts[0];
      setFormattedHoy(`${month}/${day}/${year}`);
    } else {
      setFormattedHoy("");
    }
  };

  const handleGeneralInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'MedioDeCompra': setMedioDeCompra(value); break;
      case 'MedioDePago': setMedioDePago(value); break;
      case 'Comprador': setComprador(value); break;
      case 'Categoria': setCategoria(value); break;
      case 'linkDocSoporte': setLinkDocSoporte(value); break;
      case 'Proveedor_Id': setProveedorId(value); break;
      case 'staff_id': setStaffId(value); break;
      case 'Concepto': setConcepto(value); break;
      default: break;
    }
  };

  const handlePagadoChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'pagadoFull') {
      setPagado(prev => ({ ...prev, pagadoFull: checked, adelanto: checked ? "" : prev.adelanto }));
    } else if (name === 'adelanto') {
      if (!Pagado.pagadoFull) {
        setPagado(prev => ({ ...prev, adelanto: value }));
      }
    }
  };

  const handleTransporteChange = (e) => {
    const { name, value } = e.target;
    setTransporteData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers para Items ---

  const handleAddNewItemRow = () => {
    // MODIFICADO: Estructura del nuevo item incluye recipeId
    setItems(prev => [...prev, { id: '', recipeId: '', Nombre_del_producto: '', cantidadCompra: '', unidadesCompra: '', costoTotalItemPagado: '', matches: [] }]);
  };

  const handleRemoveItemRow = (indexToRemove) => {
    setItems(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleItemInputChange = (index, fieldName, value) => {
    setItems(prevItems => prevItems.map((item, i) => {
      if (i === index) {
        if (fieldName === 'cantidadCompra' || fieldName === 'costoTotalItemPagado') {
          const numValue = value === '' ? '' : Number(value);
          if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
            return { ...item, [fieldName]: value };
          }
          return item;
        } else {
          return { ...item, [fieldName]: value };
        }
      }
      return item;
    }));
  };

  const handleItemSearchChange = (index, searchValue) => {
    const updatedItems = [...Items];
    updatedItems[index].Nombre_del_producto = searchValue;
    updatedItems[index].id = '';
    updatedItems[index].recipeId = ''; // Reseteamos recipeId al buscar de nuevo
    updatedItems[index].costoTotalItemPagado = '';
    updatedItems[index].cantidadCompra = '';
    updatedItems[index].unidadesCompra = '';

    const combinedOptions = [...(allItems || []), ...(allProduccion || [])];

    const matches = searchValue
      ? combinedOptions.filter((option) =>
        option.Nombre_del_producto && option.Nombre_del_producto.toLowerCase().includes(searchValue.toLowerCase())
      )
      : [];

    updatedItems[index].matches = matches;
    setItems(updatedItems);
  };

  const handleItemSelect = (index, selectedOption) => {
    const updatedItems = [...Items];
    updatedItems[index] = {
      ...updatedItems[index],
      id: selectedOption._id || selectedOption.Nombre_del_producto,
      // MODIFICADO: Guardamos el recipeId si existe en el item seleccionado
      recipeId: selectedOption.recipeId || selectedOption._id, // Ajusta esto según tu estructura de datos real
      Nombre_del_producto: selectedOption.Nombre_del_producto,
      cantidadCompra: selectedOption.CANTIDAD || '',
      unidadesCompra: selectedOption.UNIDADES || '',
      costoTotalItemPagado: '',
      matches: [],
    };
    setItems(updatedItems);
  };


  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formattedHoy || !Comprador || (!Proveedor_Id && !staff_id) || !MedioDeCompra || !MedioDePago || !Categoria || !Concepto) {
      alert("Por favor, completa todos los campos generales requeridos.");
      return;
    }
    if (transporteData.tipo || transporteData.pasaje_flete || transporteData.tiempo) {
      if (!transporteData.tipo) { alert("Si ingresas datos de transporte, debes seleccionar el Tipo."); return; }
      if (isNaN(Number(transporteData.pasaje_flete)) || Number(transporteData.pasaje_flete) < 0) { alert("El valor de Pasaje/Flete debe ser un número válido (0 o mayor)."); return; }
      if (isNaN(Number(transporteData.tiempo)) || Number(transporteData.tiempo) < 0) { alert("El valor de Tiempo debe ser un número válido (0 o mayor)."); return; }
    }
    if (Items.length === 0 && !isStaff) { alert("Debes agregar al menos un producto/item al gasto."); return; }

    const invalidItems = Items.filter(item =>
      !item.id ||
      item.Nombre_del_producto.trim() === '' ||
      isNaN(Number(item.cantidadCompra)) || Number(item.cantidadCompra) <= 0 ||
      !item.unidadesCompra || item.unidadesCompra.trim() === '' ||
      isNaN(Number(item.costoTotalItemPagado)) || Number(item.costoTotalItemPagado) < 0
    );

    if (invalidItems.length > 0 && !isStaff) {
      alert("Revisa los items: Selecciona un producto, ingresa Cantidad (>0), Unidad (no vacía) y Costo Total Pagado (>=0) válidos.");
      return;
    }

    if (!window.confirm(`Confirmar y registrar gasto por ${formatCurrency(ValorTotalCalculado)}?`)) return;

    const gastoData = {
      Date: formattedHoy,
      Valor: ValorTotalCalculado,
      MedioDeCompra,
      MedioDePago,
      Comprador,
      Pagado: {
        pagadoFull: Pagado.pagadoFull,
        adelanto: Pagado.pagadoFull ? "N/A" : String(Number(Pagado.adelanto) || 0)
      },
      Categoria,
      linkDocSoporte: linkDocSoporte || null,
      Proveedor_Id: isStaff ? null : Proveedor_Id,
      staff_id: isStaff ? staff_id : null,
      Concepto,
      Transporte: JSON.stringify({
        tipo: transporteData.tipo || null,
        pasaje_flete: Number(transporteData.pasaje_flete) || 0,
        tiempo: Number(transporteData.tiempo) || 0
      }),
      Items: JSON.stringify(isStaff ? [{
        id: "NOMINA",
        Nombre_del_producto: "PAGO NOMINA",
        cantidadCompra: 1,
        unidadesCompra: "UNIDAD",
        costoTotalItemPagado: ValorTotalCalculado
      }] : Items.map(item => ({
        id: item.id,
        Nombre_del_producto: item.Nombre_del_producto,
        cantidadCompra: Number(item.cantidadCompra),
        unidadesCompra: item.unidadesCompra,
        costoTotalItemPagado: Number(item.costoTotalItemPagado)
      }))),
    };

    console.log("Enviando Gasto:", gastoData);

    try {
      const result = await dispatch(crearCompra(gastoData));

      if (result) {
        console.log("Gasto registrado con éxito:", result);
        alert("Gasto registrado exitosamente!");
        setHoy(new Date().toISOString().split('T')[0]);
        setFormattedHoy(new Date().toLocaleDateString("en-US", { timeZone: "America/Bogota" }));
        setMedioDeCompra("");
        setMedioDePago("");
        setComprador("");
        setPagado({ pagadoFull: false, adelanto: "" });
        setCategoria("");
        setLinkDocSoporte("");
        setProveedorId("");
        setStaffId("");
        setConcepto("");
        setTransporteData({ tipo: '', pasaje_flete: '', tiempo: '' });
        setItems([]);
        setNominaTotal(0);
        setAjuste("");
      } else {
        console.warn("La acción crearCompra se completó pero no retornó un indicador de éxito claro.", result);
        alert("El gasto podría no haberse registrado correctamente. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error al registrar el gasto:", error);
      alert(`Hubo un error al registrar el gasto: ${error.message || 'Error desconocido'}`);
    }
  };

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Gasto</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sección de Datos Generales y Transporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border p-4 rounded-md shadow-sm bg-gray-50">
          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
            <Input type="date" id="date" name="date" value={hoy} onChange={handleDateChange} className="w-full h-10" required />
            <p className="text-xs text-gray-500 mt-1">Seleccionado: {formattedHoy || 'Ninguna'}</p>
          </div>

          {/* Comprador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comprador:</label>




            <select name="Comprador" value={Comprador} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
              <option value="">Seleccione staff...</option>
              {(Staff || []).map((s) => (
                <option key={s._id} value={s.Nombre}>
                  {s.Nombre} {s.Apellido}
                </option>
              ))}
            </select>

          </div>

          {/* Proveedor / Staff */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">{isStaff ? "Staff:" : "Proveedor:"}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{isStaff ? "Staff" : "Prov"}</span>
                <Switch checked={isStaff} onCheckedChange={setIsStaff} />
              </div>
            </div>

            {isStaff ? (
              <select name="staff_id" value={staff_id} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="">Seleccione staff...</option>
                {(Staff || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.Nombre} {s.Apellido}
                  </option>
                ))}
              </select>
            ) : (
              <select name="Proveedor_Id" value={Proveedor_Id} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="">Seleccione proveedor...</option>
                {(Proveedores || []).map((proveedor) => (
                  <option key={proveedor._id || proveedor.Nombre_Proveedor} value={proveedor._id}>
                    {proveedor.Nombre_Proveedor}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Medio de Compra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio Compra:</label>
            <select name="MedioDeCompra" value={MedioDeCompra} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
              <option value="">Seleccione...</option>
              <option value="PEDIDO">PEDIDO</option>
              <option value="COMPRA_DIRECTA">COMPRA DIRECTA</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio Pago:</label>
            <select name="MedioDePago" value={MedioDePago} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
              <option value="">Seleccione...</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TARJETA_DEBITO">TARJETA DÉBITO</option>
              <option value="TARJETA_CREDITO">TARJETA CRÉDITO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="NEQUI">NEQUI</option>
              <option value="DAVIPLATA">DAVIPLATA</option>
              <option value="QR">QR</option>
              <option value="CREDITO_PROVEEDOR">CRÉDITO PROVEEDOR</option>
            </select>
          </div>

          {/* Pagado */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Pago:</label>
            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="pagadoFull" checked={Pagado.pagadoFull} onChange={handlePagadoChange} className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
                <span className="text-sm">Pagado Full</span>
              </label>
              {!Pagado.pagadoFull && (<Input type="number" name="adelanto" value={Pagado.adelanto} onChange={handlePagadoChange} placeholder="Adelanto $" className="w-28 h-10 text-sm" min="0" disabled={Pagado.pagadoFull} />)}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Gasto:</label>
            <select name="Categoria" value={Categoria} onChange={handleGeneralInputChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required >
              <option value="">Seleccione...</option>
              <option value="INSUMOS_COCINA">INSUMOS COCINA</option>
              <option value="INSUMOS_CAFE">INSUMOS CAFÉ</option>
              <option value="INSUMOS_BARRA">INSUMOS BARRA</option>
              <option value="PAPELERIA_EMPAQUES">PAPELERÍA Y EMPAQUES</option>
              <option value="LIMPIEZA_ASEO">LIMPIEZA Y ASEO</option>
              <option value="MANTENIMIENTO_REPARACION">MANTENIMIENTO Y REPARACIÓN</option>
              <option value="SERVICIOS_PUBLICOS">SERVICIOS PÚBLICOS</option>
              <option value="NOMINA_PERSONAL">NÓMINA Y PERSONAL</option>
              <option value="MARKETING_PUBLICIDAD">MARKETING Y PUBLICIDAD</option>
              <option value="IMPUESTOS_LEGALES">IMPUESTOS Y LEGALES</option>
              <option value="MOBILIARIO_EQUIPO">MOBILIARIO Y EQUIPO</option>
              <option value="GASTOS_ADMINISTRATIVOS">GASTOS ADMINISTRATIVOS</option>
              <option value="OTROS">OTROS</option>
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto Específico:</label>
            <Input type="text" name="Concepto" value={Concepto} onChange={handleGeneralInputChange} placeholder="Ej: Compra verduras, Pago nómina..." className="w-full h-10" required />
          </div>

          {/* --- SECCIÓN TRANSPORTE --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Transporte:</label>
            <select name="tipo" value={transporteData.tipo} onChange={handleTransporteChange} className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" >
              <option value="">N/A</option>
              <option value="domi">DOMICILIARIO</option>
              <option value="merca">MERCADO/COMPRA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pasaje/Flete ($):</label>
            <Input type="number" name="pasaje_flete" value={transporteData.pasaje_flete} onChange={handleTransporteChange} placeholder="0" className="w-full h-10" min="0" disabled={!transporteData.tipo} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo (min):</label>
            <Input type="number" name="tiempo" value={transporteData.tiempo} onChange={handleTransporteChange} placeholder="0" className="w-full h-10" min="0" />
          </div>
          {/* --- FIN SECCIÓN TRANSPORTE --- */}

          {/* Link Documento Soporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Doc. Soporte:</label>
            <Input type="url" name="linkDocSoporte" value={linkDocSoporte} onChange={handleGeneralInputChange} placeholder="https://..." className="w-full h-10" />
          </div>

        </div>

        {/* Sección de Items o Nómina */}
        <div className="border p-4 rounded-md shadow-sm bg-white">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            {isStaff ? "Detalle de Nómina" : "Productos / Items Comprados"}
          </h3>

          {isStaff ? (
            <NominaCalculator
              staffId={staff_id}
              onTotalCalculated={setNominaTotal}
            />
          ) : (
            <>
              {/* Encabezados de la tabla de items */}
              <div className="hidden md:grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 px-2 pb-2 mb-2 border-b text-xs font-medium text-gray-500">
                <span>Producto</span>
                <span className="w-20 text-center">Cant. Compra</span>
                <span className="w-24 text-center">Unidad Compra</span>
                <span className="w-28 text-center">Costo Total Pagado ($)</span>
                {/* Columna vacía para alinear con el botón X */}
                <span className="w-9"></span>
              </div>
              <div className="space-y-3">
                {Items.map((item, index) => (
                  // Grid ajustado para layout de tabla
                  <div key={index} className="grid grid-cols-[1fr,auto,auto,auto,auto] gap-2 items-center p-2 border md:border-0 md:p-0 rounded-md md:rounded-none relative bg-gray-50 hover:bg-gray-100 md:bg-transparent md:hover:bg-transparent transition-colors duration-150">

                    {/* Input de Búsqueda y Dropdown (Col 1) - AHORA INCLUYE EL LINK */}
                    <div className="col-span-5 md:col-span-1 flex items-center gap-2">
                      {/* Link al Item/Receta - Solo visible si hay recipeId */}
                      {item.recipeId && (
                        <a
                          href={`/item/${item.recipeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                          title="Ver Detalles del Item"
                        >
                          📦
                        </a>
                      )}

                      {/* Contenedor relativo para el input y el dropdown */}
                      <div className="relative w-full">
                        <Input
                          type="text"
                          placeholder="Buscar producto..."
                          value={item.Nombre_del_producto}
                          onChange={(e) => handleItemSearchChange(index, e.target.value)}
                          className="text-sm h-10 w-full"
                        />
                        {item.matches && item.matches.length > 0 && (
                          <ul className="absolute bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto z-20 w-full mt-1 left-0">
                            {item.matches.map((match) => (
                              <li
                                key={match._id || match.Nombre_del_producto}
                                onClick={() => handleItemSelect(index, match)}
                                className="p-2 hover:bg-blue-100 cursor-pointer text-xs"
                              >
                                {match.Nombre_del_producto}
                                {/* Muestra Unidad de referencia */}
                                {match.UNIDADES && ` (Ref: ${match.CANTIDAD || '?'} ${match.UNIDADES})`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Cantidad Compra (Col 2) */}
                    <div className="w-full md:w-auto"> {/* Ajuste responsivo */}
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.cantidadCompra}
                        onChange={(e) => handleItemInputChange(index, 'cantidadCompra', e.target.value)}
                        placeholder="Cant."
                        className="w-full md:w-20 text-center text-sm h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Unidad Compra (Col 3) */}
                    <div className="w-full md:w-auto"> {/* Ajuste responsivo */}
                      <Input
                        type="text"
                        value={item.unidadesCompra}
                        onChange={(e) => handleItemInputChange(index, 'unidadesCompra', e.target.value)}
                        placeholder="Unidad"
                        className="w-full md:w-24 text-center text-sm h-10"
                      />
                    </div>

                    {/* Costo Total Pagado (Col 4) */}
                    <div className="w-full md:w-auto"> {/* Ajuste responsivo */}
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.costoTotalItemPagado}
                        onChange={(e) => handleItemInputChange(index, 'costoTotalItemPagado', e.target.value)}
                        placeholder="Costo Total $"
                        className="w-full md:w-28 text-center text-sm h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Botón Eliminar Fila (Col 5) */}
                    {/* Posicionamiento absoluto en móvil, relativo en desktop */}
                    <Button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 h-9 w-9 absolute top-1 right-1 md:relative md:top-auto md:right-auto md:justify-self-end"
                    >
                      <XCircle size={18} />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Botón para Añadir Nueva Fila */}
              <Button type="button" onClick={handleAddNewItemRow} variant="outline" className="w-full mt-4 border-dashed h-10 text-sm hover:bg-gray-100">
                <PlusCircle size={16} className="mr-2" /> Añadir Producto
              </Button>
            </>
          )}
        </div>

        {/* Sección de Resumen y Acciones */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-4 border-t bg-gray-50 rounded-b-md">
          <div className="text-left mb-4 md:mb-0 flex flex-col gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ajuste / Adicional ($):</label>
              <Input
                type="number"
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                placeholder="0"
                className="w-32 h-10"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">VALOR TOTAL GASTO</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(ValorTotalCalculado)}</p>
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto h-12 px-6 text-base bg-blue-600 hover:bg-blue-700 text-white">
            Registrar Gasto
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Gastos;