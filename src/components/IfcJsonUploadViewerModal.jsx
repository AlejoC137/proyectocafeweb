import React, { useState } from 'react';
import { ifcJsonService } from '../services/ifcJsonService';

export default function IfcJsonUploadViewerModal({ isOpen, onClose, onImportData }) {
  const [fileContent, setFileContent] = useState('');
  const [parsedModel, setParsedModel] = useState(null);
  const [projectMeta, setProjectMeta] = useState(null);
  const [categorySummary, setCategorySummary] = useState({});
  const [levels, setLevels] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'levels' | 'inspector'
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        setFileContent(text);
        processIfcJson(text);
      } catch (err) {
        setErrorMsg('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const processIfcJson = (text) => {
    setErrorMsg('');
    try {
      const parsed = ifcJsonService.parseIfcJson(text);
      setParsedModel(parsed);
      
      const meta = ifcJsonService.extractProjectMetadata(parsed);
      setProjectMeta(meta);

      const summary = ifcJsonService.extractCategorySummary(parsed);
      setCategorySummary(summary);

      const lvls = ifcJsonService.extractLevelsAndSpaces(parsed);
      setLevels(lvls);

      if (parsed.dataList && parsed.dataList.length > 0) {
        setSelectedItem(parsed.dataList[0]);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleImportToProject = () => {
    if (parsedModel && onImportData) {
      onImportData(parsedModel);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <h2 className="text-lg font-bold text-white">Visor & Ingestador de estándar ifcJSON-4</h2>
              <p className="text-xs text-slate-400">Importador universal para modelos exportados desde reviewPlugIn (Revit)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-sky-500/30 hover:border-sky-500/60 rounded-xl p-6 text-center bg-slate-950/40 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".json,.ifcjson"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 pointer-events-none">
              <span className="text-3xl">📁</span>
              <p className="text-sm font-medium text-slate-200">
                Arrastra tu archivo <span className="text-sky-400 font-semibold">.ifcjson</span> o pulsa para seleccionar
              </p>
              <p className="text-xs text-slate-400">Archivos generados desde reviewPlugIn o especificadores ifcJSON-4</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg text-sm">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Model Processed Information */}
          {parsedModel && projectMeta && (
            <div className="space-y-4">
              {/* Project Card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-sky-300">{projectMeta.projectName}</h3>
                  <p className="text-xs text-slate-300">{projectMeta.buildingName} • {projectMeta.projectDescription}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Estándar: <span className="text-emerald-400 font-mono">{parsedModel.header.version}</span></div>
                  <div>Origen: <span className="text-slate-200">{parsedModel.header.originatingSystem}</span></div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 gap-4">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'summary' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Resumen de Categorías BIM
                </button>
                <button
                  onClick={() => setActiveTab('levels')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'levels' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏢 Niveles & Espacios ({levels.length})
                </button>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'inspector' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔍 Inspeccionador de Elementos ({parsedModel.dataList.length})
                </button>
              </div>

              {/* Tab: Resumen */}
              {activeTab === 'summary' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(categorySummary).map(([cat, count]) => (
                    <div key={cat} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400 font-mono truncate">{cat}</div>
                      <div className="text-xl font-bold text-white mt-1">{count}</div>
                      <div className="text-[10px] text-sky-400">elementos especificados</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Niveles */}
              {activeTab === 'levels' && (
                <div className="space-y-3">
                  {levels.map((lvl) => (
                    <div key={lvl.globalId} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sky-300">{lvl.name}</span>
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">Elevación: {lvl.elevation} m</span>
                      </div>
                      <div className="text-xs text-slate-400">Habitaciones / Espacios ({lvl.spaces.length}):</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {lvl.spaces.map(sp => (
                          <div key={sp.globalId} className="bg-slate-900/60 p-2 rounded border border-slate-800 text-xs flex justify-between">
                            <span className="text-slate-200">{sp.name}</span>
                            <span className="text-emerald-400 font-mono">{sp.area} m²</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Inspector */}
              {activeTab === 'inspector' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Selector List */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 max-h-60 overflow-y-auto space-y-1">
                    {parsedModel.dataList.map(item => (
                      <button
                        key={item.globalId}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs truncate transition-colors ${
                          selectedItem?.globalId === item.globalId ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-slate-400 font-mono mr-1">[{item.type}]</span>
                        {item.name || item.globalId}
                      </button>
                    ))}
                  </div>

                  {/* Property Details */}
                  <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-xs space-y-3">
                    {selectedItem ? (
                      <>
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="font-bold text-sky-300 text-sm">{selectedItem.name || 'Sin Nombre'}</h4>
                          <p className="text-slate-400">Tipo IFC: <span className="text-emerald-400 font-mono">{selectedItem.type}</span></p>
                          <p className="text-slate-400">Global ID: <span className="font-mono">{selectedItem.globalId}</span></p>
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-300 mb-1">Propiedades (IfcPropertySet):</h5>
                          <div className="bg-slate-900 p-2 rounded max-h-40 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300">
                            {Object.entries(ifcJsonService.extractProperties(selectedItem)).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b border-slate-800/50 py-0.5">
                                <span className="text-slate-400">{k}:</span>
                                <span className="text-sky-300 ml-2 text-right">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">Selecciona un elemento para inspeccionar sus parámetros.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          {parsedModel && (
            <button
              onClick={handleImportToProject}
              className="px-5 py-2 text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors shadow-lg shadow-sky-500/20"
            >
              🚀 Ingestar e Importar ifcJSON al Proyecto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
