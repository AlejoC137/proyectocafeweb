import { useState } from "react";
import { useDispatch } from "react-redux"; // Importa el hook useDispatch de Redux
import { Link, useLocation } from "react-router-dom"; // Importa Link para navegación
import { Home, Search, ShoppingBag, Calendar, User, UtensilsCrossed } from "lucide-react"; // Añade el ícono faltante
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Usa el componente personalizado Button
import { updateActiveTab } from "../../redux/actions"; // Importa la acción de Redux

import { UPDATE_CURRENT_VIEW, HOME, MENUVIEW, ABOUT, CONTACT, LUNCH } from '../../redux/actions-types'; // Importa las acciones y vistas

const navItems = [
  { icon: Home, label: HOME, color: "text-blue-500", path: "/home" },
  { icon: Search, label: ABOUT, color: "text-green-500", path: "/about" },
  { icon: ShoppingBag, label: CONTACT, color: "text-yellow-500", path: "/contact" },
  { icon: Calendar, label: MENUVIEW, color: "text-purple-500", path: "/MenuView" },
  { icon: UtensilsCrossed, label: LUNCH, color: "text-red-500", path: "/LunchByOrder" }, // Completa el ícono faltante
];
export default function BottomNav() {
  const [activeTab, setActiveTab] = useState("Bookings");
  const dispatch = useDispatch(); // Initialize dispatch
  const location = useLocation(); // Get the current location to highlight the active tab

  const handleTabClick = (label) => {
    setActiveTab(label);
    // Dispatch action to update the active tab in Redux store
    dispatch(updateActiveTab(label));
  };

  return (
    <div className="flex flex-col">
      {/* Navigation bar at the bottom, fixed */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t dark:bg-slate-950 ">
        <ul className="h-full flex justify-between items-center">
          {navItems.map(({ icon: Icon, label, color, path }) => (
            <li key={label} className="flex-grow">
              <Link to={path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-full flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
                    location.pathname === path
                      ? "bg-slate-200 dark:bg-slate-700" // Botón seleccionado: más oscuro
                      : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800/50" // Botones no seleccionados: más claro
                  )}
                  style={{ width: `calc(100vw / (${navItems.length}))` }}
                  onClick={() => handleTabClick(label)} // onClick handler added
                >
                  <Icon className={cn("h-5 w-5", color)} />
                  <span className="text-xs font-medium">{label}</span>
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
