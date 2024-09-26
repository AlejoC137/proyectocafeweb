import { useState } from "react";
import { useDispatch } from "react-redux"; // Import the useDispatch hook from Redux
import { Link, useLocation } from "react-router-dom"; // Import Link for navigation
import { Home, Search, ShoppingBag, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateActiveTab } from "../../redux/actions";

const navItems = [
  { icon: Home, label: "Home", color: "text-blue-500", path: "/home" },
  { icon: Search, label: "Search", color: "text-green-500", path: "/search" },
  { icon: ShoppingBag, label: "Orders", color: "text-yellow-500", path: "/orders" },
  { icon: Calendar, label: "Bookings", color: "text-purple-500", path: "/bookings" },
  { icon: User, label: "Profile", color: "text-red-500", path: "/profile" },
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
    <div className="flex flex-col h-screen">
  

      {/* Navigation bar at the bottom */}
      <nav className="flex-none h-16 bg-white border-t dark:bg-slate-950">
        <ul className="h-full flex justify-around items-center px-2">
          {navItems.map(({ icon: Icon, label, color, path }) => (
            <li key={label} className="flex-1">
              {/* Use Link for navigation without a sliding window */}
              <Link to={path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-300 ease-in-out",
                    location.pathname === path ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  )}
                  onClick={() => handleTabClick(label)}
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
