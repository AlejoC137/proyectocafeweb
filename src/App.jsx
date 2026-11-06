import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import TopNav from './components/ui/top-nav';
import ErrorBoundary from './components/ui/ErrorBoundary';
import GlobalAuthModal from './components/GlobalAuthModal';
import supabase from './config/supabaseClient';

// --- Lazy imports: cada ruta se carga solo cuando se navega a ella ---
const MenuView = lazy(() => import('./body/views/menuView/MenuView'));
const MenuLunch = lazy(() => import('./body/views/menuView/MenuLunch'));
const LunchByOrder = lazy(() => import('./body/views/lunchByOrder/LunchByOrder'));
const BuscarPreciosInternet = lazy(() => import('./body/views/buscarPreciosInternet/BuscarPreciosInternet'));
const Manager = lazy(() => import('./body/views/inventario/Manager'));
const AgendaIdeas = lazy(() => import('./body/views/agenda/AgendaIdeas'));
const Agenda = lazy(() => import('./body/views/agenda/Agenda'));
const Recetas = lazy(() => import('./body/views/ventaCompra/Recetas'));
const SobreNosotros = lazy(() => import('./body/views/sobreNosotros/SobreNosotros'));
const Scraper = lazy(() => import('../scraper/scraper'));
const StaffPortal = lazy(() => import('./body/views/staff/staffPortal'));
const Inventario = lazy(() => import('./body/views/inventario/Inventario'));
const GestionAlmacen = lazy(() => import('./body/views/inventario/GestionAlmacen'));
const BarcodeManager = lazy(() => import('./body/views/inventario/BarcodeManager'));
const VentaCompra = lazy(() => import('./body/views/ventaCompra/VentaCompra'));
const Actividades = lazy(() => import('./body/views/actividades/Actividades'));
const Gastos = lazy(() => import('./body/components/gastos/Gastos'));
const Compras = lazy(() => import('./body/views/ventaCompra/Compras'));
const MenuPrintManager = lazy(() => import('./body/components/Menu/MenuPrintManager'));
const MenuHead = lazy(() => import('./body/components/Menu/MenuHead'));
const DiaResumen = lazy(() => import('./body/views/ventaCompra/DiaResumen'));
const MesResumen = lazy(() => import('./body/views/ventaCompra/MesResumen'));
const AccionesRapidas = lazy(() => import('./body/views/actualizarPrecioUnitario/AccionesRapidas'));
const ComandaExcelView = lazy(() => import('./body/views/actividades/WorkE/ComandaExcelView'));
const ComandaModal = lazy(() => import('./body/components/Comanda/ComandaModal'));
const CalendarioProduccion = lazy(() => import('./body/views/actividades/CalendarioProduccion'));
const ComandaCreator = lazy(() => import('./body/views/actividades/ComandaCreator'));
const Proveedores = lazy(() => import('./body/views/proveedores/Proveedores'));
const PagosProveedores = lazy(() => import('./body/views/proveedores/PagosProveedores'));
const StaffCreator = lazy(() => import('./body/views/actividades/StaffCreator'));
const RecetaModal = lazy(() => import('./body/views/ventaCompra/RecetaModal'));
const ItemsModal = lazy(() => import('./body/components/Items/ItemsModal'));
const ItemMenuModal = lazy(() => import('./body/components/Menu/ItemMenuModal'));
const ProcedimientoModal = lazy(() => import('./body/views/ventaCompra/ProcedimientoModal'));
const InscripcionEvento = lazy(() => import('./body/views/agenda/InscripcionEvento'));
const AgendaFormPage = lazy(() => import('./body/views/agenda/AgendaFormPage'));
const Predict = lazy(() => import('./body/views/ventaCompra/Predict'));
const CalculoNomina = lazy(() => import('./body/views/staff/CalculoNomina'));
const StaffDetailView = lazy(() => import('./body/views/staff/StaffDetailView'));
const StaffManager = lazy(() => import('./body/views/staff/StaffManager'));
const UserManager = lazy(() => import('./body/views/staff/UserManager'));
const UserPortal = lazy(() => import('./body/views/user/UserPortal'));
const EventosOffer = lazy(() => import('./body/views/agenda/EventosOffer'));
const EditarTurnosView = lazy(() => import('./body/views/staff/EditarTurnosView'));
const TipsManager = lazy(() => import('./body/views/staff/TipsManager'));
const Model = lazy(() => import('./body/views/ventaCompra/Model'));
const ModeloProyecto = lazy(() => import('./body/views/ventaCompra/ModeloProyecto'));
const GastosCalculadosMateriales = lazy(() => import('./body/views/ventaCompra/GastosCalculadosMateriales'));
const ProductosFinanciero = lazy(() => import('./body/views/ventaCompra/ProductosFinanciero'));
const Rappi = lazy(() => import('./body/views/rappi/Rappi'));
const RecruitmentPrint = lazy(() => import('./body/components/Menu/RecruitmentPrint'));
const ConsumoStaffView = lazy(() => import('./body/views/staff/ConsumoStaffView'));
const ConsumoAdminView = lazy(() => import('./body/views/staff/ConsumoAdminView'));
const FlyerCreator = lazy(() => import('./body/components/Menu/FlyerCreator/FlyerCreator'));

