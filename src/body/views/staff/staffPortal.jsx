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

  useEffect(() => {
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

  // Botones principales del sistema
  const systemButtons = [
    {
      label: "Work Issues",
      icon: Wrench,
      onClick: () => setActiveView("workissues"),
      variant: "secondary"
    },
    {
      label: "Manager",
      icon: Brain,
      onClick: () => navigate("/Manager"),
      variant: "secondary"
    },
    {
      label: "Inventario",
      icon: Package,
      onClick: () => navigate("/Inventario"),
      variant: "secondary"
    },
    {
      label: "Menu Print",
      icon: Printer,
      onClick: () => navigate("/MenuPrint"),
      variant: "secondary"
    },
    {
      label: "Venta / Compra",
      icon: CreditCard,
      onClick: () => navigate("/VentaCompra"),
      variant: "default"
    },
    {
      label: "Proveedores",
      icon: Users,
      onClick: () => navigate("/Proveedores"),
      variant: "secondary"
    }
  ];

  // Botones específicos del staff encontrado
  const staffButtons = staffFound ? [
    {
      label: "Editar Información",
      icon: Edit,
      onClick: () => setActiveView("instance"),
      variant: "outline"
    },
    {
      label: "Turnos",
      icon: Clock,
      onClick: () => setActiveView("shift"),
      variant: "outline"
    },
    {
      label: "Gastos",
      icon: DollarSign,
      onClick: () => navigate("/Gastos"),
      variant: "outline"
    },
    // Botones de administrador
    ...(staffFound.isAdmin ? [
      {
        label: "Ver Nómina",
        icon: BarChart3,
        onClick: handleGoToNomina,
        variant: "destructive"
      },
      {
        label: "Resumen del Día",
        icon: Calendar,
        onClick: () => navigate("/DiaResumen"),
        variant: "destructive"
      },
      {
        label: "Resumen del Mes",
        icon: CalendarDays,
        onClick: () => navigate("/MesResumen"),
        variant: "destructive"
      }
    ] : [])
  ] : [];

  return (
    <PageLayout title="Portal de Staff" loading={loading}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Sección de búsqueda de personal */}
        <ContentCard title="Buscar Personal">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Ingrese los primeros 4 dígitos del CC"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value.replace(/\D/g, ""))}
                className="flex-1"
                maxLength={10}
              />
              <Button type="submit" className="gap-2">
                <Search size={16} />
                Buscar
              </Button>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </form>
        </ContentCard>

        {/* Sección de propinas */}
        <ContentCard title="Gestión de Propinas">
          <form onSubmit={handlePropinaSubmit} className="flex gap-3">
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
        </ContentCard>

        {/* Botones generales del sistema */}
        <ContentCard title="Acceso al Sistema">
          <ActionButtonGroup 
            buttons={systemButtons} 
            layout="grid" 
            className="grid-cols-2 md:grid-cols-3"
          />
        </ContentCard>

        {/* Panel específico del staff encontrado */}
        {staffFound && (
          <ContentCard 
            title={`Panel de ${staffFound.Nombre || 'Staff'}`}
            className="border-green-200 dark:border-green-800"
          >
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Personal encontrado: <strong>{staffFound.Nombre}</strong>
                  {staffFound.isAdmin && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">ADMIN</span>}
                </p>
              </div>
              
              <ActionButtonGroup 
                buttons={staffButtons} 
                layout="grid" 
                className="grid-cols-2 md:grid-cols-3"
              />
            </div>
          </ContentCard>
        )}

        {/* Vistas específicas */}
        {activeView === "instance" && staffFound && (
          <ContentCard title="Editar Información del Personal">
            <StaffInstance staff={staffFound} editable />
          </ContentCard>
        )}
        
        {activeView === "shift" && staffFound && (
          <ContentCard title="Gestión de Turnos">
            <StaffShift staffId={staffFound._id} estaffid={staffFound._id} />
          </ContentCard>
        )}

        {activeView === "workissues" && (
          <ContentCard title="Work Issues">
            <StaffWorkIssues staffId={staffFound ? staffFound._id : null} />
          </ContentCard>
        )}
      </div>
    </PageLayout>
  );
}

export default StaffPortal;
