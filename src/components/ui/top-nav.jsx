import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ENG, ESP } from "../../redux/actions-types";
import { useDispatch, useSelector } from "react-redux";
import { setLenguage } from "../../redux/actions";
import pcLogoWide from "@/assets/proyecto_cafe_logo_wide - copia.png";

// Mapeo exhaustivo y bilingüe de rutas a títulos
const pageTitles = {
  "": { [ESP]: "Portal de Personal", [ENG]: "Staff Portal" },
  "HOME": { [ESP]: "Inicio", [ENG]: "Home" },
  "MENUVIEW": { [ESP]: "Carta Menú", [ENG]: "Menu" },
  "MENULUNCH": { [ESP]: "Menú Almuerzos", [ENG]: "Lunch Menu" },
  "LUNCHBYORDER": { [ESP]: "Pedidos de Almuerzos", [ENG]: "Lunch Orders" },
  "ANALISISALMUERZO": { [ESP]: "Análisis de Almuerzos", [ENG]: "Lunch Analytics" },
  "BUSCARPRECIOSINTERNET": { [ESP]: "Buscar Precios Web", [ENG]: "Search Prices" },
  "SCRAPER": { [ESP]: "Extractor Web", [ENG]: "Web Scraper" },
  "AGENDA": { [ESP]: "Agenda de Eventos", [ENG]: "Events Agenda" },
  "AGENDAIDEAS": { [ESP]: "Ideas de Eventos", [ENG]: "Event Ideas" },
  "EVENTOSOFFER": { [ESP]: "Oferta de Eventos", [ENG]: "Events Offer" },
  "MANAGER": { [ESP]: "Administrador", [ENG]: "Manager" },
  "RECETAS": { [ESP]: "Recetario Maestro", [ENG]: "Recipe Book" },
  "PLANTA": { [ESP]: "Planta de Producción", [ENG]: "Production Plant" },
  "CALENDARIOPRODUCCION": { [ESP]: "Calendario de Producción", [ENG]: "Production Schedule" },
  "CALCULADORRECETAHELADOS": { [ESP]: "Formulador de Helados (Dubovik)", [ENG]: "Ice Cream Formulator" },
  "SOBRENOSOTROS": { [ESP]: "Sobre Nosotros", [ENG]: "About Us" },
  "REVIEW_PROYECTOCAFE": { [ESP]: "Reseñas del Café", [ENG]: "Reviews" },
  "INVENTARIO": { [ESP]: "Inventario General", [ENG]: "General Inventory" },
  "GESTIONALMACEN": { [ESP]: "Gestión de Almacén", [ENG]: "Warehouse Management" },
  "INVENTARIO/BARCODEMANAGER": { [ESP]: "Códigos de Barra", [ENG]: "Barcode Manager" },
  "BAJAS": { [ESP]: "Gestión de Bajas y Mermas", [ENG]: "Waste & Offboarding" },
  "VENTACOMPRA": { [ESP]: "Ventas y Compras", [ENG]: "Sales & Purchases" },
  "COMPRAS": { [ESP]: "Compras de Insumos", [ENG]: "Supply Purchases" },
  "ACTIVIDADES": { [ESP]: "Bitácora de Actividades", [ENG]: "Activities Log" },
  "GASTOS": { [ESP]: "Control de Gastos", [ENG]: "Expenses" },
  "MENUPRINT": { [ESP]: "Menú para Imprimir", [ENG]: "Printable Menu" },
  "FLYERCREATOR": { [ESP]: "Creador de Flyers", [ENG]: "Flyer Creator" },
  "MENUHEAD": { [ESP]: "Encabezados de Menú", [ENG]: "Menu Headers" },
  "RECRUITMENTPRINT": { [ESP]: "Cartel de Empleo", [ENG]: "Recruitment Poster" },
  "DIARESUMEN": { [ESP]: "Resumen del Día", [ENG]: "Daily Summary" },
  "MESRESUMEN": { [ESP]: "Resumen del Mes", [ENG]: "Monthly Summary" },
  "ACCIONESRAPIDAS": { [ESP]: "Acciones Rápidas (Precios)", [ENG]: "Quick Price Actions" },
  "BOLSILLOS-FINANCIEROS": { [ESP]: "Bolsillos Financieros", [ENG]: "Financial Pockets" },
  "GASTOS-CALCULADOS": { [ESP]: "Costos de Materiales", [ENG]: "Calculated Costs" },
  "PRODUCTOSFINANCIERO": { [ESP]: "Márgenes por Producto", [ENG]: "Product Margins" },
  "MODEL": { [ESP]: "Modelado Financiero", [ENG]: "Financial Model" },
  "MODELOPROYECTO": { [ESP]: "Modelo de Proyecto", [ENG]: "Project Model" },
  "PROVEEDORES": { [ESP]: "Directorio de Proveedores", [ENG]: "Suppliers" },
  "PAGOSPROVEEDORES": { [ESP]: "Pagos a Proveedores", [ENG]: "Supplier Payments" },
  "COTIZACIONES": { [ESP]: "Cotizaciones Comerciales", [ENG]: "Quotes" },
  "CALCULONOMINA": { [ESP]: "Cálculo de Nómina", [ENG]: "Payroll Calculation" },
  "STAFFCREATOR": { [ESP]: "Nuevo Empleado", [ENG]: "New Employee" },
  "STAFF-MANAGER": { [ESP]: "Gestión de Personal", [ENG]: "Staff Management" },
  "STAFF-DETAIL": { [ESP]: "Ficha de Colaborador", [ENG]: "Employee Profile" },
  "TIPSMANAGER": { [ESP]: "Reparto de Propinas", [ENG]: "Tips Management" },
  "CONSUMO": { [ESP]: "Consumo de Staff", [ENG]: "Staff Consumption" },
  "CONSUMOADMIN": { [ESP]: "Auditoría de Consumo", [ENG]: "Staff Consumption Audit" },
  "USER-MANAGER": { [ESP]: "Gestión de Usuarios", [ENG]: "User Accounts" },
  "USERPORTAL": { [ESP]: "Portal de Clientes", [ENG]: "Customer Portal" },
  "ALIADOS": { [ESP]: "Aliados Comerciales", [ENG]: "Business Partners" },
  "ALIADOSEXCEL": { [ESP]: "Planilla de Aliados", [ENG]: "Partners Sheet" },
  "REGISTROALIADO": { [ESP]: "Registro de Aliados", [ENG]: "Partner Registration" },
  "PORTALALIADO": { [ESP]: "Portal de Aliado", [ENG]: "Partner Portal" },
  "RADIO": { [ESP]: "Radio Proyecto Café", [ENG]: "Radio Player" },
  "RADIOMANAGER": { [ESP]: "Gestión de Radio", [ENG]: "Radio Station Manager" },
  "COMANDA": { [ESP]: "Comandas Activas", [ENG]: "Active Orders" },
  "COMANDACREATOR": { [ESP]: "Nueva Comanda", [ENG]: "New Order" },
};

