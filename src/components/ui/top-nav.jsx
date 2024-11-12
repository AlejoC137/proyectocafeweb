import { useSelector } from "react-redux";

export default function TopNav() {
  const currentView = useSelector((state) => state.currentView);
  const currentLeng = useSelector((state) => state.currentLeng);

  const getDisplayText = () => {
    switch (currentView) {
      case 'HOME':
        return currentLeng === 'ESP' ? 'Inicio' : 'Home';
      case 'MENUVIEW':
        return currentLeng === 'ESP' ? 'Menú' : 'Menu';
      case 'ABOUT':
        return currentLeng === 'ESP' ? 'Acerca de' : 'About';
      case 'CONTACT':
        return currentLeng === 'ESP' ? 'Contacto' : 'Contact';
      case 'LUNCH':
        return currentLeng === 'ESP' ? 'Almuerzos' : 'Lunch';
      default:
        return currentLeng === 'ESP' ? 'Vista Desconocida' : 'Unknown View';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-white dark:bg-slate-950 flex items-center text-lg justify-center border-b-2">
      <h1 className=" font-bold text-xl">{getDisplayText().toUpperCase()}</h1>
    </div>
  );
}
