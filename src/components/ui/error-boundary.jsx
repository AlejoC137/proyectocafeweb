import React from "react";
import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentCard from "./content-card";

/**
 * Componente ErrorBoundary para mostrar errores de configuración de forma elegante
 */
function ConfigurationError({ error, onRetry }) {
  const isSupabaseError = error?.message?.includes('supabase') || error?.message?.includes('VITE_SUPABASE');
  
  if (isSupabaseError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="max-w-lg w-full">
          <ContentCard>
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <Settings size={48} className="text-red-500" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Error de Configuración
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Las credenciales de Supabase no están configuradas correctamente.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-left">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  🔧 Solución:
                </h3>
                <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>1. Asegúrate de que existe el archivo <code>.env</code></li>
                  <li>2. Configura las variables:</li>
                  <li className="ml-4"><code>VITE_SUPABASE_URL=tu_url</code></li>
                  <li className="ml-4"><code>VITE_SUPABASE_ANON_KEY=tu_clave</code></li>
                  <li>3. Reinicia el servidor de desarrollo</li>
                </ol>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button onClick={onRetry} className="gap-2">
                  <RefreshCw size={16} />
                  Reintentar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="gap-2"
                >
                  <Settings size={16} />
                  Ir a Supabase
                </Button>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    );
  }

  // Error genérico
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="max-w-lg w-full">
        <ContentCard>
          <div className="text-center space-y-4">
            <AlertTriangle size={48} className="text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Error de Aplicación
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {error?.message || "Ha ocurrido un error inesperado"}
            </p>
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw size={16} />
              Reintentar
            </Button>
          </div>
        </ContentCard>
      </div>
    </div>
  );
}

export default ConfigurationError;