// Componente de botón con estilo neo-brutalista
const IconButton = React.forwardRef(({ children, onClick, className = '', ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`p-1.5 rounded-none border-2 border-black shadow-solid transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-solid-lg active:shadow-none active:translate-y-0.5 active:translate-x-0.5 focus:outline-none ${className}`}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = "IconButton";

// Estructura completa y categorizada de todas las funciones de la plataforma
const MENU_SECTIONS = [
  {
    category: { [ESP]: "Café, Menú & Clientes", [ENG]: "Cafe, Menu & Customers" },
    badgeEmoji: "☕",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    items: [
      { emoji: "☕", label: { [ESP]: "Carta Menú", [ENG]: "Menu View" }, path: "/MenuView", subLabel: { [ESP]: "Vista general del menú", [ENG]: "Full customer menu" } },
      { emoji: "🥪", label: { [ESP]: "Menú Almuerzos", [ENG]: "Lunch Menu" }, path: "/MenuLunch", subLabel: { [ESP]: "Carta especial de almuerzos", [ENG]: "Lunch specials" } },
      { emoji: "📝", label: { [ESP]: "Pedidos de Almuerzo", [ENG]: "Lunch Orders" }, path: "/LunchByOrder", subLabel: { [ESP]: "Toma de pedidos del día", [ENG]: "Order taking" } },
      { emoji: "📊", label: { [ESP]: "Análisis de Almuerzos", [ENG]: "Lunch Analytics" }, path: "/AnalisisAlmuerzo", subLabel: { [ESP]: "Estadísticas y balance", [ENG]: "Stats & metrics" }, isSub: true },
      { emoji: "🏷️", label: { [ESP]: "Portal Clientes", [ENG]: "Customer Portal" }, path: "/UserPortal", subLabel: { [ESP]: "Registro y fidelización", [ENG]: "Client registration" } },
      { emoji: "ℹ️", label: { [ESP]: "Sobre Nosotros", [ENG]: "About Us" }, path: "/SobreNosotros", subLabel: { [ESP]: "Historia y concepto", [ENG]: "History & concept" } },
      { emoji: "⭐", label: { [ESP]: "Reseñas del Café", [ENG]: "Reviews" }, path: "/review_ProyectoCafe", subLabel: { [ESP]: "Opiniones de clientes", [ENG]: "Customer reviews" } },
    ]
  },
  {
    category: { [ESP]: "Operaciones & Comandas", [ENG]: "Operations & Orders" },
    badgeEmoji: "📋",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    items: [
      { emoji: "📋", label: { [ESP]: "Comandas Activas", [ENG]: "Active Orders" }, path: "/Comanda", subLabel: { [ESP]: "Tablero y gestión de órdenes", [ENG]: "Order board & tracking" } },
      { emoji: "➕", label: { [ESP]: "Nueva Comanda", [ENG]: "New Order" }, path: "/ComandaCreator", subLabel: { [ESP]: "Crear comanda de mesa/llevar", [ENG]: "Create table/takeout order" }, isSub: true },
      { emoji: "📌", label: { [ESP]: "Bitácora de Actividades", [ENG]: "Activities Log" }, path: "/Actividades", subLabel: { [ESP]: "Registro diario de turno", [ENG]: "Daily shift activities" } },
      { emoji: "🔍", label: { [ESP]: "Buscar Precios Web", [ENG]: "Search Web Prices" }, path: "/BuscarPreciosInternet", subLabel: { [ESP]: "Comparador de mercado", [ENG]: "Price comparator" } },
      { emoji: "🤖", label: { [ESP]: "Extractor Web (Scraper)", [ENG]: "Web Scraper" }, path: "/Scraper", subLabel: { [ESP]: "Extracción automatizada", [ENG]: "Automated price bot" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Inventario & Almacén", [ENG]: "Inventory & Storage" },
    badgeEmoji: "📦",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    items: [
      { emoji: "📦", label: { [ESP]: "Inventario General", [ENG]: "General Inventory" }, path: "/Inventario", subLabel: { [ESP]: "Stock de insumos y productos", [ENG]: "Supplies & product stock" } },
      { emoji: "🏢", label: { [ESP]: "Gestión de Almacén", [ENG]: "Warehouse Management" }, path: "/GestionAlmacen", subLabel: { [ESP]: "Ubicaciones y control físico", [ENG]: "Physical bin locations" }, isSub: true },
      { emoji: "🏷️", label: { [ESP]: "Códigos de Barra", [ENG]: "Barcode Manager" }, path: "/Inventario/BarcodeManager", subLabel: { [ESP]: "Impresión de etiquetas", [ENG]: "Label printing" }, isSub: true },
      { emoji: "⚙️", label: { [ESP]: "Administrador de Stock", [ENG]: "Stock Manager" }, path: "/Manager", subLabel: { [ESP]: "Ajustes avanzados de catálogo", [ENG]: "Catalog admin" } },
      { emoji: "🗑️", label: { [ESP]: "Gestión de Bajas", [ENG]: "Waste & Offboarding" }, path: "/Bajas", subLabel: { [ESP]: "Control de mermas y descarte", [ENG]: "Waste & scrap logs" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Producción & Recetas", [ENG]: "Production & Recipes" },
    badgeEmoji: "📕",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    items: [
      { emoji: "📕", label: { [ESP]: "Recetario Maestro", [ENG]: "Recipe Book" }, path: "/Recetas", subLabel: { [ESP]: "Fichas técnicas y costos", [ENG]: "Technical recipe cards" } },
      { emoji: "🏭", label: { [ESP]: "Planta de Producción", [ENG]: "Production Plant" }, path: "/Planta", subLabel: { [ESP]: "Fabricación y lotes a escala", [ENG]: "Batch manufacturing" } },
      { emoji: "📅", label: { [ESP]: "Calendario Producción", [ENG]: "Production Schedule" }, path: "/CalendarioProduccion", subLabel: { [ESP]: "Cronograma de preparación", [ENG]: "Kitchen preparation plan" }, isSub: true },
      { emoji: "🍦", label: { [ESP]: "Formulador de Helados", [ENG]: "Ice Cream Formulator" }, path: "/CalculadorRecetaHelados", subLabel: { [ESP]: "Balance Dubovik de heladería", [ENG]: "Dubovik balance tool" } },
      { emoji: "📈", label: { [ESP]: "Predicción de Ventas", [ENG]: "Sales Predictor" }, path: "/Predict/default", subLabel: { [ESP]: "Consumo estimado", [ENG]: "Estimated production" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Finanzas, Caja & Costos", [ENG]: "Finances, Cash & Costs" },
    badgeEmoji: "💰",
    badgeColor: "bg-yellow-100 text-yellow-900 border-yellow-300",
    items: [
      { emoji: "💰", label: { [ESP]: "Venta y Compra", [ENG]: "Sales & Purchases" }, path: "/VentaCompra", subLabel: { [ESP]: "Panel transaccional diario", [ENG]: "Daily transactions" } },
      { emoji: "🌅", label: { [ESP]: "Resumen del Día", [ENG]: "Daily Summary" }, path: "/DiaResumen", subLabel: { [ESP]: "Arqueo y balance de caja", [ENG]: "Daily cash closing" } },
      { emoji: "📆", label: { [ESP]: "Resumen del Mes", [ENG]: "Monthly Summary" }, path: "/MesResumen", subLabel: { [ESP]: "Balance mensual consolidado", [ENG]: "Monthly financial balance" } },
      { emoji: "💸", label: { [ESP]: "Control de Gastos", [ENG]: "Expenses Control" }, path: "/Gastos", subLabel: { [ESP]: "Egresos y facturas varias", [ENG]: "Operational expenses" } },
      { emoji: "🛒", label: { [ESP]: "Registro de Compras", [ENG]: "Supply Purchases" }, path: "/Compras", subLabel: { [ESP]: "Facturas de materia prima", [ENG]: "Raw materials buying" } },
      { emoji: "👛", label: { [ESP]: "Bolsillos Financieros", [ENG]: "Financial Pockets" }, path: "/bolsillos-financieros", subLabel: { [ESP]: "Cuentas y presupuestos", [ENG]: "Budgets and pockets" } },
      { emoji: "🧮", label: { [ESP]: "Costos de Materiales", [ENG]: "Calculated Costs" }, path: "/gastos-calculados", subLabel: { [ESP]: "Análisis de insumos", [ENG]: "Ingredient cost breakdown" }, isSub: true },
      { emoji: "📊", label: { [ESP]: "Márgenes por Producto", [ENG]: "Product Margins" }, path: "/productosFinanciero", subLabel: { [ESP]: "Rentabilidad unitaria", [ENG]: "Profitability by item" }, isSub: true },
      { emoji: "📐", label: { [ESP]: "Modelo de Proyecto", [ENG]: "Project Model" }, path: "/ModeloProyecto", subLabel: { [ESP]: "Proyección y plan financiero", [ENG]: "Financial planning model" }, isSub: true },
      { emoji: "⚡", label: { [ESP]: "Acciones Rápidas", [ENG]: "Quick Price Actions" }, path: "/AccionesRapidas", subLabel: { [ESP]: "Actualizar precios por lote", [ENG]: "Batch price update" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Agenda & Eventos", [ENG]: "Agenda & Events" },
    badgeEmoji: "🗓️",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    items: [
      { emoji: "🗓️", label: { [ESP]: "Calendario de Eventos", [ENG]: "Events Calendar" }, path: "/Agenda", subLabel: { [ESP]: "Fechas y reservas", [ENG]: "Dates & bookings" } },
      { emoji: "💡", label: { [ESP]: "Ideas de Eventos", [ENG]: "Event Ideas" }, path: "/AgendaIdeas", subLabel: { [ESP]: "Planificación creativa", [ENG]: "Brainstorming board" }, isSub: true },
      { emoji: "🤝", label: { [ESP]: "Oferta de Eventos", [ENG]: "Events Proposal" }, path: "/EventosOffer", subLabel: { [ESP]: "Propuestas comerciales", [ENG]: "Event packages" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Proveedores & Cotizaciones", [ENG]: "Suppliers & Quotes" },
    badgeEmoji: "🚚",
    badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
    items: [
      { emoji: "🚚", label: { [ESP]: "Directorio Proveedores", [ENG]: "Suppliers Directory" }, path: "/Proveedores", subLabel: { [ESP]: "Contactos y suministros", [ENG]: "Vendor list" } },
      { emoji: "💳", label: { [ESP]: "Pagos a Proveedores", [ENG]: "Supplier Payments" }, path: "/PagosProveedores", subLabel: { [ESP]: "Cuentas por pagar", [ENG]: "Payables & history" }, isSub: true },
      { emoji: "🧾", label: { [ESP]: "Cotizaciones", [ENG]: "Commercial Quotes" }, path: "/Cotizaciones", subLabel: { [ESP]: "Propuestas a clientes", [ENG]: "Quotes & proposals" } },
    ]
  },
  {
    category: { [ESP]: "Equipo, Staff & Nómina", [ENG]: "Team, Staff & Payroll" },
    badgeEmoji: "👥",
    badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    items: [
      { emoji: "🏠", label: { [ESP]: "Portal de Staff", [ENG]: "Staff Portal" }, path: "/", subLabel: { [ESP]: "Inicio de turno y asistencia", [ENG]: "Shift check-in" } },
      { emoji: "👥", label: { [ESP]: "Gestión de Personal", [ENG]: "Staff Management" }, path: "/staff-manager", subLabel: { [ESP]: "Lista del equipo de trabajo", [ENG]: "Employee roster" } },
      { emoji: "💵", label: { [ESP]: "Cálculo de Nómina", [ENG]: "Payroll Calculation" }, path: "/CalculoNomina", subLabel: { [ESP]: "Liquidación y salarios", [ENG]: "Hours & payroll" }, isSub: true },
      { emoji: "🪙", label: { [ESP]: "Reparto de Propinas", [ENG]: "Tips Management" }, path: "/TipsManager", subLabel: { [ESP]: "Distribución de propinas", [ENG]: "Tips allocation" }, isSub: true },
      { emoji: "🍽️", label: { [ESP]: "Consumo de Staff", [ENG]: "Staff Consumption" }, path: "/consumo", subLabel: { [ESP]: "Registro de consumo propio", [ENG]: "Staff meals & coffee" } },
      { emoji: "🛡️", label: { [ESP]: "Auditoría de Consumo", [ENG]: "Consumption Audit" }, path: "/consumoAdmin", subLabel: { [ESP]: "Control administrativo", [ENG]: "Admin oversight" }, isSub: true },
      { emoji: "🔐", label: { [ESP]: "Gestión de Usuarios", [ENG]: "User Accounts" }, path: "/user-manager", subLabel: { [ESP]: "Cuentas y contraseñas", [ENG]: "Access and roles" } },
    ]
  },
  {
    category: { [ESP]: "Diseño, Cartas e Impresión", [ENG]: "Design, Menus & Print" },
    badgeEmoji: "🖨️",
    badgeColor: "bg-stone-200 text-stone-900 border-stone-400",
    items: [
      { emoji: "🖨️", label: { [ESP]: "Menú para Imprimir", [ENG]: "Printable Menu" }, path: "/MenuPrint", subLabel: { [ESP]: "Generador de cartas físicas", [ENG]: "Paper menu export" } },
      { emoji: "🎨", label: { [ESP]: "Creador de Flyers", [ENG]: "Flyer Creator" }, path: "/FlyerCreator", subLabel: { [ESP]: "Diseñador de publicidad", [ENG]: "Graphic creator" } },
      { emoji: "📑", label: { [ESP]: "Encabezados de Menú", [ENG]: "Menu Headers" }, path: "/MenuHead", subLabel: { [ESP]: "Configuración de secciones", [ENG]: "Header layouts" }, isSub: true },
      { emoji: "📢", label: { [ESP]: "Cartel de Empleo", [ENG]: "Recruitment Poster" }, path: "/RecruitmentPrint", subLabel: { [ESP]: "Imprimible de vacantes", [ENG]: "Job opening poster" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Aliados Comerciales", [ENG]: "Business Partners" },
    badgeEmoji: "🤝",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    items: [
      { emoji: "🤝", label: { [ESP]: "Directorio de Aliados", [ENG]: "Partners Directory" }, path: "/Aliados", subLabel: { [ESP]: "Marcas y colaboradores", [ENG]: "Partner brands" } },
      { emoji: "📊", label: { [ESP]: "Planilla de Aliados", [ENG]: "Partners Spreadsheet" }, path: "/AliadosExcel", subLabel: { [ESP]: "Vista dinámica en tabla", [ENG]: "Excel view" }, isSub: true },
      { emoji: "📝", label: { [ESP]: "Registro de Aliados", [ENG]: "Partner Form" }, path: "/RegistroAliado", subLabel: { [ESP]: "Inscripción de aliados", [ENG]: "Onboarding form" }, isSub: true },
      { emoji: "🌐", label: { [ESP]: "Portal de Aliado", [ENG]: "Partner Portal" }, path: "/PortalAliado", subLabel: { [ESP]: "Acceso directo para partners", [ENG]: "Partner dashboard" }, isSub: true },
    ]
  },
  {
    category: { [ESP]: "Radio Proyecto Café", [ENG]: "Radio & Audio" },
    badgeEmoji: "📻",
    badgeColor: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300",
    items: [
      { emoji: "📻", label: { [ESP]: "Radio en Vivo", [ENG]: "Live Radio Player" }, path: "/Radio", subLabel: { [ESP]: "Reproductor de la cafetería", [ENG]: "Live stream player" } },
      { emoji: "🎛️", label: { [ESP]: "Control de Emisoras", [ENG]: "Radio Manager" }, path: "/RadioManager", subLabel: { [ESP]: "Gestión de streaming remoto", [ENG]: "Remote control panel" }, isSub: true },
    ]
  }
];

export default function TopNav({
  isSidebarPinned: propPinned,
  setIsSidebarPinned: propSetPinned,
  isSidebarOpen: propOpen,
  setIsSidebarOpen: propSetOpen,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentLeng = useSelector((state) => state.currentLeng);
  const currentStaff = useSelector((state) => state.currentStaff);
  const allAgenda = useSelector((state) => state.allAgenda);
  const location = useLocation();

  // Estados locales como fallback si no se pasan por props
  const [internalPinned, setInternalPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('pc_sidebar_pinned');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    } catch (e) {
      return false;
    }
  });

  const [internalOpen, setInternalOpen] = useState(() => {
    try {
      const savedPinned = localStorage.getItem('pc_sidebar_pinned');
      if (savedPinned !== null) return savedPinned === 'true';
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    } catch (e) {
      return false;
    }
  });

  const isPinned = propPinned !== undefined ? propPinned : internalPinned;
  const setIsPinned = propSetPinned || setInternalPinned;
  const isOpen = propOpen !== undefined ? propOpen : internalOpen;
  const setIsOpen = propSetOpen || setInternalOpen;

  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef(null);

  // Guardar posición de scroll continuamente
  const handleScroll = (e) => {
    try {
      sessionStorage.setItem('pc_sidebar_scroll', String(e.currentTarget.scrollTop));
    } catch (err) {}
  };

  // Restaurar posición de scroll al montar, abrir o cambiar de ruta
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const savedScroll = sessionStorage.getItem('pc_sidebar_scroll');
      if (savedScroll !== null) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = Number(savedScroll);
          }
        });
      }
    }
  }, [isOpen, location.pathname]);

  const handleLanguageToggle = () => {
    dispatch(setLenguage(currentLeng === ESP ? ENG : ESP));
  };

  const handleGoHome = () => {
    navigate('/MenuView');
  };

  const getDisplayText = () => {
    const path = location.pathname.toLowerCase();

    if (path.startsWith('/receta/')) {
      return currentLeng === ESP ? "📕 Detalle de Receta" : "📕 Recipe Detail";
    }
    if (path.startsWith('/predict/')) {
      return currentLeng === ESP ? "📈 Predicción de Ventas" : "📈 Sale Prediction";
    }
    if (path.startsWith('/evento/') || path.startsWith('/agendaform/')) {
      const id = path.split('/')[2];
      const ev = allAgenda?.find(a => a._id && a._id.startsWith(id));
      return ev ? `🗓️ ${ev.nombreES || "Evento"}` : (currentLeng === ESP ? "🗓️ Edición de Evento" : "🗓️ Event Editor");
    }
    if (path.startsWith('/inscripcion/')) {
      const id = path.split('/')[2];
      const ev = allAgenda?.find(a => a._id && a._id.startsWith(id));
      return ev ? `🎟️ Inscripción: ${ev.nombreES || "Evento"}` : (currentLeng === ESP ? "🎟️ Inscripción" : "🎟️ Registration");
    }

    const cleanPath = path.replace(/^\//, '').toUpperCase();
    const titleEntry = pageTitles[cleanPath];

    if (titleEntry) {
      return titleEntry[currentLeng];
    }

    return cleanPath ? cleanPath.charAt(0) + cleanPath.slice(1).toLowerCase() : "Proyecto Café";
  };

  const path = location.pathname.toLowerCase();
  // El menú siempre está disponible para el staff; para usuarios anónimos se oculta en páginas públicas de clientes y radio
  const hideDropdown = !currentStaff && (
    path === "/menuview" ||
    path === "/eventosoffer" ||
    path === "/userportal" ||
    path === "/radio" ||
    path === "/proyectoradio" ||
    path.startsWith('/evento/') ||
    path.startsWith('/agendaform/') ||
    path.startsWith('/inscripcion/')
  );

  // Filtrado reactivo por término de búsqueda en español e inglés
  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return MENU_SECTIONS;

    return MENU_SECTIONS.map((section) => {
      const matchingItems = section.items.filter((item) => {
        const titleEs = (item.label[ESP] || "").toLowerCase();
        const titleEn = (item.label[ENG] || "").toLowerCase();
        const subEs = (item.subLabel?.[ESP] || "").toLowerCase();
        const subEn = (item.subLabel?.[ENG] || "").toLowerCase();
        const pathStr = item.path.toLowerCase();
        return titleEs.includes(q) || titleEn.includes(q) || subEs.includes(q) || subEn.includes(q) || pathStr.includes(q);
      });

      if (matchingItems.length === 0) return null;
      return {
        ...section,
        items: matchingItems
      };
    }).filter(Boolean);
  }, [searchTerm]);

  const handleSelectRoute = (targetPath) => {
    // Preservar la posición exacta de scroll para no perder el lugar donde estaba el usuario
    if (scrollContainerRef.current) {
      try {
        sessionStorage.setItem('pc_sidebar_scroll', String(scrollContainerRef.current.scrollTop));
      } catch (err) {}
    }

    // SI LA BARRA ESTÁ FIJADA: NO SE CIERRA. El usuario puede seguir navegando sin perder la vista ni el scroll.
    if (!isPinned) {
      setIsOpen(false);
    }
    navigate(targetPath);
  };

  const togglePin = () => {
    const nextVal = !isPinned;
    setIsPinned(nextVal);
    try {
      localStorage.setItem('pc_sidebar_pinned', String(nextVal));
    } catch (err) {}
    if (nextVal) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* HEADER SUPERIOR FIJO */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 shadow-solid bg-cream-bg border-black text-gray-800">
        <div className="container flex items-center justify-between h-14 px-4">

          {/* Sección Izquierda: Botón Hamburguesa/Toggle + Logo + Título */}
          <div className="flex flex-1 items-center justify-start gap-2 overflow-hidden">
            {!hideDropdown && (
              <IconButton
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Abrir/Cerrar menú persistente"
                className={`p-1.5 shrink-0 flex items-center justify-center font-bold text-base transition-colors ${
                  isOpen ? 'bg-sage-green text-black' : 'bg-light-leaf text-gray-900 hover:bg-sage-green hover:text-white'
                }`}
                title={isOpen ? (isPinned ? "Barra lateral fijada (Haz clic para ocultar)" : "Cerrar barra lateral") : "Abrir barra lateral de navegación"}
              >
                <span className="leading-none text-lg select-none">
                  {isOpen ? (isPinned ? "◀" : "✕") : "☰"}
                </span>
              </IconButton>
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

          {/* Sección Derecha: Idioma, Usuario y Carrito */}
          <div className="flex items-center justify-end gap-2 shrink-0 pl-2">
            <button
              onClick={handleLanguageToggle}
              className="px-2 py-1 border-2 border-black rounded-none flex items-center gap-1.5 font-bold font-SpaceGrotesk text-xs shadow-solid transition-all duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-solid-lg active:shadow-none active:translate-y-0.5 active:translate-x-0.5 bg-terracotta-accent text-white"
            >
              <span className="text-sm">🌐</span>
              {currentLeng === ESP ? 'EN' : 'ES'}
            </button>

            <IconButton 
              onClick={() => {
                if (currentStaff) {
                  if (window.confirm(currentLeng === ESP ? "¿Deseas cerrar sesión?" : "Do you want to log out?")) {
                    dispatch({ type: 'SET_CURRENT_STAFF', payload: null });
                    localStorage.removeItem("staffFoundId");
                    navigate('/');
                  }
                }
              }}
              className="bg-purple-600 text-white hover:bg-opacity-80 flex items-center justify-center relative min-w-[32px]"
              title={currentStaff ? (currentLeng === ESP ? `Sesión iniciada como ${currentStaff.Nombre}` : `Logged in as ${currentStaff.Nombre}`) : (currentLeng === ESP ? "Iniciar Sesión" : "Login")}
            >
              {currentStaff ? (
                <span className="font-bold text-xs font-SpaceGrotesk px-0.5">{currentStaff.Nombre?.charAt(0) || "U"}</span>
              ) : (
                <span className="text-sm select-none">👤</span>
              )}
            </IconButton>

            <IconButton 
              onClick={() => navigate('/MenuView')}
              className="bg-cobalt-blue text-white hover:bg-opacity-80 flex items-center justify-center min-w-[32px]"
              title={currentLeng === ESP ? "Ver Menú / Pedidos" : "View Menu / Orders"}
            >
              <span className="text-sm select-none">🛒</span>
            </IconButton>
          </div>
        </div>
      </header>

      {/* OVERLAY DE SOMBRA (Solo en móvil o cuando la barra NO está fijada en escritorio) */}
      {!hideDropdown && isOpen && !isPinned && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 top-14 bg-black/40 z-30 transition-opacity backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}

      {/* BARRA LATERAL PERSISTENTE (DRAWER / DOCKED SIDEBAR) */}
      {!hideDropdown && (
        <aside
          className={`fixed top-14 bottom-0 left-0 z-40 w-80 bg-cream-bg border-r-2 border-black shadow-solid-lg flex flex-col font-SpaceGrotesk transition-transform duration-200 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ willChange: "transform" }}
        >
          {/* Cabecera de la Barra Lateral: Título, Botón Fijar y Botón Cerrar */}
          <div className="bg-cream-bg border-b-2 border-black p-3 space-y-2 shrink-0 z-10">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide text-gray-900 truncate">
                <span>☕</span>
                <span>{currentLeng === ESP ? "Explorador" : "Navigator"}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* BOTÓN PARA FIJAR / DESFIJAR LA BARRA (PERSISTENCIA TOTAL) */}
                <button
                  type="button"
                  onClick={togglePin}
                  className={`px-2 py-0.5 text-xs font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-0.5 ${
                    isPinned
                      ? "bg-sage-green text-black"
                      : "bg-white hover:bg-cream-bg text-gray-700"
                  }`}
                  title={
                    isPinned
                      ? (currentLeng === ESP ? "Barra fijada: No se cierra al hacer clic. Pulsa para desfijar." : "Pinned sidebar: Stays open when clicking. Click to unpin.")
                      : (currentLeng === ESP ? "Fijar barra: Haz clic para que quede fija y no se cierre." : "Pin sidebar: Click to keep it docked.")
                  }
                >
                  {isPinned ? "📌 Fijada" : "📍 Fijar"}
                </button>

                {/* BOTÓN CERRAR BARRA */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2 py-0.5 text-xs font-bold border-2 border-black bg-white hover:bg-terracotta-accent hover:text-white rounded-none shadow-[2px_2px_0px_#000] transition-all"
                  title={currentLeng === ESP ? "Cerrar barra lateral" : "Close sidebar"}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BUSCADOR EN TIEMPO REAL */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={currentLeng === ESP ? "🔍 Buscar ruta o módulo..." : "🔍 Search path or module..."}
                className="w-full text-xs font-SpaceGrotesk px-2.5 py-1.5 border-2 border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-500 shadow-[2px_2px_0px_#000]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1.5 text-xs text-gray-500 hover:text-black font-bold"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* LISTA DE FUNCIONES Y RUTAS CON SCROLL PERSISTENTE */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-2 space-y-3 font-SpaceGrotesk"
          >
            {filteredSections.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                {currentLeng === ESP ? "No se encontraron funciones para esa búsqueda." : "No matching features found."}
              </div>
            ) : (
              filteredSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {/* Encabezado de Categoría */}
                  <div className="flex items-center gap-1.5 px-2 py-1 select-none">
                    <span className="text-sm">{section.badgeEmoji}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {section.category[currentLeng]}
                    </span>
                    <div className="flex-1 border-b border-gray-300 ml-1"></div>
                  </div>

                  {/* Lista de Rutas */}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isCurrent = location.pathname.toLowerCase() === item.path.toLowerCase();
                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => handleSelectRoute(item.path)}
                          className={`w-full text-left flex items-start gap-2.5 px-2.5 py-1.5 rounded-none border border-transparent transition-all select-none ${
                            isCurrent
                              ? "bg-sage-green text-black font-bold border-black shadow-[2px_2px_0px_#000]"
                              : "hover:bg-white hover:border-black hover:shadow-[2px_2px_0px_#000] text-gray-800"
                          } ${item.isSub ? "ml-3.5 pl-2 border-l-2 border-l-sage-green/60" : ""}`}
                        >
                          <span className="text-base shrink-0 leading-tight">
                            {item.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold truncate leading-snug">
                                {item.label[currentLeng]}
                              </span>
                              {item.isSub && (
                                <span className="text-[10px] text-gray-500 font-mono ml-1 opacity-70">
                                  sub
                                </span>
                              )}
                            </div>
                            {item.subLabel && (
                              <p className="text-[10px] text-gray-500 truncate leading-none mt-0.5">
                                {item.subLabel[currentLeng]}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PIE DE LA BARRA LATERAL */}
          <div className="bg-cream-bg border-t-2 border-black p-2 text-center text-[11px] text-gray-600 font-mono shrink-0">
            {currentStaff ? (
              <span className="text-emerald-800 font-bold">
                🟢 {currentStaff.Nombre} ({currentStaff.Rol || "Staff"})
              </span>
            ) : (
              <span>☕ Proyecto Café Web</span>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
