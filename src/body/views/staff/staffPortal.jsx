import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable } from "../../../redux/actions";
import { STAFF, WORKISUE } from "../../../redux/actions-types";
import StaffInstance from "./staffInstance";
import StaffShift from "./staffShift";
import StaffWorkIssues from "./staffWorkIssues";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import ActionButtonGroup from "../../../components/ui/action-button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Settings, 
  Edit, 
  Clock, 
  DollarSign, 
  Brain, 
  Package, 
  Printer, 
  CreditCard, 
  Users, 
  Calendar, 
  CalendarDays,
  Wrench,
  BarChart3
} from "lucide-react";
import WorkIsueStaff from "../actividades/WorkE/WorkIsueStaff";
import Notas from "../actividades/WorkE/Notas";

function StaffPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [ccInput, setCcInput] = useState("");
  const [staffFound, setStaffFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState(null);
  const [propinaInput, setPropinaInput] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    // console.log("All Staff Data:", allStaff);
    
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(STAFF));
        await dispatch(getAllFromTable(WORKISUE));
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");
    setActiveView(null);
    const staff = allStaff.find((s) =>
      String(s.CC).startsWith(ccInput.trim())
    );
    if (staff) {
      setStaffFound(staff);
      setCcInput("");
    } else {
      setStaffFound(null);
      setError("No se encontró personal con esos primeros 4 dígitos de CC.");
    }
  };

  const handlePropinaSubmit = (e) => {
    e.preventDefault();
    if (!staffFound) return;
    setPropinaInput("");
  };

  const handleGoToNomina = () => {
    navigate("/CalculoNomina");
  };

  const handleSelectStaff = (e) => {
    setError("");
    setActiveView(null);
    const staffId = e.target.value;
    setSelectedStaffId(staffId);
    const staff = allStaff.find((s) => s._id === staffId);
    if (staff) {
      setStaffFound(staff);
    } else {
      setStaffFound(null);
      setError("No se encontró personal seleccionado.");
    }
  };

  // Botones principales del sistema
  const systemButtons = [
    {
      label: "Work Issues",
      icon: "🔧",
      onClick: () => navigate("/WorkIsue"),
      variant: "secondary"
    },
    {
      label: "Manager",
      icon: "🧠",
      onClick: () => navigate("/Manager"),
      variant: "secondary"
    },
    {
      label: "Inventario",
      icon: "📦",
      onClick: () => navigate("/Inventario"),
      variant: "secondary"
    },
    {
      label: "Recetas",
      icon: "📚",
      onClick: () => navigate("/Recetas"),
      variant: "secondary"
    },
    {
      label: "Menu Print",
      icon: "🖨️",
      onClick: () => navigate("/MenuPrint"),
      variant: "secondary"
    },
    {
      label: "Modelos",
      icon: "🚩",
      onClick: () => navigate("/Model"),
      variant: "default"
    },
    {
      label: "Venta / Compra",
      icon: "💵",
      onClick: () => navigate("/VentaCompra"),
      variant: "default"
    },
    {
      label: "Eventos",
      icon: "🎟️",
      onClick: () => navigate("/Agenda"),
      variant: "default"
    },
    {
      label: "Proveedores",
      icon: "💁‍♀️",
      onClick: () => navigate("/Proveedores"),
      variant: "secondary"
    }
  ];

  // Botones específicos del staff encontrado
  const staffButtons = staffFound ? [
    {
      label: "Edit Info",
      icon: "⚙️",
      onClick: () => setActiveView("instance"),
      variant: "outline"
    },
    {
      label: "Turnos",
      icon: "⏲️",
      onClick: () => setActiveView("shift"),
      variant: "outline"
    },
    {
      label: "Gastos",
      icon: "💸",
      onClick: () => navigate("/Gastos"),
      variant: "outline"
    },
    // Botones de administrador
    ...(staffFound.isAdmin ? [
      {
        label: "Nómina",
        icon: "📊",
        onClick: handleGoToNomina,
        variant: "destructive"
      },
      {
        label: "Día",
        icon: "📆",
        onClick: () => navigate("/DiaResumen"),
        variant: "destructive"
      },
      {
        label: "Mes",
        icon: "📅",
        onClick: () => navigate("/MesResumen"),
        variant: "destructive"
      }
    ] : [])
  ] : [];

  return (
    <PageLayout loading={loading}>
      {/* Contenedor principal FLEX que organiza las 3 columnas */}
      <div className="flex gap-4">

        {/* --- COLUMNA 1 (a) --- */}
        <div className="w-1/3">
          <WorkIsueStaff />
        </div>

        {/* --- COLUMNA 2 (b) --- */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* Botones generales del sistema */}
          <ContentCard title="Acceso al Sistema">
            <ActionButtonGroup 
              buttons={systemButtons} 
              className="flex"
            />
            <form onSubmit={handlePropinaSubmit} className="flex gap-3 pt-3">
              <Input
                type="number"
                min="0"
                placeholder="Monto de propina"
                value={propinaInput}
                onChange={(e) => setPropinaInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary" className="gap-2">
                <DollarSign size={16} />
                Actualizar
              </Button>
            </form>
            
            <form className="">
              <div className="flex gap-3 pt-3">
                <select
                  value={selectedStaffId}
                  onChange={handleSelectStaff}
                  className="flex border rounded px-2 py-2 bg-gray-100 "
                >
                  <option value="">Seleccione Staff</option>
                  {allStaff.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.Nombre} {staff.Apellido}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </form>
          </ContentCard>

          {/* Panel específico del staff encontrado */}
          {staffFound && (
            <ContentCard 
              className="border-green-200"
            >
              <div className="space-y-2">
                 <div className="bg-green-50 rounded-md p-3 mb-2">
                   <p className="text-sm text-green-700">
                     ✅ Personal encontrado: <strong>{staffFound.Nombre}</strong>
                     {staffFound.isAdmin && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">ADMIN</span>}
                   </p>
                 </div>
                
                <ActionButtonGroup 
                  buttons={staffButtons} 
                  layout="grid" 
                  className="flex"
                />
              </div>
            </ContentCard>
          )}

          {/* Vistas específicas */}
          {activeView === "instance" && staffFound && (
            <ContentCard title="Edit Info">
              <StaffInstance staff={staffFound} editable />
            </ContentCard>
          )}
          
          {activeView === "shift" && staffFound && (
            <ContentCard title="Gestión de Turnos">
              <StaffShift staffId={staffFound._id} estaffid={staffFound._id} />
            </ContentCard>
          )}
        </div>
        
        {/* --- COLUMNA 3 (c) --- */}
        <div className="w-1/3">
          <Notas />
        </div>

      </div>
    </PageLayout>
  );
}

export default StaffPortal;