import { useState } from "react";
import { useDispatch } from "react-redux"; // Importa el hook useDispatch de Redux
import { Link, useLocation } from "react-router-dom"; // Importa Link para navegación
import { Home, UtensilsCrossed, Calendar, Search, User, Guitar } from "lucide-react"; // Íconos más adecuados
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Usa el componente personalizado Button
import { updateActiveTab } from "../../redux/actions"; // Importa la acción de Redux

import { UPDATE_CURRENT_VIEW, HOME, MENUVIEW, AGENDA, NOSOTROS, LUNCH, MENU } from "../../redux/actions-types"; // Importa las acciones y vistas

// Íconos más relevantes para cada opción con colores de la paleta cafetería
const navItems = [
  { icon: Home, label: HOME, color: "text-cobalt-blue", path: "/" }, // Inicio
  { icon: UtensilsCrossed, label: MENU, color: "text-sage-green", path: "/MenuView" }, // Menú
  { icon: Calendar, label: LUNCH, color: "text-terracotta-pink", path: "/LunchByOrder" }, // Almuerzo por pedido
  { icon: Guitar, label: AGENDA, color: "text-cobalt-blue", path: "/Agenda" }, // Agenda
  { icon: User, label: NOSOTROS, color: "text-sage-green", path: "/SobreNosotros" }, // Sobre Nosotros
];

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState("Bookings");
  const dispatch = useDispatch(); // Inicializa dispatch
  const location = useLocation(); // Obtén la ubicación actual para resaltar la pestaña activa

  const handleTabClick = (label) => {
    setActiveTab(label);
    // Envía una acción para actualizar la pestaña activa en el store de Redux
    dispatch(updateActiveTab(label));
  };

  return (
    <div className="flex flex-col">
      {/* Barra de navegación inferior fija */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-sage-green shadow-lg dark:bg-slate-950 z-50">
        <ul className="h-full flex justify-between items-center">
          {navItems.map(({ icon: Icon, label, color, path }) => (
            <li key={label} className="flex-grow">
              <Link to={path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-full flex flex-col items-center justify-center transition-all duration-300 ease-in-out font-PlaywriteDE font-bold",
                    location.pathname === path
                      ? "bg-light-leaf dark:bg-slate-700" // Botón seleccionado: verde claro
                      : "bg-white dark:bg-slate-900 hover:bg-sage-green/10 dark:hover:bg-slate-800/50" // Botones no seleccionados
                  )}
                  style={{ width: `calc(100vw / (${navItems.length}))` }}
                  onClick={() => handleTabClick(label)} // Handler de clic añadido
                >
                  <Icon className={cn("h-5 w-5", color)} />
                  <span className="text-xs font-bold">{label}</span>
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
