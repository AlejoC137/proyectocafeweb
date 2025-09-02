import React from "react";
import { Menu, ShoppingCart, Languages } from "lucide-react"; // Añadido 'Languages' que faltaba
import { useLocation, useNavigate } from "react-router-dom";
import { ENG, ESP } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { setLenguage } from "../../redux/actions";
import laTaza from "@/assets/TAZA.svg";
export default function TopNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Se usa el estado de Redux para el idioma
  const currentLeng = useSelector((state) => state.currentLeng);
  const location = useLocation();

  /**
   * Función para cambiar el estado del idioma en Redux.
   */
  const handleLanguageToggle = () => {
    // Despacha la acción para cambiar el idioma en el store de Redux
    dispatch(setLenguage(currentLeng === ESP ? ENG : ESP));
  };

  /**
   * Función para navegar a la página de inicio
   */
  const handleGoHome = () => {
    navigate('/');
  };

  /**
   * Determina el texto a mostrar en la barra de navegación superior
   * basándose en la ruta actual de la URL y el estado del idioma de Redux.
   * @returns {string} El título de la página actual, traducido.
   */
  const getDisplayText = () => {
    const path = location.pathname.toLowerCase();

    // Se reemplazó 'language' por 'currentLeng'
    if (path.startsWith('/receta/')) {
        return currentLeng === ESP ? "Detalle de Receta" : "Recipe Detail";
    }
    if (path.startsWith('/predict/')) {
        return currentLeng === ESP ? "Predicción de Venta" : "Sale Prediction";
    }

    const viewFromUrl = path.substring(1).toUpperCase();

    // Se reemplazó 'language' por 'currentLeng' en todo el switch
    switch (viewFromUrl) {
      case "":
        return currentLeng === ESP ? "Portal de Personal" : "Staff Portal";
      case "HOME":
        return currentLeng === ESP ? "Inicio" : "Home";
      case "MENUVIEW":
        return currentLeng === ESP ? "Menú" : "Menu";
      case "LUNCHBYORDER":
        return currentLeng === ESP ? "Almuerzos" : "Lunches";
      case "BUSCARPRECIOSINTERNET":
        return currentLeng === ESP ? "Buscar Precios" : "Search Prices";
      case "AGENDA":
        return currentLeng === ESP ? "Agenda" : "Agenda";
      case "MANAGER":
        return currentLeng === ESP ? "Administrador" : "Manager";
      case "SOBRENOSOTROS":
        return currentLeng === ESP ? "Nosotros" : "About Us";
      case "SCRAPER":
        return currentLeng === ESP ? "Extractor Web" : "Web Scraper";
      case "INVENTARIO":
        return currentLeng === ESP ? "Inventario" : "Inventory";
      case "VENTACOMPRA":
        return currentLeng === ESP ? "Ventas y Compras" : "Sales & Purchases";
      case "ACTIVIDADES":
        return currentLeng === ESP ? "Actividades" : "Activities";
      case "GASTOS":
        return currentLeng === ESP ? "Gastos" : "Expenses";
      case "MENUPRINT":
        return currentLeng === ESP ? "Menú para Imprimir" : "Printable Menu";
      case "DIARESUMEN":
        return currentLeng === ESP ? "Resumen del Día" : "Daily Summary";
      case "MESRESUMEN":
        return currentLeng === ESP ? "Resumen del Mes" : "Monthly Summary";
      case "ACCIONESRAPIDAS":
        return currentLeng === ESP ? "Acciones Rápidas" : "Quick Actions";
      case "PROVEEDORES":
        return currentLeng === ESP ? "Proveedores" : "Suppliers";
      case "CALCULONOMINA":
        return currentLeng === ESP ? "Cálculo de Nómina" : "Payroll Calculation";
      default:
        return viewFromUrl.charAt(0) + viewFromUrl.slice(1).toLowerCase();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-cream-bg border-b-2 border-sage-green shadow-md z-50">
      {/* Primera fila: Logo y controles */}
      <div className="h-10 flex items-center justify-between px-4">
        <button className="p-1.5 rounded-lg bg-sage-green/20 hover:bg-sage-green/30 transition-colors">
          <Menu className="h-5 w-5 text-sage-green" />
        </button>
        <div className="flex items-center gap-2">
  <button 
          onClick={handleGoHome}
          className="font-SpaceGrotesk text-lg font-bold text-cobalt-blue hover:text-sage-green transition-colors cursor-pointer flex items-center gap-0"
        >
          <img src={laTaza} alt="la taza" className="w-6 h-6 inline" />
          PC 
        </button>


                <div className="h-8 flex items-center justify-center px-4 bg-gradient-to-r from-light-leaf/30 to-transparent">
        <h1 className="font-SpaceGrotesk font-bold text-sm text-gray-700 truncate">{getDisplayText()}</h1>
      </div>
        </div>
      
        <div className="flex items-center gap-2">
          {/* Botón para cambiar el isdioma */}
          <button 
            onClick={handleLanguageToggle} 
            className="px-2 py-1 rounded-md bg-terracotta-pink hover:bg-terracotta-pink/80 flex items-center gap-1 font-bold font-PlaywriteDE text-white transition-colors shadow-sm text-xs"
          >
            <Languages className="h-3 w-3" />
            {currentLeng === ESP ? 'ENG' : 'ESP'}
          </button>

          <button className="p-1.5 rounded-lg bg-cobalt-blue hover:bg-cobalt-blue/80 transition-colors shadow-sm">
            <ShoppingCart className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Segunda fila: Información del sitio */}

    </div>
  );
}
