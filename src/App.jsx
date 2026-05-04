import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import fondoImage from './assets/fondo.png';
import TopNav from './components/ui/top-nav';
import ErrorBoundary from './components/ui/ErrorBoundary';

// --- Lazy imports: cada ruta se carga solo cuando se navega a ella ---
const MenuView             = lazy(() => import('./body/views/menuView/MenuView'));
const MenuLunch            = lazy(() => import('./body/views/menuView/MenuLunch'));
const LunchByOrder         = lazy(() => import('./body/views/lunchByOrder/LunchByOrder'));
const BuscarPreciosInternet= lazy(() => import('./body/views/buscarPreciosInternet/BuscarPreciosInternet'));
const Agenda               = lazy(() => import('./body/views/agenda/Agenda'));
const Manager              = lazy(() => import('./body/views/inventario/Manager'));
const Recetas              = lazy(() => import('./body/views/ventaCompra/Recetas'));
const SobreNosotros        = lazy(() => import('./body/views/sobreNosotros/SobreNosotros'));
const Scraper              = lazy(() => import('../scraper/scraper'));
const StaffPortal          = lazy(() => import('./body/views/staff/staffPortal'));
const Inventario           = lazy(() => import('./body/views/inventario/Inventario'));
const GestionAlmacen       = lazy(() => import('./body/views/inventario/GestionAlmacen'));
const BarcodeManager       = lazy(() => import('./body/views/inventario/BarcodeManager'));
const VentaCompra          = lazy(() => import('./body/views/ventaCompra/VentaCompra'));
const Actividades          = lazy(() => import('./body/views/actividades/Actividades'));
const Gastos               = lazy(() => import('./body/components/gastos/Gastos'));
const Compras              = lazy(() => import('./body/views/ventaCompra/Compras'));
const MenuPrint            = lazy(() => import('./body/components/Menu/MenuPrint'));
const MenuHead             = lazy(() => import('./body/components/Menu/MenuHead'));
const DiaResumen           = lazy(() => import('./body/views/ventaCompra/DiaResumen'));
const MesResumen           = lazy(() => import('./body/views/ventaCompra/MesResumen'));
const AccionesRapidas      = lazy(() => import('./body/views/actualizarPrecioUnitario/AccionesRapidas'));
const WorkIsueExcelView    = lazy(() => import('./body/views/actividades/WorkE/WorkIsueExcelView'));
const CalendarioProduccion = lazy(() => import('./body/views/actividades/CalendarioProduccion'));
const WorkIsueCreator      = lazy(() => import('./body/views/actividades/WorkIsueCreator'));
const Proveedores          = lazy(() => import('./body/views/proveedores/Proveedores'));
const PagosProveedores     = lazy(() => import('./body/views/proveedores/PagosProveedores'));
const StaffCreator         = lazy(() => import('./body/views/actividades/StaffCreator'));
const RecetaModal          = lazy(() => import('./body/views/ventaCompra/RecetaModal'));
const ItemsModal           = lazy(() => import('./body/components/Items/ItemsModal'));
const ProcedimientoModal   = lazy(() => import('./body/views/ventaCompra/ProcedimientoModal'));
const AgendaModal          = lazy(() => import('./body/views/agenda/AgendaModal'));
const InscripcionEvento    = lazy(() => import('./body/views/agenda/InscripcionEvento'));
const AgendaFormPage       = lazy(() => import('./body/views/agenda/AgendaFormPage'));
const Predict              = lazy(() => import('./body/views/ventaCompra/Predict'));
const CalculoNomina        = lazy(() => import('./body/views/staff/CalculoNomina'));
const StaffDetailView      = lazy(() => import('./body/views/staff/StaffDetailView'));
const StaffManager         = lazy(() => import('./body/views/staff/StaffManager'));
const UserManager          = lazy(() => import('./body/views/staff/UserManager'));
const UserPortal           = lazy(() => import('./body/views/user/UserPortal'));
const EventosOffer         = lazy(() => import('./body/views/agenda/EventosOffer'));
const EditarTurnosView     = lazy(() => import('./body/views/staff/EditarTurnosView'));
const TipsManager          = lazy(() => import('./body/views/staff/TipsManager'));
const Model                = lazy(() => import('./body/views/ventaCompra/Model'));
const ModeloProyecto       = lazy(() => import('./body/views/ventaCompra/ModeloProyecto'));
const GastosCalculadosMateriales = lazy(() => import('./body/views/ventaCompra/GastosCalculadosMateriales'));
const ProductosFinanciero  = lazy(() => import('./body/views/ventaCompra/ProductosFinanciero'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center text-white text-xl font-SpaceGrotesk font-light">Cargando...</div>
  </div>
);

function App() {
  return (
    <div
      className='flex w-full min-h-screen relative'
      style={{
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-cream-bg/60 pointer-events-none z-0"></div>

      <div className="relative z-10 w-screen">
        <TopNav />
        <br />
        <br />
        <ErrorBoundary section="Aplicación">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/MenuView"                          element={<MenuView />} />
            <Route path="/MenuLunch"                         element={<MenuLunch />} />
            <Route path="/LunchByOrder"                      element={<LunchByOrder />} />
            <Route path="/BuscarPreciosInternet"             element={<BuscarPreciosInternet />} />
            <Route path="/Home"                              element={<MenuView />} />
            <Route path="/Agenda/:year?/:month?"             element={<Agenda />} />
            <Route path="/Manager"                           element={<Manager />} />
            <Route path="/Recetas"                           element={<Recetas />} />
            <Route path="/SobreNosotros"                     element={<SobreNosotros />} />
            <Route path="/Scraper"                           element={<Scraper />} />
            <Route path="/"                                  element={<StaffPortal />} />
            <Route path="/Inventario"                        element={<Inventario />} />
            <Route path="/GestionAlmacen"                   element={<GestionAlmacen />} />
            <Route path="/Inventario/BarcodeManager"         element={<BarcodeManager />} />
            <Route path="/VentaCompra"                       element={<VentaCompra />} />
            <Route path="/Actividades"                       element={<Actividades />} />
            <Route path="/Gastos"                            element={<Gastos />} />
            <Route path="/Compras"                           element={<Compras />} />
            <Route path="/MenuPrint"                         element={<MenuPrint />} />
            <Route path="/MenuHead"                          element={<MenuHead />} />
            <Route path="/DiaResumen"                        element={<DiaResumen />} />
            <Route path="/DiaResumen/:date"                  element={<DiaResumen />} />
            <Route path="/MesResumen"                        element={<MesResumen />} />
            <Route path="/AccionesRapidas"                   element={<AccionesRapidas />} />
            <Route path="/WorkIsue"                          element={<WorkIsueExcelView />} />
            <Route path="/CalendarioProduccion"              element={<CalendarioProduccion />} />
            <Route path="/CalendarioProduccio"               element={<CalendarioProduccion />} />
            <Route path="/WorkIsueCreator"                   element={<WorkIsueCreator />} />
            <Route path="/Proveedores"                       element={<Proveedores />} />
            <Route path="/PagosProveedores"                  element={<PagosProveedores />} />
            <Route path="/StaffCreator"                      element={<StaffCreator />} />
            <Route path="/receta/:id"                        element={<RecetaModal />} />
            <Route path="/item/:id"                          element={<ItemsModal />} />
            <Route path="/ProcedimientoModal/:id"            element={<ProcedimientoModal />} />
            <Route path="/evento/:id/:tab?"                  element={<AgendaModal />} />
            <Route path="/inscripcion/:id"                   element={<InscripcionEvento />} />
            <Route path="/agendaForm/:id"                   element={<AgendaFormPage />} />
            <Route path="/Predict/:MenuItem"                 element={<Predict />} />
            <Route path="/CalculoNomina"                     element={<CalculoNomina />} />
            <Route path="/staff-detail"                      element={<StaffDetailView />} />
            <Route path="/staff-manager"                     element={<StaffManager />} />
            <Route path="/user-manager"                      element={<UserManager />} />
            <Route path="/UserPortal"                        element={<UserPortal />} />
            <Route path="/UserPortal/Registro"               element={<UserPortal />} />
            <Route path="/EventosOffer"                      element={<EventosOffer />} />
            <Route path="/staff-details/:cc"                 element={<StaffDetailView />} />
            <Route path="/staff-manager/:cc"                 element={<StaffDetailView />} />
            <Route path="/staff-manager/:cc/editar-turnos"   element={<EditarTurnosView />} />
            <Route path="/staff-manager/tips"                element={<TipsManager />} />
            <Route path="/TipsManager"                       element={<TipsManager />} />
            <Route path="/Model"                             element={<Model />} />
            <Route path="/ModeloProyecto"                    element={<ModeloProyecto />} />
            <Route path="/ModeloProyecto/:year/:month"       element={<ModeloProyecto />} />
            <Route path="/gastos-calculados"                 element={<GastosCalculadosMateriales />} />
            <Route path="/productosFinanciero"               element={<ProductosFinanciero />} />
            <Route path="*"                                  element={<div className="text-center p-8 text-white text-2xl">Página no encontrada</div>} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
