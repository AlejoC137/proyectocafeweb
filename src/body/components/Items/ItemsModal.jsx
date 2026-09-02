import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateItem, actualizarPrecioUnitario, getAllFromTable } from "../../../redux/actions";
import { ITEMS, ItemsAlmacen } from "../../../redux/actions-types";
import { safeJsonParse } from "../../../utils/jsonUtils";
import { copyPromptToClipboard } from "../../../utils/prompts";
import {
  Package, DollarSign, Tag, Calendar, User, MapPin, BarChart3,
  FileJson, Printer, Edit, Save, X, Calculator, Copy, Check,
  BookOpen, Sparkles, Image as ImageIcon, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VeaseSection from "@/components/Vease/VeaseSection";
import HorizontalGallery from "../Menu/MenuPrintHorizontal/HorizontalGallery";
import supabase from "../../../config/supabaseClient";

export default ItemsModal;
