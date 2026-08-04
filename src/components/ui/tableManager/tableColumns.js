import { Staff, Comanda, Procedimientos, MenuItems, AGENDA } from "../../../redux/actions-types";

// Definir todas las columnas disponibles según el tipo
export const getAvailableColumns = (currentType, filterSubGrupo) => {
  switch(currentType) {
    case MenuItems:
      const isLunchOnly = filterSubGrupo === "ALMUERZO" || filterSubGrupo === "TARDEO_ALMUERZO";
      
      if (isLunchOnly) {
        return {
          nombre: { label: "Nombre", key: "NombreES", default: true },
          fecha: { label: "Fecha", key: "fecha", default: true },
          entrada: { label: "Entrada", key: "entrada", default: true },
          proteina: { label: "Proteína", key: "proteina", default: true },
          opcion2: { label: "Opción 2", key: "opcion2", default: true },
          carbohidrato: { label: "Carbohidrato", key: "carbohidrato", default: true },
          acompanante: { label: "Acompañante", key: "acompanante", default: true },
          ensalada: { label: "Ensalada", key: "ensalada", default: true },
          bebida: { label: "Bebida", key: "bebida", default: true },
          pedidos: { label: "Pedidos", key: "pedidos", default: true },
          precio: { label: "Precio", key: "Precio", default: true },
          estado: { label: "Estado", key: "Estado", default: true },
          acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
        };
      }
      
      return {
        nombreES: { label: "Nombre ES", key: "NombreES", default: true },
        nombreEN: { label: "Nombre EN", key: "NombreEN", default: true },
        descripcionES: { label: "Descripción ES", key: "DescripcionMenuES", default: false },
        descripcionEN: { label: "Descripción EN", key: "DescripcionMenuEN", default: false },
        precio: { label: "Precio", key: "Precio", default: true },
        grupo: { label: "Grupo", key: "GRUPO", default: true },
        subGrupo: { label: "SUB_GRUPO", key: "SUB_GRUPO", default: true },
        tipoES: { label: "Tipo ES", key: "TipoES", default: false },
        tipoEN: { label: "Tipo EN", key: "TipoEN", default: false },
        foto: { label: "Foto", key: "Foto", default: false },
        print: { label: "PRINT", key: "PRINT", default: true },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    
    case Staff:
      return {
        nombre: { label: "Nombre", key: "Nombre", default: true },
        apellido: { label: "Apellido", key: "Apellido", default: true },
        cargo: { label: "Cargo", key: "Cargo", default: true },
        cc: { label: "CC", key: "CC", default: true },
        rate: { label: "Rate", key: "Rate", default: true },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    
    case Comanda:
      return {
        titulo: { label: "Título", key: "Tittle", default: true },
        categoria: { label: "Categoría", key: "Categoria", default: true },
        ejecutor: { label: "Ejecutor", key: "Ejecutor", default: true },
        fechaCreacion: { label: "Creado", key: "Dates.isued", default: true },
        fechaFin: { label: "Finalizado", key: "Dates.finished", default: false },
        dateAsigmente: { label: "Asignado", key: "Dates.date_asigmente", default: false }, 
        procedimientos: { label: "Procedimientos", key: "Procedimientos", default: false },
        pagado: { label: "Pagado", key: "Pagado.pagadoFull", default: true },
        notas: { label: "Notas", key: "Notas", default: false },
        estado: { label: "Estado", key: "Terminado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
      
    case Procedimientos:
      return {
        titulo: { label: "Título", key: "tittle", default: true },
        categoria: { label: "Categoría", key: "Categoria", default: true },
        DescripcionGeneral: { label: "DescripcionGeneral", key: "DescripcionGeneral", default: false },
        estado: { label: "Estado", key: "Estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    
    case AGENDA:
      return {
        nombre: { label: "Nombre", key: "nombreES", default: true },
        fecha: { label: "Fecha", key: "fecha", default: true },
        horario: { label: "Horario", key: "horaInicio", default: true },
        cliente: { label: "Cliente", key: "nombreCliente", default: true },
        valor: { label: "Valor", key: "valor", default: true },
        estado: { label: "Estado", key: "estado", default: true },
        acciones: { label: "Acciones", key: "acciones", default: true, fixed: true }
      };
    
    default:
      return {};
  }
};
