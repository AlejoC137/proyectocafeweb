import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, setCurrentStaff } from "../../../redux/actions";
import { STAFF, Comanda } from "../../../redux/actions-types";
import StaffInstance from "./staffInstance";
import StaffShift from "./staffShift";
import StaffComandas from "./staffComandas";
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
  BarChart3,
  BookOpen,
  Store,
  Ticket,
  Barcode,
  ShoppingCart,
  Landmark
} from "lucide-react";
import ComandaStaff from "../actividades/WorkE/ComandaStaff";
import Notas from "../actividades/WorkE/Notas";

function StaffPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [ccInput, setCcInput] = useState("");
  const [staffFound, setStaffFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // LOG PARA REVISAR PROPIEDADES (Solicitado por el usuario)

  const [activeView, setActiveView] = useState(null);
  const [propinaInput, setPropinaInput] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {

    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(STAFF));
        await dispatch(getAllFromTable(Comanda));
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
      dispatch(setCurrentStaff(staff));
      setCcInput("");
    } else {
      setStaffFound(null);
      dispatch(setCurrentStaff(null));
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
      dispatch(setCurrentStaff(staff));
    } else {
      setStaffFound(null);
      dispatch(setCurrentStaff(null));
      setError("No se encontró personal seleccionado.");
    }
  };

  // Botones principales del sistema
  const systemButtons = [
    {
      label: "Comandas",
      icon: Wrench,
      onClick: () => navigate("/Comanda"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Manager",
      icon: Brain,
      onClick: () => navigate("/Manager"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Inventario",
      icon: Package,
      onClick: () => navigate("/Inventario"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Recetas",
      icon: BookOpen,
      onClick: () => navigate("/Recetas"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Agenda Prod.",
      icon: Calendar,
      onClick: () => navigate("/CalendarioProduccio"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Menu Print",
      icon: Printer,
      onClick: () => navigate("/MenuPrint"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Gastos",
      icon: DollarSign,
      onClick: () => navigate("/Gastos"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Modelos",
      icon: Users,
      onClick: () => navigate("/Model"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Venta / Compra",
      icon: CreditCard,
      onClick: () => navigate("/VentaCompra"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Eventos Mgr",
      icon: CalendarDays,
      onClick: () => navigate("/Agenda"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Proveedores",
      icon: Store,
      onClick: () => navigate("/Proveedores"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Eventos Offer",
      icon: Ticket,
      onClick: () => navigate("/EventosOffer"),
      variant: "default",
      size: "xl"
    },
    {
      label: "Codigos Barra",
      icon: Barcode,
      onClick: () => navigate("/Inventario/BarcodeManager"),
      variant: "default",
      size: "xl"
    }
  ];

  // Botones específicos del staff encontrado
  const staffButtons = staffFound ? [
    {
      label: "Edit Info",
      icon: Settings,
      onClick: () => setActiveView("instance"),
      variant: "outline",
      size: "lg"
    },
    {
      label: "Turnos",
      icon: Clock,
      onClick: () => setActiveView("shift"),
      variant: "outline",
      size: "lg"
    },
    {
      label: "Compras",
      icon: ShoppingCart,
      onClick: () => navigate("/Compras"),
      variant: "outline",
      size: "lg"
    },
    // Botones de administrador
    ...(staffFound.isAdmin ? [
      {
        label: "Gestión Usuarios",
        icon: Users,
        onClick: () => navigate("/user-manager"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Staff Manager",
        icon: Users,
        onClick: () => navigate("/staff-manager"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Nómina",
        icon: BarChart3,
        onClick: handleGoToNomina,
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Pagos",
        icon: DollarSign,
        onClick: () => navigate("/PagosProveedores"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Día",
        icon: CalendarDays,
        onClick: () => navigate("/DiaResumen"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Financiero",
        icon: Landmark,
        onClick: () => navigate("/productosFinanciero"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Almacén",
        icon: Store,
        onClick: () => navigate("/GestionAlmacen"),
        variant: "destructive",
        size: "lg"
      },
      {
        label: "Mes",
        icon: Calendar,
        onClick: () => navigate("/MesResumen"),
        variant: "destructive",
        size: "lg"
      }
    ] : [])
  ] : [];

  return (
    <PageLayout loading={loading}>
      {/* Contenedor principal GRID que organiza las 3 columnas de forma adaptativa */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 pb-20 lg:pb-0 max-w-[1600px] mx-auto">

        {/* --- COLUMNA 1 (a) --- */}
        <div className="w-full xl:col-span-3">
          <ComandaStaff />
        </div>

        {/* --- COLUMNA 2 (b) --- */}
        <div className="w-full xl:col-span-6 flex flex-col gap-6">
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
                  className="flex border rounded px-2 py-2 bg-gray-100 w-full"
                >
                  <option value="">Seleccione Staff</option>
                  {allStaff
                    .filter(staff => staff.Contratacion !== false && staff.Contratacion !== "false")
                    .map((staff) => (
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
        <div className="w-full xl:col-span-3">
          <Notas />
        </div>

      </div>
    </PageLayout>
  );
}

export default StaffPortal;