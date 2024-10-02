import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Para acceder al estado global de Redux
// import './App.css';

import { UPDATE_CURRENT_VIEW, HOME, MENUVIEW, ABOUT, CONTACT, LUNCH } from './redux/actions-types'; // Importa las acciones y vistas

// import About from './components/About';
// import Contact from './components/Contact';
// import NotFound from './components/NotFound'; // Componente de fallback si no coincide una ruta
import BottomNav from './components/ui/bottom-nav'; // Importa BottomNav
import Home from './body/views/home/Home';
import MenuView from './body/views/menuView/MenuView';
import LunchByOrder from './body/views/lunchByOrder/LunchByOrder';
// import { Home } from 'lucide-react';
function App() {
  // Selecciona el estado global que controla la vista actual
  const currentView = useSelector((state) => state.currentView);

  // Estado local que cambia en función del estado global de Redux
  let componentToRender;

  switch (currentView) {
    case HOME:
      componentToRender = <Home />;
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
    <Routes>
     <Route path="/" element={componentToRender} />
     <Route path="/MenuView" element={<MenuView />} />
     <Route path="/LunchByOrder" element={<LunchByOrder />} />
        {/* Renderiza el componente que corresponde a la vista actual */}


        {/* Renderiza el BottomNav debajo del componente actual */}
     </Routes>
     <BottomNav />
      </div>
  );
}

export default App;
