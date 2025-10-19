import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Para acceder al estado global de Redux
import fondoImage from './assets/fondo.png';
// import './App.css';

import { UPDATE_CURRENT_VIEW, MENUHEAD, HOME, MENUVIEW, AGENDA, NOSOTROS, LUNCH , MODEL ,RECETAS, COMPRAS} from './redux/actions-types'; // Importa las acciones y vistas
// BuscarPreciosInternet
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound'; // Componente de fallback si no coincide una ruta
import BottomNav from './components/ui/bottom-nav'; // Importa BottomNav
import TopNav from './components/ui/top-nav'; // Importa BottomNav
import Home from './body/views/home/Home';
import MenuView from './body/views/menuView/MenuView';
import MenuLunch from './body/views/menuView/MenuLunch';
import LunchByOrder from './body/views/lunchByOrder/LunchByOrder';
import AccionesRapidas from './body/views/actualizarPrecioUnitario/AccionesRapidas';
import BuscarPreciosInternet from './body/views/buscarPreciosInternet/BuscarPreciosInternet';
import LandingHome from './body/views/home/LandingHome';  
import Agenda from './body/views/agenda/Agenda';
import SobreNosotros from './body/views/sobreNosotros/SobreNosotros';
import Scraper from '../scraper/scraper';
import Inventario from './body/views/inventario/Inventario';
import Manager from './body/views/inventario/Manager';
import VentaCompra from './body/views/ventaCompra/VentaCompra';
import Compras from './body/views/ventaCompra/Compras';
import Actividades from './body/views/actividades/Actividades';
import Recetas from './body/views/ventaCompra/Recetas.jsx';
import MesResumen from './body/views/ventaCompra/MesResumen.jsx';
import Model from './body/views/ventaCompra/Model.jsx';
import DiaResumen from './body/views/ventaCompra/DiaResumen.jsx';
import RecetaModal from './body/views/ventaCompra/RecetaModal';
import ProcedimientoModal from './body/views/ventaCompra/ProcedimientoModal';
import Predict from './body/views/ventaCompra/Predict';
import Gastos from './body/components/gastos/Gastos';
import Proveedores from './body/views/proveedores/Proveedores';
import MenuPrint from './body/components/Menu/MenuPrint';
import MenuHead  from './body/components/Menu/MenuHead';
import StaffPortal from './body/views/staff/staffPortal.jsx';
import CalculoNomina from './body/views/staff/CalculoNomina';
import WorkIsueExcelView from './body/views/actividades/WorkE/WorkIsueExcelView.jsx';

// import Manager from './body/views/actividades/Manager';


// import CalculoNomina from './body/views/CalculoNomina/CalculoNomina.jsx';
// import { Home } from 'lucide-react';
function App() {
  // Selecciona el estado global que controla la vista actual
  const currentView = useSelector((state) => state.currentView);

  // Estado local que cambia en función del estado global de Redux
  let componentToRender;

  switch (currentView) {
    case HOME:
      componentToRender = <LandingHome/>;
      break;
    case AGENDA:
      componentToRender = <Agenda/>;
    case MENUHEAD:
      componentToRender = <MenuHead/>;
    case MODEL:
      componentToRender = <Model/>;
    case RECETAS:
      componentToRender = <Recetas/>;
      break;
    case NOSOTROS:
      componentToRender = <SobreNosotros/>;
    case COMPRAS:
      componentToRender = <Compras/>;
      break;
    case LUNCH:
      componentToRender = <MenuLunch />;
      break;
    case MENUVIEW:
      componentToRender = <MenuView />;
  
      break;
    default:
      componentToRender = <div>Page Not Found</div>; // Fallback para rutas no encontradas
      break;
  }
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
      {/* Overlay para transparencia del 50% */}
      <div className="absolute inset-0 bg-cream-bg/60 pointer-events-none z-0"></div>
      
      {/* Contenido de la aplicación */}
      <div className="relative z-10 w-full">
        <TopNav />
        <br></br>
        <br></br>
        <Routes>
     {/* <Route path="/" element={componentToRender} /> */}
     <Route path="/MenuView" element={<MenuView />} />
     <Route path="/MenuLunch" element={<MenuLunch />} />
     <Route path="/LunchByOrder" element={<LunchByOrder />} />
     <Route path="/BuscarPreciosInternet" element={<BuscarPreciosInternet />} />
     <Route path="/Home" element={<Home />} />
     <Route path="/Agenda" element={<Agenda />} />
     <Route path="/Manager" element={<Manager />} />
     <Route path="/Recetas" element={<Recetas />} />
     <Route path="/SobreNosotros" element={<SobreNosotros />} />
     <Route path="/Scraper" element={<Scraper />} />
     <Route path="/" element={<StaffPortal />} />
     {/* <Route path="/StaffPortal" element={<StaffPortal />} /> */}
     <Route path="/Inventario" element={<Inventario />} />
     <Route path="/VentaCompra" element={<VentaCompra />} />
     <Route path="/Actividades" element={<Actividades />} />
     <Route path="/Gastos" element={<Gastos />} />
     <Route path="/Compras" element={<Compras />} />
     <Route path="/MenuPrint" element={<MenuPrint />} />
     <Route path="/MenuHead" element={<MenuHead />} />
     <Route path="/DiaResumen" element={<DiaResumen />} />
     <Route path="/MesResumen" element={<MesResumen />} />
     <Route path="/AccionesRapidas" element={<AccionesRapidas />} />
     <Route path="/WorkIsue" element={<WorkIsueExcelView />} />
     <Route path="/Proveedores" element={<Proveedores />} />
     <Route path="/receta/:id" element={<RecetaModal />} />
     <Route path="/ProcedimientoModal/:id" element={<ProcedimientoModal />} />
     <Route path="/Predict/:MenuItem" element={<Predict />} />
     <Route path="/CalculoNomina" element={<CalculoNomina />} />
     <Route path="/Model" element={<Model />} />
     {/* Renderiza el componente que corresponde a la vista actual */}
     {/* Renderiza el BottomNav debajo del componente actual */}
     </Routes>
     {/* <BottomNav /> */}
     <br></br>
     <br></br>
     <br></br>
      </div>
    </div>
  );
}

export default App;
