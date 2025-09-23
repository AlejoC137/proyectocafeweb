import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { deleteItem, updateItem, getRecepie } from "../../redux/actions-Proveedores";
import { ESTATUS, BODEGA, CATEGORIES, SUB_CATEGORIES, ItemsAlmacen, ProduccionInterna, MenuItems, unidades } from "../../redux/actions-types";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import { parseCompLunch } from "../../utils/jsonUtils";
import RecepieOptions from "../../body/components/recepieOptions/RecepieOptions";
import RecepieOptionsMenu from "../../body/components/recepieOptions/RecepieOptionsMenu";
import CuidadoVariations from "./CuidadoVariations";

// Helper component for the cyclic status selector

export function TableViewInventarioCycle({ id, currentType , currentEstado }) {

  
const dispatch = useDispatch();
const products = useSelector((state) => state.products || []);
// Ciclo de estado según tipo
const statusCycleOptions =
  currentType === ProduccionInterna ? ["PP", "OK", "NA"] : ["PC", "OK", "NA"];

// Buscar el producto actual
const product = products.find((p) => p._id === id);

// Determinar el estado actual (si hay edición, usar ese)
const estadoActual = currentEstado || product?.Estado || statusCycleOptions[0];

// Cambiar estado al siguiente en el ciclo
const handleClick = async () => {
  const currentIndex = statusCycleOptions.indexOf(estadoActual);
  const nextIndex = (currentIndex + 1) % statusCycleOptions.length;
  const newEstado = statusCycleOptions[nextIndex];

  // Actualizar en backend
  await dispatch(updateItem(id, { Estado: newEstado }, currentType));
};

// Estilos visuales
const getStatusClass = (estado) => {
  switch (estado) {
    case "OK":
      return "bg-green-100 text-green-800 border-green-300";
    case "PC":
    case "PP":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "NA":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

return (
  <button
    type="button"
    onClick={handleClick}
    className={`w-full px-2 py-1 rounded-full text-xs font-medium border transition-colors hover:scale-105 ${getStatusClass(estadoActual)}`}
    title="Cambia el estado"
  >
    {estadoActual}
  </button>
);
}