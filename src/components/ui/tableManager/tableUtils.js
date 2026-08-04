import { Staff, Comanda, Procedimientos, MenuItems, AGENDA } from "../../../redux/actions-types";

// Función para manejar objetos anidados de forma segura
export const parseNestedObject = (obj, fallback = {}) => {
  try {
    if (typeof obj === "string") {
      if (obj === "NaN" || obj === "null" || obj === "undefined" || !obj) {
        return fallback;
      }
      // Si no empieza con { o [, no es un JSON válido
      if (!obj.startsWith("{") && !obj.startsWith("[")) {
         console.warn("Valor no JSON en campo anidado:", obj);
         return fallback;
      }
      return JSON.parse(obj);
    }
    return obj || fallback;
  } catch (e) {
    console.warn("Invalid nested object JSON:", obj, e);
    return { ...fallback, _raw: obj };
  }
};

export const getSearchField = (product, currentType) => {
  switch(currentType) {
    case Staff:
      return `${product.Nombre || ""} ${product.Apellido || ""}`;
    case Comanda:
      return `${product.Tittle || ""} ${product.Categoria || ""} ${product.Notas || ""}`;
    case Procedimientos:
      return product.tittle;
    case MenuItems:
      return `${product.NombreES || ""} ${product.NombreEN || ""} ${product.DescripcionMenuES || ""}`;
    case AGENDA:
      return `${product.nombreES || product.nombre || ""} ${product.nombreCliente || ""} ${product.infoAdicional || ""}`;
    default:
      return "";
  }
};

export const getCategoryField = (product, currentType) => {
  switch(currentType) {
    case Staff:
      return product.Cargo;
    case Comanda:
      return product.Categoria;
    case Procedimientos:
      return product.Categoria;
    case MenuItems:
      return product.GRUPO;
    case AGENDA:
      return product.fecha ? product.fecha.substring(0, 7) : "Sin fecha";
    default:
      return "";
  }
};

export const getStatusField = (product, currentType) => {
  switch(currentType) {
      case Comanda:
          return product.Terminado ? "Terminado" : "Pendiente";
      case AGENDA:
          return product.estado || "pendiente";
      default:
          return product.Estado;
  }
};

export const getUniqueCategories = (products, currentType) => {
  switch(currentType) {
    case Staff:
      return [...new Set(products.map(p => p.Cargo).filter(Boolean))];
    case Comanda:
      return [...new Set(products.map(p => p.Categoria).filter(Boolean))];
    case Procedimientos:
      return [...new Set(products.map(p => p.Categoria).filter(Boolean))];
    case MenuItems:
      return [...new Set(products.map(p => p.GRUPO).filter(Boolean))];
    default:
      return [];
  }
};

export const getUniqueSubGroups = (products, currentType) => {
  if (currentType === MenuItems) {
    return [...new Set(products.map(p => p.SUB_GRUPO).filter(Boolean))];
  }
  return [];
};

export const getUniqueTipos = (products, currentType) => {
  if (currentType === MenuItems) {
    return [...new Set(products.map(p => p.TipoES).filter(Boolean))];
  }
  return [];
};

export const validateRowData = (editedData, currentType) => {
  const errors = [];
  
  if (currentType === Staff) {
    if (editedData.Nombre && editedData.Nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (editedData.Rate !== undefined && (isNaN(parseFloat(editedData.Rate)) || parseFloat(editedData.Rate) < 0)) {
      errors.push('La tarifa debe ser un número válido mayor o igual a 0');
    }
  } else if (currentType === Comanda) {
    if (editedData.Tittle && editedData.Tittle.trim().length < 2) {
      errors.push('El título debe tener al menos 2 caracteres');
    }
  } else if (currentType === Procedimientos) {
    if (editedData.tittle && editedData.tittle.trim().length < 2) {
      errors.push('El título debe tener al menos 2 caracteres');
    }
  } else if (currentType === MenuItems) {
    if (editedData.NombreES && editedData.NombreES.trim().length < 2) {
      errors.push('El nombre en español debe tener al menos 2 caracteres');
    }
    if (editedData.Precio !== undefined && (isNaN(parseFloat(editedData.Precio)) || parseFloat(editedData.Precio) <= 0)) {
      errors.push('El precio debe ser un número válido mayor que 0');
    }
  }
  
  return errors;
};
