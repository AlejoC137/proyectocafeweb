import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable, actualizarPrecioUnitario, copiarAlPortapapeles, crearItem, sincronizarCostosProduccion } from "../../../redux/actions";
import {
  ITEMS,
  PRODUCCION,
  AREAS,
  CATEGORIES,
  unidades,
  ItemsAlmacen,
  ProduccionInterna,
  MENU,
  MenuItems,
  BODEGA,
  ESTATUS,
  SUB_CATEGORIES
} from "../../../redux/actions-types";
import { crearProveedor } from "../../../redux/actions-Proveedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RefreshCw, PlusCircle, X, Save, ShoppingCart, Hammer, FileText, UserPlus, FileJson, Check, SpellCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { copyPromptToClipboard } from "../../../utils/prompts";
import MacroEditorItems from "./MacroEditorItems";
import MacroAgregadorItems from "./MacroAgregadorItems";
import CorrectorOrtograficoModal from "../inventario/CorrectorOrtograficoModal";
import JsonImportReviewModal from "./JsonImportReviewModal";

function AccionesRapidas({ currentType: propType }) {
  const currentType = propType === "ITEMS" ? ITEMS : propType;
  const dispatch = useDispatch();

  const [formVisible, setFormVisible] = useState(false);
  const [formProveedorVisible, setFormProveedorVisible] = useState(false);
  const [jsonImportVisible, setJsonImportVisible] = useState(false);

  return <div>AccionesRapidas Backup</div>;
}

export default AccionesRapidas;
