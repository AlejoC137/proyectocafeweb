import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllFromTable, preProcess, procesarRecetaYEnviarASupabase } from '../../../redux/actions';
import { STAFF, MENU, ITEMS, PRODUCCION } from '../../../redux/actions-types';
import PageLayout from '../../../components/ui/page-layout';
import ContentCard from '../../../components/ui/content-card';
import ActionButtonGroup from '../../../components/ui/action-button-group';
import PromoBanner from '../../../components/ui/promo-banner';
import { Button } from "@/components/ui/button";
import { FileText, Send, Upload, CheckCircle, AlertCircle } from "lucide-react";

function Home() {
  const dispatch = useDispatch();
  const [recetaJsonText, setRecetaJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const preProcessedData = useSelector(state => state.preProcess);

  const handleInputChange = (e) => {
    setRecetaJsonText(e.target.value);
    setError(''); // Limpiar error al escribir
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(ITEMS)),
          dispatch(getAllFromTable(PRODUCCION)),
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los datos iniciales');
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handlePreProcessAndSend = async () => {
    try {
      setError('');
      if (!recetaJsonText.trim()) {
        throw new Error('El campo de texto está vacío. Por favor, ingresa un JSON válido.');
      }
      
      setProcessing(true);
      const recetaJson = JSON.parse(recetaJsonText);
      await dispatch(preProcess(recetaJson));
      
    } catch (error) {
      console.error('Error al parsear el JSON de la receta:', error);
      setError('Error al parsear el JSON de la receta. Por favor, asegúrate de que el JSON es válido y está bien formateado.');
    } finally {
      setProcessing(false);
    }
  };

  const handleEnviarTodasLasRecetas = async () => {
    try {
      setError('');
      if (preProcessedData && Array.isArray(preProcessedData)) {
        setProcessing(true);
        await dispatch(procesarRecetaYEnviarASupabase());
      }
    } catch (error) {
      console.error('Error al enviar recetas:', error);
      setError('Error al enviar las recetas preprocesadas');
    } finally {
      setProcessing(false);
    }
  };

  const actions = (
    <ActionButtonGroup
      buttons={[
        {
          label: processing ? "Procesando..." : "Procesar Receta",
          icon: FileText,
          onClick: handlePreProcessAndSend,
          disabled: !recetaJsonText.trim() || processing,
          variant: "default"
        },
        {
          label: "Enviar Todas",
          icon: Send,
          onClick: handleEnviarTodasLasRecetas,
          disabled: !preProcessedData || !Array.isArray(preProcessedData) || processing,
          variant: "outline"
        }
      ]}
    />
  );

  return (
    <PageLayout title="Procesamiento de Recetas" actions={actions} loading={loading}>
      {/* Banner promocional */}
      <PromoBanner 
        title="CAFÉ ESPECIAL" 
        subtitle="Gestiona tus recetas de café con facilidad"
        discount="100%"
        className="mb-6"
      />
      
      <ContentCard>
        <div className="space-y-6">
          {/* Campo de entrada JSON */}
          <div>
            <label className="block text-sm font-bold text-cobalt-blue mb-2 font-PlaywriteDE">
              <Upload className="inline mr-2" size={16} />
              JSON de Receta
            </label>
            <textarea
              className="w-full p-4 border border-sage-green rounded-lg resize-none text-sm font-mono bg-white min-h-[300px] focus:ring-2 focus:ring-cobalt-blue focus:border-cobalt-blue transition-all shadow-sm"
              value={recetaJsonText}
              onChange={handleInputChange}
              placeholder='Ingrese el JSON de la receta aquí...\n\nEjemplo:\n{\n  "nombre": "Café Latte",\n  "ingredientes": [...],\n  "instrucciones": "..."\n}'
            />
          </div>
          
          {/* Mensajes de estado */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={16} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {preProcessedData && Array.isArray(preProcessedData) && (
            <div className="bg-light-leaf border border-sage-green rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-sage-green" size={16} />
                <p className="text-sm text-gray-700 font-PlaywriteDE font-bold">
                  ✅ Receta procesada exitosamente. {preProcessedData.length} elementos listos para enviar.
                </p>
              </div>
            </div>
          )}
          
          {/* Información de ayuda */}
          <div className="bg-terracotta-pink/10 border border-terracotta-pink rounded-lg p-4">
            <h3 className="text-sm font-bold text-cobalt-blue mb-2 font-SpaceGrotesk">💡 Instrucciones:</h3>
            <ul className="text-xs text-gray-700 space-y-1 font-PlaywriteDE font-bold">
              <li>• Pegue un JSON válido con la estructura de la receta</li>
              <li>• Haga clic en "Procesar Receta" para validar y preparar los datos</li>
              <li>• Una vez procesado, use "Enviar Todas" para guardar en la base de datos</li>
            </ul>
          </div>
        </div>
      </ContentCard>
    </PageLayout>
  );
}

export default Home;
