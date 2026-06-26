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

      <div className="flex items-center gap-4 border-r pr-4">
        <div className="grid w-24 gap-1.5">
          <Label htmlFor="width" className="text-[10px] uppercase font-bold">Ancho</Label>
          <Input
            id="width"
            type="number"
            value={pageSize.width}
            onChange={(e) => setPageSize({ ...pageSize, width: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div className="grid w-24 gap-1.5">
          <Label htmlFor="height" className="text-[10px] uppercase font-bold">Alto</Label>
          <Input
            id="height"
            type="number"
            value={pageSize.height}
            onChange={(e) => setPageSize({ ...pageSize, height: Number(e.target.value) })}
            className="h-8"
          />
        </div>
        <div className="grid w-20 gap-1.5">
          <Label className="text-[10px] uppercase font-bold">Unit</Label>
          <Select
            value={pageSize.unit}
            onValueChange={(val) => setPageSize({ ...pageSize, unit: val })}
          >
            <SelectTrigger className="h-8">
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
          onClick={saveConfig}
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
