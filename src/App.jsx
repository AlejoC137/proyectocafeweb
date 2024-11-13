import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Para acceder al estado global de Redux
// import './App.css';

import { UPDATE_CURRENT_VIEW, HOME, MENUVIEW, ABOUT, CONTACT, LUNCH } from './redux/actions-types'; // Importa las acciones y vistas
// BuscarPreciosInternet
// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound'; // Componente de fallback si no coincide una ruta
import BottomNav from './components/ui/bottom-nav'; // Importa BottomNav
import TopNav from './components/ui/top-nav'; // Importa BottomNav
import Home from './body/views/home/Home';
import MenuView from './body/views/menuView/MenuView';
import LunchByOrder from './body/views/lunchByOrder/LunchByOrder';
import ActualizarPrecioUnitario from './body/views/actualizarPrecioUnitario/ActualizarPrecioUnitario';
import BuscarPreciosInternet from './body/views/buscarPreciosInternet/BuscarPreciosInternet';
// import { Home } from 'lucide-react';
function App() {
  // Selecciona el estado global que controla la vista actual
  const currentView = useSelector((state) => state.currentView);

  // Estado local que cambia en función del estado global de Redux
  let componentToRender;

  switch (currentView) {
    case HOME:
      componentToRender = <BuscarPreciosInternet/>;
      break;
    case ABOUT:
      componentToRender = <div>About Page</div>;
      break;
    case CONTACT:
      componentToRender = <div>Contact Page</div>;
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
        {/* Renderiza el componente que corresponde a la vista actual */}


        {/* Renderiza el BottomNav debajo del componente actual */}
     </Routes>
     <BottomNav />
     <br></br>
     <br></br>
      </div>
  );
}

export default App;
