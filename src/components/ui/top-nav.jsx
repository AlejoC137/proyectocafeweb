import React from "react";
import { Menu, ShoppingCart, Languages } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ENG, ESP } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { setLenguage } from "../../redux/actions";
import laTaza from "@/assets/TAZA.svg";
import pcLogoWide from "@/assets/proyecto_cafe_logo_wide - copia.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  "WORKISUE": { [ESP]: "Tareas", [ENG]: "Tasks" },
  "STAFF-MANAGER": { [ESP]: "Gestión de Empleados", [ENG]: "Employee Management" },
};

// Componente reutilizable para los botones de íconos
const IconButton = React.forwardRef(({ children, onClick, className = '', ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`p-1.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";

export default function TopNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentLeng = useSelector((state) => state.currentLeng);
  const currentStaff = useSelector((state) => state.currentStaff);
  const location = useLocation();

  const handleLanguageToggle = () => {
    dispatch(setLenguage(currentLeng === ESP ? ENG : ESP));
  };

  const handleGoHome = () => {
    navigate('/MenuView');
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

  const path = location.pathname.toLowerCase();
  const hideDropdown = path === "/menuview";

  const allTabs = [
    { label: "Portal Staff", path: "/" },
    { label: "Work Issues", path: "/WorkIsue" },
    { label: "Manager", path: "/Manager" },
    { label: "Inventario", path: "/Inventario" },
    { label: "Recetas", path: "/Recetas" },
    { label: "Agenda Produccion", path: "/CalendarioProduccio" },
    { label: "Menu Print", path: "/MenuPrint" },
    { label: "Gastos", path: "/Gastos" },
    { label: "Modelos", path: "/Model" },
    { label: "Venta / Compra", path: "/VentaCompra" },
    { label: "Eventos", path: "/Agenda" },
    { label: "Proveedores", path: "/Proveedores" },
    { label: "Codigos de Barra", path: "/Inventario/BarcodeManager" },
    // Tabs anteriormente de admin
    { label: "Staff Manager", path: "/staff-manager" },
    { label: "Nómina", path: "/CalculoNomina" },
    { label: "Pagos", path: "/PagosProveedores" },
    { label: "Día", path: "/DiaResumen" },
    { label: "Mes", path: "/MesResumen" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 shadow-md bg-cream-bg border-sage-green text-not-black">
      <div className="container flex items-center justify-between h-14 px-4">

        {/* Sección Izquierda/Central: Botón + Logo + Título */}
        <div className="flex flex-1 items-center justify-start gap-2 overflow-hidden">
          {!hideDropdown && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton className="bg-light-leaf text-sage-green hover:bg-sage-green hover:text-white shrink-0">
                  <Menu className="h-5 w-5" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 ml-2 bg-cream-bg border-sage-green z-[100]" align="start">
                {allTabs.map((tab) => (
                  <DropdownMenuItem key={tab.path} onClick={() => navigate(tab.path)} className="cursor-pointer font-SpaceGrotesk">
                    {tab.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            onClick={handleGoHome}
            className="transition-transform px-1 flex items-center justify-center shrink-0"
          >
            <img src={pcLogoWide} alt="Proyecto Café Logo" className="h-[28px] md:h-8 w-auto object-contain mix-blend-multiply" />
          </button>

          <div className="flex items-center pl-2 md:pl-3 border-l-2 border-sage-green/50 min-w-0">
            <h1 className="font-SpaceGrotesk font-bold text-sm md:text-base truncate text-gray-700">
              {getDisplayText()}
            </h1>
          </div>
        </div>

        {/* Sección Derecha: Idioma y Carrito */}
        <div className="flex items-center justify-end gap-2 shrink-0 pl-2">
          <button
            onClick={handleLanguageToggle}
            className="px-2 py-1 rounded-md flex items-center gap-1.5 font-bold font-PlaywriteDE text-xs shadow-sm transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-terracotta-accent text-white"
          >
            <Languages className="h-3 w-3" />
            {currentLeng === ESP ? 'EN' : 'ES'}
          </button>

          <IconButton className="bg-cobalt-blue text-white hover:bg-opacity-80">
            <ShoppingCart className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}