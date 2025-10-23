import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
// Asegúrate que la ruta a tus acciones sea correcta y que el archivo exista
import { crearCompra } from "../../../redux/actions-VentasCompras.js"; 
import { Input } from "@/components/ui/input"; 
import { Button } from "@/components/ui/button"; 
import { PlusCircle, MinusCircle, XCircle } from 'lucide-react'; 

function Gastos() {
  // --- Redux State ---
  // CORRECCIÓN: Usar allItems en lugar de allMenu
  const allItems = useSelector((state) => state.allItems || []); 
  const Proveedores = useSelector((state) => state.Proveedores || []); 
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
  const [Concepto, setConcepto] = useState("");

  // Estado para los items (productos) del Gasto
  // CORRECCIÓN: Inicializar como array vacío
  const [Items, setItems] = useState([]); // Array de objetos { id: '', Nombre_del_producto: '', quantity: 1, costoUnitario: 0, matches: [] }

  // --- Derived State (Calculated Values) ---
  const ValorTotalCalculado = useMemo(() => {
    return Items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const costo = Number(item.costoUnitario) || 0;
      return total + (quantity * costo);
    }, 0);
  }, [Items]);

  // --- Event Handlers ---

  const handleDateChange = (e) => {
    const dateValue = e.target.value; // YYYY-MM-DD
    setHoy(dateValue);
    if (dateValue) {
      const dateParts = dateValue.split("-"); // [YYYY, MM, DD]
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
      case 'Concepto': setConcepto(value); break;
      default: break;
    }
  };

   const handlePagadoChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'pagadoFull') {
      setPagado(prev => ({ ...prev, pagadoFull: checked, adelanto: checked ? "" : prev.adelanto }));
    } else if (name === 'adelanto') {
      if (!Pagado.pagadoFull) {
        setPagado(prev => ({ ...prev, adelanto: value }));
      }
    }
  };

  // --- Handlers para Items ---

  const handleAddNewItemRow = () => {
    setItems(prev => [...prev, { id: '', Nombre_del_producto: '', quantity: 1, costoUnitario: 0, matches: [] }]);
  };

  const handleRemoveItemRow = (indexToRemove) => {
    setItems(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleItemQuantityChange = (index, amount) => {
    setItems(prevItems => prevItems.map((item, i) => {
      if (i === index) {
        const currentQuantity = Number(item.quantity) || 0;
        const newQuantity = Math.max(0, currentQuantity + amount); 
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleManualQuantityChange = (index, value) => {
     setItems(prevItems => prevItems.map((item, i) => {
      if (i === index) {
        const numValue = value === '' ? '' : Number(value);
        const newQuantity = (value === '' || (!isNaN(numValue) && numValue >= 0)) ? value : item.quantity;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

   const handleCostoUnitarioChange = (index, value) => {
    setItems(prevItems => prevItems.map((item, i) => {
     if (i === index) {
       const numValue = value === '' ? '' : Number(value);
       const newCosto = (value === '' || (!isNaN(numValue) && numValue >= 0)) ? value : item.costoUnitario;
       return { ...item, costoUnitario: newCosto };
     }
     return item;
   }));
 };


  /** CORREGIDO: Busca en allItems */
  const handleItemSearchChange = (index, searchValue) => {
    const updatedItems = [...Items];
    
    updatedItems[index].Nombre_del_producto = searchValue; 
    updatedItems[index].id = ''; 
    updatedItems[index].costoUnitario = 0; 

    // CORRECCIÓN: Filtra allItems en lugar de allMenu
    const matches = searchValue
      ? (allItems || []).filter((option) =>
          option.Nombre_del_producto && option.Nombre_del_producto.toLowerCase().includes(searchValue.toLowerCase())
        )
      : [];

    updatedItems[index].matches = matches; 
    setItems(updatedItems);
  };

  /** CORREGIDO: Selecciona de allItems */
  const handleItemSelect = (index, selectedOption) => {
    const updatedItems = [...Items];
    updatedItems[index] = {
      ...updatedItems[index], 
      id: selectedOption._id || selectedOption.Nombre_del_producto, 
      Nombre_del_producto: selectedOption.Nombre_del_producto, 
      // CORRECCIÓN: Asume COSTO desde el item seleccionado (de allItems)
      costoUnitario: selectedOption.COSTO || 0, 
      matches: [], 
    };
    setItems(updatedItems);
  };


  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
     if (!formattedHoy || !Comprador || !Proveedor_Id || !MedioDeCompra || !MedioDePago || !Categoria || !Concepto) {
        alert("Por favor, completa todos los campos generales requeridos.");
        return;
      }
    if (Items.length === 0) {
        alert("Debes agregar al menos un producto/item al gasto.");
        return;
    }

    const invalidItems = Items.filter(item =>
        !item.id ||
        item.Nombre_del_producto.trim() === '' || 
        isNaN(Number(item.quantity)) || Number(item.quantity) <= 0 || 
        isNaN(Number(item.costoUnitario)) || Number(item.costoUnitario) < 0 
      );

    if (invalidItems.length > 0) {
      alert("Revisa los items: Asegúrate de seleccionar un producto válido, y que la cantidad (> 0) y costo unitario (>= 0) sean números correctos.");
      return;
    }

     if (!window.confirm("¿Confirmar y registrar este gasto?")) return;

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
      Proveedor_Id,
      Concepto,
      Items: JSON.stringify(Items.map(item => ({
        id: item.id, 
        Nombre_del_producto: item.Nombre_del_producto,
        quantity: Number(item.quantity), 
        costoUnitario: Number(item.costoUnitario) 
      }))),
    };

    console.log("Enviando Gasto:", gastoData);

    try {
      const result = await dispatch(crearCompra(gastoData));

      if (result) { 
        console.log("Gasto registrado con éxito:", result);
        alert("Gasto registrado exitosamente!");
        // Resetear formulario
        setHoy(new Date().toISOString().split('T')[0]);
        setFormattedHoy(new Date().toLocaleDateString("en-US", { timeZone: "America/Bogota" }));
        setMedioDeCompra("");
        setMedioDePago("");
        setComprador("");
        setPagado({ pagadoFull: false, adelanto: "" });
        setCategoria("");
        setLinkDocSoporte("");
        setProveedorId("");
        setConcepto("");
        setItems([]); 
      } else {
         console.warn("La acción crearCompra se completó pero no retornó un indicador de éxito claro.", result);
         alert("El gasto podría no haberse registrado correctamente. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error al registrar el gasto:", error);
      alert(`Hubo un error al registrar el gasto: ${error.message || 'Error desconocido'}`);
    }
  };

  // Formatear moneda local
  const formatCurrency = (value) => {
      const number = Number(value) || 0;
      return `$ ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(number)}`;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Registrar Gasto</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sección de Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border p-4 rounded-md shadow-sm bg-gray-50">
          {/* Fecha */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
            <Input
              type="date"
              id="date"
              name="date"
              value={hoy} 
              onChange={handleDateChange}
              className="w-full h-10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Seleccionado: {formattedHoy || 'Ninguna'}</p>
          </div>

          {/* Comprador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comprador:</label>
            <Input
              type="text"
              name="Comprador"
              value={Comprador}
              onChange={handleGeneralInputChange}
              placeholder="Nombre del comprador"
              className="w-full h-10"
              required
            />
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor:</label>
            <select
              name="Proveedor_Id"
              value={Proveedor_Id}
              onChange={handleGeneralInputChange}
              className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccione proveedor...</option>
              {(Proveedores || []).map((proveedor) => (
                <option key={proveedor._id || proveedor.Nombre_Proveedor} value={proveedor._id}>
                  {proveedor.Nombre_Proveedor}
                </option>
              ))}
            </select>
          </div>

          {/* Medio de Compra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Compra:</label>
            <select
              name="MedioDeCompra"
              value={MedioDeCompra}
              onChange={handleGeneralInputChange}
              className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccione...</option>
              <option value="PEDIDO">PEDIDO</option>
              <option value="COMPRA_DIRECTA">COMPRA DIRECTA</option>
              <option value="ONLINE">ONLINE</option>
            </select>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago:</label>
            <select
              name="MedioDePago"
              value={MedioDePago}
              onChange={handleGeneralInputChange}
              className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Pago:</label>
            <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name="pagadoFull"
                        checked={Pagado.pagadoFull}
                        onChange={handlePagadoChange}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Pagado Completo</span>
                </label>
                {!Pagado.pagadoFull && (
                    <Input
                        type="number"
                        name="adelanto"
                        value={Pagado.adelanto}
                        onChange={handlePagadoChange}
                        placeholder="Adelanto $"
                        className="w-28 h-10 text-sm"
                        min="0" 
                        disabled={Pagado.pagadoFull} 
                    />
                )}
            </div>
           </div>


          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Gasto:</label>
            <select
              name="Categoria"
              value={Categoria}
              onChange={handleGeneralInputChange}
              className="w-full p-2 border bg-white rounded h-10 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
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
            <Input
              type="text"
              name="Concepto"
              value={Concepto}
              onChange={handleGeneralInputChange}
              placeholder="Ej: Compra verduras semana, Pago nómina..."
              className="w-full h-10"
              required
            />
          </div>

           {/* Link Documento Soporte */}
           <div className="md:col-span-1"> 
            <label className="block text-sm font-medium text-gray-700 mb-1">Link Doc. Soporte (Opcional):</label>
            <Input
              type="url"
              name="linkDocSoporte"
              value={linkDocSoporte}
              onChange={handleGeneralInputChange}
              placeholder="https://..."
              className="w-full h-10"
            />
          </div>

        </div>

        {/* Sección de Items */}
        <div className="border p-4 rounded-md shadow-sm bg-white">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Productos / Items Comprados</h3>
          <div className="space-y-3">
            {Items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-2 items-start md:items-center p-2 border rounded-md relative bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                 
                 {/* Input de Búsqueda y Dropdown */}
                 <div className="flex-grow relative w-full md:w-auto">
                    <Input
                      type="text"
                      placeholder="Buscar producto..."
                      value={item.Nombre_del_producto} 
                      onChange={(e) => handleItemSearchChange(index, e.target.value)} 
                      className="text-sm h-10 w-full"
                    />
                    {/* Dropdown de Resultados */}
                    {item.matches && item.matches.length > 0 && (
                      <ul className="absolute bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto z-20 w-full mt-1">
                        {item.matches.map((match) => (
                          <li
                            key={match._id || match.Nombre_del_producto}
                            onClick={() => handleItemSelect(index, match)}
                            className="p-2 hover:bg-blue-100 cursor-pointer text-xs"
                          >
                            {match.Nombre_del_producto} 
                             {match.COSTO && ` (${formatCurrency(match.COSTO)})`}
                          </li>
                        ))}
                      </ul>
                    )}
                 </div>

                 {/* Cantidad */}
                <div className="flex items-center gap-1 w-full md:w-auto mt-2 md:mt-0">
                  <Button type="button" onClick={() => handleItemQuantityChange(index, -1)} variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-red-600"><MinusCircle size={18} /></Button>
                  <Input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleManualQuantityChange(index, e.target.value)}
                    className="font-bold w-16 text-center text-sm h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Cant."
                    />
                  <Button type="button" onClick={() => handleItemQuantityChange(index, 1)} variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:text-green-600"><PlusCircle size={18} /></Button>
                </div>

                {/* Costo Unitario */}
                <div className="w-full md:w-auto mt-2 md:mt-0">
                     <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.costoUnitario}
                        onChange={(e) => handleCostoUnitarioChange(index, e.target.value)}
                        placeholder="Costo Unit."
                        className="w-28 text-sm h-10 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                 {/* Costo Total Item */}
                 <span className="w-full md:w-28 text-right font-medium text-gray-700 text-sm md:text-base mt-2 md:mt-0">
                  {formatCurrency((Number(item.quantity) || 0) * (Number(item.costoUnitario) || 0))}
                 </span>

                {/* Botón Eliminar Fila */}
                <Button type="button" onClick={() => handleRemoveItemRow(index)} variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-9 w-9 absolute top-1 right-1 md:relative md:top-auto md:right-auto">
                  <XCircle size={18} />
                </Button>
              </div>
            ))}
          </div>
          {/* Botón para Añadir Nueva Fila */}
          <Button type="button" onClick={handleAddNewItemRow} variant="outline" className="w-full mt-4 border-dashed h-10 text-sm hover:bg-gray-100">
            <PlusCircle size={16} className="mr-2" /> Añadir Producto
          </Button>
        </div>

        {/* Sección de Resumen y Acciones */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-4 border-t bg-gray-50 rounded-b-md">
           <div className="text-left mb-4 md:mb-0">
                <p className="text-sm text-gray-500 font-medium">VALOR TOTAL GASTO</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(ValorTotalCalculado)}</p>
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