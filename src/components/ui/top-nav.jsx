import React from "react";
import { Menu, ShoppingCart, Languages } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ENG, ESP } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { setLenguage } from "../../redux/actions";
import laTaza from "@/assets/TAZA.svg";

// Objeto para mapear rutas a títulos. Es más limpio y escalable que un switch.
const pageTitles = {
  "": { [ESP]: "Portal de Personal", [ENG]: "Staff Portal" },
  "HOME": { [ESP]: "Inicio", [ENG]: "Home" },
  "MENUVIEW": { [ESP]: "Menú", [ENG]: "Menu" },
  "LUNCHBYORDER": { [ESP]: "Almuerzos", [ENG]: "Lunches" },
  "BUSCARPRECIOSINTERNET": { [ESP]: "Buscar Precios", [ENG]: "Search Prices" },
  "AGENDA": { [ESP]: "Agenda", [ENG]: "Agenda" },
  "MANAGER": { [ESP]: "Administrador", [ENG]: "Manager" },
  "SOBRENOSOTROS": { [ESP]: "Nosotros", [ENG]: "About Us" },
  "SCRAPER": { [ESP]: "Extractor Web", [ENG]: "Web Scraper" },
  "INVENTARIO": { [ESP]: "Inventario", [ENG]: "Inventory" },
  "VENTACOMPRA": { [ESP]: "Ventas y Compras", [ENG]: "Sales & Purchases" },
  "ACTIVIDADES": { [ESP]: "Actividades", [ENG]: "Activities" },
  "GASTOS": { [ESP]: "Gastos", [ENG]: "Expenses" },
  "MENUPRINT": { [ESP]: "Menú para Imprimir", [ENG]: "Printable Menu" },
  "DIARESUMEN": { [ESP]: "Resumen del Día", [ENG]: "Daily Summary" },
  "MESRESUMEN": { [ESP]: "Resumen del Mes", [ENG]: "Monthly Summary" },
  "ACCIONESRAPIDAS": { [ESP]: "Acciones Rápidas", [ENG]: "Quick Actions" },
  "PROVEEDORES": { [ESP]: "Proveedores", [ENG]: "Suppliers" },
  "CALCULONOMINA": { [ESP]: "Cálculo de Nómina", [ENG]: "Payroll Calculation" },
};

// Componente reutilizable para los botones de íconos
const IconButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
  >
    {children}
  </button>
);

export default function TopNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentLeng = useSelector((state) => state.currentLeng);
  const location = useLocation();

  const handleLanguageToggle = () => {
    dispatch(setLenguage(currentLeng === ESP ? ENG : ESP));
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getDisplayText = () => {
    const path = location.pathname.toLowerCase();

    if (path.startsWith('/receta/')) {
      return currentLeng === ESP ? "Detalle de Receta" : "Recipe Detail";
    }
    if (path.startsWith('/predict/')) {
      return currentLeng === ESP ? "Predicción de Venta" : "Sale Prediction";
    }

    const viewFromUrl = path.substring(1).toUpperCase();
    const titleEntry = pageTitles[viewFromUrl];
    
    if (titleEntry) {
      return titleEntry[currentLeng];
    }
    
    // Fallback para rutas no definidas en el objeto
    return viewFromUrl.charAt(0) + viewFromUrl.slice(1).toLowerCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 shadow-md bg-cream-bg border-sage-green text-not-black">
      <div className="container flex items-center justify-between h-14 px-4">
        
        {/* Sección Izquierda: Botón de Menú */}
        <div className="w-1/3 flex justify-start">
          <IconButton className="bg-light-leaf text-sage-green hover:bg-sage-green hover:text-white">
            <Menu className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Sección Central: Logo y Título de la Página */}
        <div className="w-1/3 flex items-center justify-center gap-2">
          <button
            onClick={handleGoHome}
            className="font-SpaceGrotesk text-lg font-bold text-cobalt-blue transition-transform hover:scale-105 flex items-center gap-1 shrink-0"
          >
            <img src={laTaza} alt="La Taza Logo" className="w-6 h-6" />
            <span>PC</span>
          </button>
          
          <div className="h-full flex items-center pl-4 border-l border-sage-green/50">
            <h1 className="font-SpaceGrotesk font-bold text-sm truncate text-gray-700">
              {getDisplayText()}
            </h1>
          </div>
        </div>

        {/* Sección Derecha: Idioma y Carrito */}
        <div className="w-1/3 flex items-center justify-end gap-2">
          <button
            onClick={handleLanguageToggle}
            className="px-2 py-1 rounded-md flex items-center gap-1.5 font-bold font-PlaywriteDE text-xs shadow-sm transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-terracotta-pink text-white"
          >
            <Languages className="h-3 w-3" />
            {currentLeng === ESP ? 'ENG' : 'ESP'}
          </button>
          
          <IconButton className="bg-cobalt-blue text-white hover:bg-opacity-80">
            <ShoppingCart className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}