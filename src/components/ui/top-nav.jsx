import { useSelector } from "react-redux";
import { Menu, ShoppingCart } from "lucide-react"; // Importar los íconos

export default function TopNav() {
  const currentView = useSelector((state) => state.currentView);
  const currentLeng = useSelector((state) => state.currentLeng);

  const getDisplayText = () => {
    switch (currentView) {
      case "HOME":
        return currentLeng === "ESP" ? "Inicio" : "Home";
      case "MENUVIEW":
        return currentLeng === "ESP" ? "Menú" : "Menu";
      case "ABOUT":
        return currentLeng === "ESP" ? "Acerca de" : "About";
      case "CONTACT":
        return currentLeng === "ESP" ? "Contacto" : "Contact";
      case "LUNCH":
        return currentLeng === "ESP" ? "Almuerzos" : "Lunch";
      default:
        return currentLeng === "ESP" ? "Vista Desconocida" : "Unknown View";
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 flex items-center text-lg justify-between px-4 border-b-2 bg-white z-50" /* Añadido z-50 */
    >
      <button className="p-2 rounded-md bg-white">
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      <h1 className="font-bold text-xl">{getDisplayText().toUpperCase()}</h1>

      <button className="p-2 rounded-md bg-white">
        <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>
    </div>
  );
}

