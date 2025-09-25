import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem, crearProveedor } from "../../../redux/actions-Proveedores";
import { ITEMS, PRODUCCION, AREAS, CATEGORIES, unidades, ItemsAlmacen, ProduccionInterna, MENU,  } from "../../../redux/actions-types";
import ProcedimientosCreator from "../actividades/ProcedimientosCreator";
import WorkIsueCreator from "../actividades/WorkIsueCreator";
import StaffCreator from "../actividades/StaffCreator";

function AccionesRapidasActividades({ currentType }) {
  const dispatch = useDispatch();
  const allItems = useSelector((state) => state.allItems);
  const allProduccion = useSelector((state) => state.allProduccion);
  const allProveedores = useSelector((state) => state.Proveedores);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
          dispatch(getAllFromTable("Proveedores")),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleActualizarPrecios = () => {
    dispatch(
      currentType === ITEMS
        ? actualizarPrecioUnitario(allItems, ITEMS)
        : actualizarPrecioUnitario(allProduccion, PRODUCCION)
    );
  };

  const handleCopiarPendientes = (type) => {
    dispatch(copiarAlPortapapeles( type === ItemsAlmacen ? allItems : allProduccion, type === ItemsAlmacen ? "PC" : "PP" , "Proveedor" , allProveedores ));
  };

  const handleCopiarInfoItems = () => {
    const items = currentType === ITEMS ? allItems : allProduccion;
    const headers = Object.keys(items[0]).join("\t");
    const rows = items.map(item => Object.values(item).join("\t")).join("\n");
    const clipboardData = `${headers}\n${rows}`;

    navigator.clipboard.writeText(clipboardData)
      .then(() => {
        alert("Información copiada al portapapeles.");
      })
      .catch(err => {
        console.error("Error al copiar al portapapeles:", err);
        alert("Hubo un error al copiar la información.");
      });
  };

  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [procedimientosFormVisible, setProcedimientosFormVisible] = useState(false);
  const [workIsueFormVisible, setWorkIsueFormVisible] = useState(false);
  const [staffFormVisible, setStaffFormVisible] = useState(false);

  const initialItemData = {
    Nombre_del_producto: "",
    Proveedor: "",
    Estado: "Disponible",
    Area: "",
    CANTIDAD: "",
    UNIDADES: "",
    COSTO: "",
    STOCK: "",
    GRUPO: "",
    MARCA: [],
    precioUnitario: 0,
    ...(currentType === ItemsAlmacen && { COOR: "1.05" }),
  };

  const initialProveedorData = {
    Nombre_Proveedor: "",
    Contacto_Nombre: "",
    Contacto_Numero: "",
    Direccion: "",
    "NIT/CC": "",
  };

  const initialMenuItemData = {
    NombreES: "",
    NombreEN: "",
    DescripcionES: "",
    DescripcionEN: "",
    Precio: 0,
    Categoria: "",
    Subcategoria: "",
    Imagen: "",
  };

  const [newItemData, setNewItemData] = useState(initialItemData);
  const [newProveedorData, setNewProveedorData] = useState(initialProveedorData);
  const [menuItemData, setMenuItemData] = useState(initialMenuItemData);

  const handleInputChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCrearItem = async () => {
    try {
      const itemData = {
        ...newItemData,
        COOR: currentType === ItemsAlmacen ? "1.05" : undefined,
      };

      if (currentType === ProduccionInterna) {
        delete itemData.COOR;
      }

      // Remove empty string fields
      Object.keys(itemData).forEach(key => {
        if (itemData[key] === "") {
          delete itemData[key];
        }
      });

      await dispatch(crearItem(itemData, currentType));
      alert("Ítem creado correctamente.");
      setNewItemData(initialItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem:", error);
      alert("Hubo un error al crear el ítem.");
    }
  };

  const handleCrearMenuItem = async () => {
    try {
      const menuItem = {
        ...menuItemData,
      };

      // Remove empty string fields
      Object.keys(menuItem).forEach(key => {
        if (menuItem[key] === "") {
          delete menuItem[key];
        }
      });

      await dispatch(crearItem(menuItem, MENU));
      alert("Ítem de menú creado correctamente.");
      setMenuItemData(initialMenuItemData);
      setFormVisible(false);
    } catch (error) {
      console.error("Error al crear el ítem de menú:", error);
      alert("Hubo un error al crear el ítem de menú.");
    }
  };

  const handleCrearProveedor = async () => {
    try {
      await dispatch(crearProveedor(newProveedorData));
      alert("Proveedor creado correctamente.");
      setNewProveedorData(initialProveedorData);
      setFormProveedorVisible(false);
    } catch (error) {
      console.error("Error al crear el proveedor:", error);
      alert("Hubo un error al crear el proveedor.");
    }
  };

  return (
    <div className="bg-white p-4">
      <button onClick={() => setProcedimientosFormVisible(!procedimientosFormVisible)} className="bg-blue-500 text-white px-4 py-2 rounded">
        {procedimientosFormVisible ? "Ocultar Formulario de Procedimientos" : "Mostrar Formulario de Procedimientos"}
      </button>
      {procedimientosFormVisible && <ProcedimientosCreator />}

      <button onClick={() => setWorkIsueFormVisible(!workIsueFormVisible)} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        {workIsueFormVisible ? "Ocultar Formulario de WorkIsue" : "Mostrar Formulario de WorkIsue"}
      </button>
      {workIsueFormVisible && <WorkIsueCreator />}

      <button onClick={() => setStaffFormVisible(!staffFormVisible)} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        {staffFormVisible ? "Ocultar Formulario de Staff" : "Mostrar Formulario de Staff"}
      </button>
      {staffFormVisible && <StaffCreator />}
    </div>
  );
}

export default AccionesRapidasActividades;
