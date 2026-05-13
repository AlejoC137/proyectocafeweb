import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Palette, Eye, EyeOff, Printer, Save, Plus, Coffee } from "lucide-react";

const HorizontalControls = ({
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
  zoom,
  setZoom,
  showIcons,
  setShowIcons,
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
    <div className="fixed top-[64px] left-0 w-full z-[100] bg-white/95 backdrop-blur-md p-4 shadow-md border-b border-zinc-200 flex flex-wrap items-center justify-center gap-4 print:hidden">
      
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
      </div>

      <div className="flex items-center gap-4 border-r pr-4">
        <div className="grid w-24 gap-1.5">
          <Label htmlFor="width" className="text-[10px] uppercase font-bold">Ancho</Label>
          <Input 
            id="width" 
            type="number" 
            value={pageSize.width} 
            onChange={(e) => setPageSize({...pageSize, width: Number(e.target.value)})}
            className="h-8"
          />
        </div>
        <div className="grid w-24 gap-1.5">
          <Label htmlFor="height" className="text-[10px] uppercase font-bold">Alto</Label>
          <Input 
            id="height" 
            type="number" 
            value={pageSize.height} 
            onChange={(e) => setPageSize({...pageSize, height: Number(e.target.value)})}
            className="h-8"
          />
        </div>
        <div className="grid w-20 gap-1.5">
          <Label className="text-[10px] uppercase font-bold">Unit</Label>
          <Select 
            value={pageSize.unit} 
            onValueChange={(val) => setPageSize({...pageSize, unit: val})}
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

      <div className="flex items-center gap-4 border-r pr-4">
        <div className="grid w-24 gap-1.5">
          <Label className="text-[10px] uppercase font-bold text-blue-600">Zoom Vista</Label>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.05" 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-4 cursor-pointer"
          />
        </div>
      </div>

      {editMode && selectedColumn && (
        <div className="flex items-center gap-4 border-r pr-4 bg-blue-50/50 px-3 py-1 rounded-lg animate-in slide-in-from-top-2 duration-300 border-2 border-blue-200">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <div className="flex justify-between">
              <Label className="text-[10px] uppercase font-black text-blue-700">Ajuste Ancho Col</Label>
              <button onClick={() => setSelectedColumn(null)} className="text-[10px] font-bold text-red-600 hover:scale-110">X</button>
            </div>
            <input 
              type="range" 
              min="0.2" 
              max="3" 
              step="0.1" 
              value={currentFlex} 
              onChange={(e) => updateColumnFlex(selectedColumn.pageIndex, selectedColumn.colIdx, parseFloat(e.target.value), false)}
              onMouseUp={(e) => updateColumnFlex(selectedColumn.pageIndex, selectedColumn.colIdx, parseFloat(e.target.value), true)}
              className="h-2 cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}

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