const CotizacionesView = lazy(() => import('./body/views/cotizaciones/CotizacionesView'));
const AliadosManager = lazy(() => import('./body/views/aliados/AliadosManager'));
const AliadosExcelView = lazy(() => import('./body/views/aliados/AliadosExcelView'));
const AliadoRegistrationForm = lazy(() => import('./body/views/aliados/AliadoRegistrationForm'));
const AliadoPortal = lazy(() => import('./body/views/aliados/AliadoPortal'));
const AnalisisAlmuerzo = lazy(() => import('./body/views/lunchByOrder/AnalisisAlmuerzo'));
const ReviewProyectoCafe = lazy(() => import('./body/views/reviewProyectoCafe/ReviewProyectoCafe'));
const CalculadorRecetaHelados = lazy(() => import('./body/views/ventaCompra/CalculadorRecetaHelados'));
const BajasManager = lazy(() => import('./body/views/bajas/BajasManager'));
const PlantaProduccion = lazy(() => import('./body/views/planta/PlantaProduccion'));
const BolsillosFinancieros = lazy(() => import('./body/views/ventaCompra/BolsillosFinancieros'));

const ProyectoRadio = lazy(() => import('./components/ProyectoRadio'));
const RadioManager = lazy(() => import('./components/RadioManager'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center text-white text-xl font-SpaceGrotesk font-light">Cargando...</div>
  </div>
);

function App() {
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('pc_sidebar_pinned');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    } catch (e) {
      return false;
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const savedPinned = localStorage.getItem('pc_sidebar_pinned');
      if (savedPinned !== null) return savedPinned === 'true';
      return typeof window !== 'undefined' && window.innerWidth >= 1024;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    // Escuchador BroadcastChannel local entre pestañas
    let bc;
    try {
      bc = new BroadcastChannel('radio-reload-channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'FORCE_RELOAD') {
          window.location.reload();
        }
      };
    } catch (e) {}

    // Escuchador Supabase Realtime (WebSockets + DB change)
    const channel = supabase
      .channel('app-global-reload-listener')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'radio_current_play',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new?.station_name === 'FORCE_RELOAD') {
            window.location.reload();
          }
        }
      )
      .on('broadcast', { event: 'FORCE_RELOAD' }, () => {
        window.location.reload();
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <GlobalAuthModal>
      <div className='flex w-full min-h-screen relative bg-cream-bg text-darker-on-cream font-sans'>
        <div className="relative z-10 w-full overflow-x-hidden min-h-screen flex flex-col">
          <TopNav
            isSidebarPinned={isSidebarPinned}
            setIsSidebarPinned={setIsSidebarPinned}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <ErrorBoundary section="Aplicación">
            <Suspense fallback={<PageLoader />}>
              <div className={`flex-1 flex flex-col pt-14 transition-all duration-200 ${isSidebarPinned && isSidebarOpen ? 'md:pl-80' : ''}`}>
                <Routes>
                  {/* --- CAFÉ, MENÚ & CLIENTES --- */}
                  <Route path="/" element={<StaffPortal />} />
                  <Route path="/MenuView" element={<MenuView />} />
                  <Route path="/Home" element={<Navigate to="/MenuView" replace />} />
                  <Route path="/MenuLunch" element={<MenuLunch />} />
                  <Route path="/LunchByOrder" element={<LunchByOrder />} />
                  <Route path="/AnalisisAlmuerzo" element={<AnalisisAlmuerzo />} />
                  <Route path="/UserPortal" element={<UserPortal />} />
                  <Route path="/UserPortal/Registro" element={<Navigate to="/UserPortal" replace />} />
                  <Route path="/SobreNosotros" element={<SobreNosotros />} />
                  <Route path="/review_ProyectoCafe" element={<ReviewProyectoCafe />} />

                  {/* --- DISEÑO, CARTAS E IMPRESIÓN --- */}
                  <Route path="/MenuPrint" element={<MenuPrintManager />} />
                  <Route path="/MenuPrint/:menuId" element={<MenuPrintManager />} />
                  <Route path="/MenuPrintHorizontal" element={<Navigate to="/MenuPrint" replace />} />
                  <Route path="/MenuHead" element={<MenuHead />} />
                  <Route path="/FlyerCreator" element={<FlyerCreator />} />
                  <Route path="/RecruitmentPrint" element={<RecruitmentPrint />} />

                  {/* --- OPERACIONES, TAREAS Y COMANDAS --- */}
                  <Route path="/Comanda" element={<ComandaExcelView />} />
                  <Route path="/ComandaCreator" element={<ComandaCreator />} />
                  <Route path="/Actividades" element={<Actividades />} />
                  <Route path="/BuscarPreciosInternet" element={<BuscarPreciosInternet />} />
                  <Route path="/Scraper" element={<Scraper />} />

                  {/* --- INVENTARIO, ALMACÉN Y MERMAS --- */}
                  <Route path="/Inventario/:tab?" element={<Inventario />} />
                  <Route path="/GestionAlmacen/:tab?" element={<GestionAlmacen />} />
                  <Route path="/Inventario/BarcodeManager" element={<BarcodeManager />} />
                  <Route path="/Manager/:tab?" element={<Manager />} />
                  <Route path="/Bajas" element={<BajasManager />} />
                  <Route path="/bajas" element={<Navigate to="/Bajas" replace />} />

                  {/* --- RECETAS, PRODUCCIÓN Y HELADERÍA --- */}
                  <Route path="/Recetas" element={<Recetas />} />
                  <Route path="/Planta" element={<PlantaProduccion />} />
                  <Route path="/planta" element={<Navigate to="/Planta" replace />} />
                  <Route path="/CalendarioProduccion" element={<CalendarioProduccion />} />
                  <Route path="/CalendarioProduccio" element={<Navigate to="/CalendarioProduccion" replace />} />
                  <Route path="/CalculadorRecetaHelados" element={<CalculadorRecetaHelados />} />
                  <Route path="/Predict/:MenuItem" element={<Predict />} />

                  {/* --- VENTAS, COMPRAS Y FINANZAS --- */}
                  <Route path="/VentaCompra" element={<VentaCompra />} />
                  <Route path="/Compras" element={<Compras />} />
                  <Route path="/Gastos" element={<Gastos />} />
                  <Route path="/DiaResumen" element={<DiaResumen />} />
                  <Route path="/DiaResumen/:date" element={<DiaResumen />} />
                  <Route path="/MesResumen" element={<MesResumen />} />
                  <Route path="/AccionesRapidas" element={<AccionesRapidas />} />
                  <Route path="/bolsillos-financieros" element={<BolsillosFinancieros />} />
                  <Route path="/BolsillosFinancieros" element={<Navigate to="/bolsillos-financieros" replace />} />
                  <Route path="/admin/bolsillos-financieros" element={<Navigate to="/bolsillos-financieros" replace />} />
                  <Route path="/gastos-calculados" element={<GastosCalculadosMateriales />} />
                  <Route path="/productosFinanciero" element={<ProductosFinanciero />} />
                  <Route path="/Rappi/:tab?" element={<Rappi />} />
                  <Route path="/Model" element={<Model />} />
                  <Route path="/ModeloProyecto" element={<ModeloProyecto />} />
                  <Route path="/ModeloProyecto/:year/:month" element={<ModeloProyecto />} />

                  {/* --- AGENDA Y EVENTOS --- */}
                  <Route path="/Agenda/:year?/:month?" element={<Agenda />} />
                  <Route path="/AgendaIdeas" element={<AgendaIdeas />} />
                  <Route path="/EventosOffer" element={<EventosOffer />} />
                  <Route path="/evento/:id/:tab?" element={<AgendaFormPage />} />
                  <Route path="/agendaForm/:id" element={<Navigate to="/evento/:id" replace />} />
                  <Route path="/inscripcion/:id" element={<InscripcionEvento />} />

                  {/* --- PROVEEDORES Y COTIZACIONES --- */}
                  <Route path="/Proveedores" element={<Proveedores />} />
                  <Route path="/PagosProveedores" element={<PagosProveedores />} />
                  <Route path="/Cotizaciones" element={<CotizacionesView />} />

                  {/* --- EQUIPO Y STAFF --- */}
                  <Route path="/StaffCreator" element={<StaffCreator />} />
                  <Route path="/CalculoNomina" element={<CalculoNomina />} />
                  <Route path="/staff-manager" element={<StaffManager />} />
                  <Route path="/staff-detail" element={<StaffDetailView />} />
                  <Route path="/staff-details/:cc" element={<StaffDetailView />} />
                  <Route path="/staff-manager/:cc" element={<Navigate to="/staff-details/:cc" replace />} />
                  <Route path="/staff-manager/:cc/editar-turnos" element={<EditarTurnosView />} />
                  <Route path="/TipsManager" element={<TipsManager />} />
                  <Route path="/staff-manager/tips" element={<Navigate to="/TipsManager" replace />} />
                  <Route path="/consumo" element={<ConsumoStaffView />} />
                  <Route path="/consumoAdmin" element={<ConsumoAdminView />} />
                  <Route path="/user-manager" element={<UserManager />} />

                  {/* --- ALIADOS COMERCIALES --- */}
                  <Route path="/Aliados" element={<AliadosManager />} />
                  <Route path="/AliadosExcel" element={<AliadosExcelView />} />
                  <Route path="/AliadosExcel text-excel" element={<Navigate to="/AliadosExcel" replace />} />
                  <Route path="/RegistroAliado" element={<AliadoRegistrationForm />} />
                  <Route path="/PortalAliado" element={<AliadoPortal />} />

                  {/* --- RADIO PROYECTO CAFÉ --- */}
                  <Route path="/Radio" element={<ProyectoRadio />} />
                  <Route path="/radio" element={<Navigate to="/Radio" replace />} />
                  <Route path="/ProyectoRadio" element={<Navigate to="/Radio" replace />} />
                  <Route path="/proyectoradio" element={<Navigate to="/Radio" replace />} />
                  <Route path="/RadioManager" element={<RadioManager />} />
                  <Route path="/radiomanager" element={<Navigate to="/RadioManager" replace />} />

                  {/* --- MODALES Y VISTAS DE DETALLE POR ID --- */}
                  <Route path="/receta/:id" element={<RecetaModal />} />
                  <Route path="/item/:id" element={<ItemsModal />} />
                  <Route path="/menu-item/:id" element={<ItemMenuModal />} />
                  <Route path="/item-menu/:id" element={<Navigate to="/menu-item/:id" replace />} />
                  <Route path="/comanda/:id" element={<ComandaModal />} />
                  <Route path="/ProcedimientoModal/:id" element={<ProcedimientoModal />} />

                  {/* --- 404 NOT FOUND --- */}
                  <Route path="*" element={<div className="text-center p-8 text-white text-2xl font-SpaceGrotesk">Página no encontrada</div>} />
                </Routes>
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </GlobalAuthModal>
  );
}

export default App;