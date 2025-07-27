import React from "react";
import { Menu, ShoppingCart, Languages } from "lucide-react"; // Añadido 'Languages' que faltaba
import { useLocation } from "react-router-dom";
import { ENG, ESP } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { setLenguage } from "../../redux/actions";

export default function TopNav() {
  const dispatch = useDispatch();
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
    <div
      className="fixed top-0 left-0 font-LilitaOne right-0 h-12 flex items-center text-lg justify-between px-4 border-b-2 bg-white z-50"
    >
      <button className="p-2 rounded-md bg-white">
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>
      
      <h1 className="font-LilitaOne text-xl">Proyecto Café</h1>
      <h1 className="font-bold text-xl">{getDisplayText()}</h1>

      <div className="flex items-center gap-2">
        {/* Botón para cambiar el idioma */}
        <button onClick={handleLanguageToggle} className="p-2 rounded-md bg-white flex items-center gap-1 font-semibold">
          <Languages className="h-5 w-5 font-LilitaOne text-gray-700 dark:text-gray-300" />
          {/* Se reemplazó 'language' por 'currentLeng' */}
          {currentLeng === ESP ? 'ENG' : 'ESP'}
        </button>

        <button className="p-2 rounded-md bg-white">
          <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}
