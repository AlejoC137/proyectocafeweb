import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Palette, Eye, EyeOff, Printer, Save, Plus, Coffee } from "lucide-react";

const HorizontalControls = ({
  controlTopClass = "top-[64px]",
  handlePrint,
  leng,
  setLeng,
  editMode,
  setEditMode,
  showColorPanel,
  setShowColorPanel,
  pageSize,
  setPageSize,
  saveConfig,
  isSaving,
  showIcons,
  setShowIcons,
  showItemDescriptions,
  setShowItemDescriptions,
  addPage,
  selectedColumn,
  setSelectedColumn,
  pages,
  updateColumnFlex
}) => {
  const safePageSize = pageSize || { width: 297, height: 210, unit: 'mm' };

  const currentFlex = selectedColumn
    ? (pages[selectedColumn.pageIndex]?.columns[selectedColumn.colIdx]?.flex || 1)
    : 1;

  return (
    <div className={`fixed ${controlTopClass} left-0 w-full z-[100] bg-white/95 backdrop-blur-md p-4 shadow-md border-b border-zinc-200 flex flex-wrap items-center justify-center gap-4 print:hidden`}>

      <div className="flex items-center gap-2 border-r pr-4">
        <Button
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
          className="h-10 gap-2"
        >
          {editMode ? <EyeOff size={16} /> : <Eye size={16} />}
          {editMode ? "Vista Previa" : "Editar"}
        </Button>

        <Button
          variant="outline"
          onClick={() => setLeng(!leng)}
          className="h-10 gap-2"
        >
          <Globe size={16} />
          {leng ? "ES" : "EN"}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowColorPanel(!showColorPanel)}
          className="h-10 gap-2"
        >
          <Palette size={16} />
          Diseño
        </Button>

        <Button
          variant={showIcons ? "default" : "outline"}
          onClick={() => setShowIcons(!showIcons)}
          className="h-10 gap-2"
        >
          <Coffee size={16} />
          {showIcons ? "Ocultar Iconos" : "Mostrar Iconos"}
        </Button>

        <Button
          variant={showItemDescriptions ? "default" : "outline"}
          onClick={() => setShowItemDescriptions(!showItemDescriptions)}
          className="h-10 gap-2"
        >
          {showItemDescriptions ? "📝 Ocultar Detalles" : "📝 Mostrar Detalles"}
        </Button>
      </div>

      {/* SELECTOR Y CONTROLES DE TAMAÑO DE HOJA */}
      <div className="flex items-center gap-3 border-r pr-4 bg-amber-50/80 p-1.5 px-3 rounded-md border border-amber-200">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase font-black text-amber-900">📐 Preset Hoja:</Label>
          <select
            value={
              (safePageSize.width === 279.4 && safePageSize.height === 215.9) ? 'letter' :
              (safePageSize.width === 431.8 && safePageSize.height === 279.4) ? 'tabloid' :
              (safePageSize.width === 420 && safePageSize.height === 297) ? 'a3' :
              (safePageSize.width === 65 && safePageSize.height === 65 && safePageSize.unit === 'cm') ? '65x65' : 'custom'
            }
            onChange={(e) => {
              const val = e.target.value;
              let newSize = { ...safePageSize };
              if (val === 'letter') newSize = { width: 279.4, height: 215.9, unit: 'mm' };
              else if (val === 'tabloid') newSize = { width: 431.8, height: 279.4, unit: 'mm' };
              else if (val === 'a3') newSize = { width: 420, height: 297, unit: 'mm' };
              else if (val === '65x65') newSize = { width: 65, height: 65, unit: 'cm' };
              
              setPageSize(newSize);
              saveConfig(null, null, newSize);
            }}
            className="h-8 text-xs font-bold bg-white border border-black p-1 rounded outline-none cursor-pointer"
          >
            <option value="letter">📄 Carta Horizontal (279.4 x 215.9 mm)</option>
            <option value="tabloid">📜 Tabloide Horizontal (431.8 x 279.4 mm)</option>
            <option value="a3">📐 A3 Horizontal (420 x 297 mm)</option>
            <option value="65x65">🍦 Cuadrado (65 x 65 cm)</option>
            <option value="custom">✏️ Personalizado</option>
          </select>
        </div>

        <div className="grid w-20 gap-1">
          <Label htmlFor="width" className="text-[10px] uppercase font-bold text-gray-700">Ancho</Label>
          <Input
            id="width"
            type="number"
            value={safePageSize.width ?? ''}
            onChange={(e) => {
              const newSize = { ...safePageSize, width: Number(e.target.value) };
              setPageSize(newSize);
              saveConfig(null, null, newSize);
            }}
            className="h-8 text-xs font-bold"
          />
        </div>
        <div className="grid w-20 gap-1">
          <Label htmlFor="height" className="text-[10px] uppercase font-bold text-gray-700">Alto</Label>
          <Input
            id="height"
            type="number"
            value={safePageSize.height ?? ''}
            onChange={(e) => {
              const newSize = { ...safePageSize, height: Number(e.target.value) };
              setPageSize(newSize);
              saveConfig(null, null, newSize);
            }}
            className="h-8 text-xs font-bold"
          />
        </div>
        <div className="grid w-16 gap-1">
          <Label className="text-[10px] uppercase font-bold text-gray-700">Unidad</Label>
          <Select
            value={safePageSize.unit || 'mm'}
            onValueChange={(val) => {
              const newSize = { ...safePageSize, unit: val };
              setPageSize(newSize);
              saveConfig(null, null, newSize);
            }}
          >
            <SelectTrigger className="h-8 text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="in">in</SelectItem>
              <SelectItem value="px">px</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      <div className="flex items-center gap-2">
        {editMode && (
          <Button variant="outline" className="h-10 gap-2 border-dashed" onClick={addPage}>
            <Plus size={16} />
            Añadir Página
          </Button>
        )}

        <Button
          variant="default"
          className="bg-green-600 hover:bg-green-700 h-10 gap-2"
          onClick={() => saveConfig()}
          disabled={isSaving}
        >
          <Save size={16} />
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="default"
          className="bg-black text-white hover:bg-zinc-800 h-10 gap-2"
          onClick={handlePrint}
        >
          <Printer size={16} />
          Imprimir
        </Button>
      </div>
    </div>
  );
};

export default HorizontalControls;
