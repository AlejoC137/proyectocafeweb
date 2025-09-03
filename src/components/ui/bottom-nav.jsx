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
      <nav 
        className="fixed bottom-0 left-0 right-0 h-20 shadow-lg z-50"
        style={{
          backgroundColor: 'rgb(255, 255, 255)', // white puro forzado
          borderTop: '2px solid rgb(74, 222, 128)', // sage-green forzado
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' // sombra sutil hacia arriba
        }}
      >
        <ul className="h-full flex justify-between items-center">
          {navItems.map(({ icon: Icon, label, color, path }) => {
            const isActive = location.pathname === path;
            const iconColor = {
              'text-cobalt-blue': 'rgb(30, 64, 175)', // cobalt-blue forzado
              'text-sage-green': 'rgb(34, 197, 94)',  // sage-green forzado
              'text-terracotta-pink': 'rgb(248, 113, 113)' // terracotta-pink forzado
            }[color] || 'rgb(55, 65, 81)'; // gray-700 forzado
            
            return (
              <li key={label} className="flex-grow">
                <Link to={path}>
                  <Button
                    variant="ghost"
                    style={{ 
                      width: `calc(100vw / ${navItems.length})`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isActive ? 'rgb(134, 239, 172)' : 'rgb(255, 255, 255)', // light-green / white forzado
                      color: 'rgb(0, 0, 0)', // black forzado
                      border: 'none',
                      borderRadius: '0',
                      fontFamily: 'PlaywriteDE, Arial, sans-serif',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgb(255, 255, 255)';
                      }
                    }}
                    onClick={() => handleTabClick(label)}
                  >
                    <Icon 
                      style={{ 
                        height: '20px', 
                        width: '20px', 
                        color: iconColor 
                      }} 
                    />
                    <span 
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'rgb(0, 0, 0)', // black forzado
                        fontFamily: 'PlaywriteDE, Arial, sans-serif'
                      }}
                    >
                      {label}
                    </span>
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
