import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { exportMenuExcel } from "../utils/exportMenuExcel";

export function ExportMenuExcelButton({ items = [], config, canalLabel = "Rappi" }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!items.length) {
      alert("No hay productos disponibles para exportar.");
      return;
    }
    setExporting(true);
    try {
      await exportMenuExcel(items, config, canalLabel);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      alert("Error al exportar el archivo Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleExport}
      disabled={exporting || items.length === 0}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs shadow-xs flex items-center gap-1.5"
      title="Descarga planilla Excel con formato portal y costeo interno"
    >
      {exporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5" />
      )}
      <span>Exportar Menú Excel</span>
    </Button>
  );
}

export default ExportMenuExcelButton;
