import { ItemsAlmacen, ProduccionInterna, MenuItems } from "../../redux/actions-types";

export const getAvailableColumns = (currentType) => {
  switch (currentType) {
    case MenuItems:
      return {
        nombreES: { label: "Nombre ES", key: "NombreES", default: true },
        nombreEN: { label: "Nombre EN", key: "NombreEN", default: true },
        precio: { label: "Precio", key: "Precio", default: true },
        descripcionES: { label: "Descripción ES", key: "DescripcionMenuES", default: false },
        descripcionEN: { label: "Descripción EN", key: "DescripcionMenuEN", default: false },
        tipoES: { label: "Tipo ES", key: "TipoES", default: true },
        tipoEN: { label: "Tipo EN", key: "TipoEN", default: false },
        cuidadoES: { label: "Cuidado ES", key: "CuidadoES", default: true },
        cuidadoEN: { label: "Cuidado EN", key: "CuidadoEN", default: true },
        grupo: { label: "Grupo", key: "GRUPO", default: true },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    case ItemsAlmacen:
      return {
        nombre: { label: "Nombre", key: "Nombre_del_producto", default: true },
        cantidad: { label: "Cantidad", key: "CANTIDAD", default: false },
        unidades: { label: "Unidades", key: "UNIDADES", default: false },
        costo: { label: "Costo", key: "COSTO", default: false },
        proveedor: { label: "Proveedor", key: "Proveedor", default: true },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    case ProduccionInterna:
      return {
        nombre: { label: "Nombre", key: "Nombre_del_producto", default: true },
        cantidad: { label: "Cantidad", key: "CANTIDAD", default: true },
        unidades: { label: "Unidades", key: "UNIDADES", default: true },
        costo: { label: "Costo", key: "COSTO", default: true },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    default:
      return {};
  }
};