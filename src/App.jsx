import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Para acceder al estado global de Redux
// import './App.css';

import { UPDATE_CURRENT_VIEW, HOME, MENUVIEW, AGENDA, NOSOTROS, LUNCH } from './redux/actions-types'; // Importa las acciones y vistas
// BuscarPreciosInternet
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound'; // Componente de fallback si no coincide una ruta
import BottomNav from './components/ui/bottom-nav'; // Importa BottomNav
import TopNav from './components/ui/top-nav'; // Importa BottomNav
import Home from './body/views/home/Home';
import MenuView from './body/views/menuView/MenuView';
import LunchByOrder from './body/views/lunchByOrder/LunchByOrder';
import AccionesRapidas from './body/views/actualizarPrecioUnitario/AccionesRapidas';
import BuscarPreciosInternet from './body/views/buscarPreciosInternet/BuscarPreciosInternet';
import LandingHome from './body/views/home/LandingHome';
import Agenda from './body/views/agenda/Agenda';
import SobreNosotros from './body/views/sobreNosotros/SobreNosotros';
import Scraper from '../scraper/scraper';
import Inventario from './body/views/inventario/Inventario';
import VentaCompra from './body/views/ventaCompra/VentaCompra';
import DiaResumen from './body/views/ventaCompra/DiaResumen';
import RecetaModal from './body/views/ventaCompra/RecetaModal';

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
      break;
    case NOSOTROS:
      componentToRender = <SobreNosotros/>;
      break;
    case LUNCH:
      componentToRender = <LunchByOrder />;
      break;
    case MENUVIEW:
      componentToRender = <MenuView />;
      break;
    default:
      componentToRender = <div>Page Not Found</div>; // Fallback para rutas no encontradas
      break;
  }
  return (
    <div >
     <TopNav />
     <br></br>
     <br></br>
    <Routes>
     <Route path="/" element={componentToRender} />
     <Route path="/MenuView" element={<MenuView />} />
     <Route path="/LunchByOrder" element={<LunchByOrder />} />
     <Route path="/BuscarPreciosInternet" element={<BuscarPreciosInternet />} />
     <Route path="/Home" element={<LandingHome />} />
     <Route path="/Agenda" element={<Agenda />} />
     <Route path="/SobreNosotros" element={<SobreNosotros />} />
     <Route path="/Scraper" element={<Scraper />} />
     <Route path="/Inventario" element={<Inventario />} />
     <Route path="/VentaCompra" element={<VentaCompra />} />
     <Route path="/DiaResumen" element={<DiaResumen />} />
     <Route path="/AccionesRapidas" element={<AccionesRapidas />} />
     <Route path="/receta/:id" element={<RecetaModal />} />
        {/* Renderiza el componente que corresponde a la vista actual */}


        {/* Renderiza el BottomNav debajo del componente actual */}
     </Routes>
     <BottomNav />
     <br></br>
     <br></br>
     <br></br>
      </div>
  );
}

export default App;
