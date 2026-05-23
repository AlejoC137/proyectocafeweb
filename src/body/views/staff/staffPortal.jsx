import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, setCurrentStaff, fetchViewPreferences, addNota } from "../../../redux/actions";
import { STAFF, Comanda } from "../../../redux/actions-types";
import StaffInstance from "./staffInstance";
import StaffShift from "./staffShift";
import PageLayout from "../../../components/ui/page-layout";


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
  Landmark,
  Receipt,
  Menu,
  CheckSquare,
  Bell,
  Grid,
  FileEdit,
  AlertCircle,
  CheckCircle,
  Paperclip,
  Mic,
  Check,
  LogOut
} from "lucide-react";
import ComandaStaff from "../actividades/WorkE/ComandaStaff";
import Notas from "../actividades/WorkE/Notas";

function StaffPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [ccInput, setCcInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [staffFound, setStaffFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState(null);
  const [propinaInput, setPropinaInput] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [comandasActivas, setComandasActivas] = useState([]);
  const [notasActivas, setNotasActivas] = useState([]);
  const [newNotaContent, setNewNotaContent] = useState("");
  const [newNotaPara, setNewNotaPara] = useState("");

  // Restore staff from localStorage
  useEffect(() => {
    if (allStaff.length > 0 && !staffFound) {
      const savedStaffId = localStorage.getItem("staffFoundId");
      if (savedStaffId) {
        const staff = allStaff.find((s) => s._id === savedStaffId);
        if (staff) {
          setStaffFound(staff);
          dispatch(setCurrentStaff(staff));
          dispatch(fetchViewPreferences(staff._id));
        }
      }
    }
  }, [allStaff, staffFound, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(getAllFromTable(STAFF));
        const resComandas = await dispatch(getAllFromTable(Comanda));
        if (resComandas?.payload) setComandasActivas(resComandas.payload.reverse());
        
        const resNotas = await dispatch(getAllFromTable("Notas"));
        if (resNotas?.payload) setNotasActivas(resNotas.payload.reverse());
        
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
    const staff = allStaff.find((s) => String(s.CC).startsWith(ccInput.trim()));
    if (staff) {
      if (staff.Codigo && String(staff.Codigo) !== pinInput.trim()) {
         setError("PIN incorrecto.");
         setStaffFound(null);
         dispatch(setCurrentStaff(null));
         localStorage.removeItem("staffFoundId");
         return;
      }
      setStaffFound(staff);
      dispatch(setCurrentStaff(staff));
      dispatch(fetchViewPreferences(staff._id));
      localStorage.setItem("staffFoundId", staff._id);
      setCcInput("");
      setPinInput("");
    } else {
      setStaffFound(null);
      dispatch(setCurrentStaff(null));
      localStorage.removeItem("staffFoundId");
      setError("No se encontró personal con esos primeros 4 dígitos de CC.");
    }
  };

  const handlePropinaSubmit = (e) => {
    e.preventDefault();
    if (!staffFound) return;
    setPropinaInput("");
  };

  const handleLogout = () => {
    setStaffFound(null);
    dispatch(setCurrentStaff(null));
    localStorage.removeItem("staffFoundId");
    setActiveView(null);
    setCcInput("");
    setPinInput("");
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
      dispatch(fetchViewPreferences(staff._id));
      localStorage.setItem("staffFoundId", staff._id);
    } else {
      setStaffFound(null);
      dispatch(setCurrentStaff(null));
      localStorage.removeItem("staffFoundId");
      setError("No se encontró personal seleccionado.");
    }
  };

  const handleCrearNota = async () => {
    if (!newNotaContent.trim()) return;
    setLoading(true);
    const notaObj = { 
       content: newNotaContent, 
       de: staffFound ? staffFound.Nombre : "Admin Centro", 
       para: newNotaPara || "General", 
       done: false 
    };
    try {
       const res = await dispatch(addNota(notaObj));
       if (res) {
          const resNotas = await dispatch(getAllFromTable("Notas"));
          if (resNotas?.payload) setNotasActivas(resNotas.payload.reverse());
          setNewNotaContent("");
          setNewNotaPara("");
       }
    } catch (err) {
       console.error(err);
    }
    setLoading(false);
  };

  const systemButtons = [
    { label: "Comandas", icon: Wrench, onClick: () => navigate("/Comanda") },
    { label: "Manager", icon: Brain, onClick: () => navigate("/Manager") },
    { label: "Inventario", icon: Package, onClick: () => navigate("/Inventario") },
    { label: "Recetas", icon: BookOpen, onClick: () => navigate("/Recetas") },
    { label: "Agenda", icon: Calendar, onClick: () => navigate("/CalendarioProduccio") },
    { label: "Menu Print", icon: Printer, onClick: () => navigate("/MenuPrint") },
    { label: "Gastos", icon: DollarSign, onClick: () => navigate("/Gastos") },
    { label: "Modelos", icon: Users, onClick: () => navigate("/Model") },
    { label: "Venta/Compra", icon: CreditCard, onClick: () => navigate("/VentaCompra") },
    { label: "Eventos", icon: CalendarDays, onClick: () => navigate("/Agenda") },
    { label: "Proveedores", icon: Store, onClick: () => navigate("/Proveedores") },
    { label: "Ofertas", icon: Ticket, onClick: () => navigate("/EventosOffer") },
    { label: "Códigos", icon: Barcode, onClick: () => navigate("/Inventario/BarcodeManager") }
  ];

  const staffButtons = staffFound ? [
    { label: "Edit Info", icon: Settings, onClick: () => setActiveView("instance") },
    { label: "Turnos", icon: Clock, onClick: () => setActiveView("shift") },
    { label: "Compras", icon: ShoppingCart, onClick: () => navigate("/Compras") },
    ...(staffFound.isAdmin ? [
      { label: "Usuarios", icon: Users, onClick: () => navigate("/user-manager") },
      { label: "Staff", icon: Users, onClick: () => navigate("/staff-manager") },
      { label: "Nómina", icon: BarChart3, onClick: handleGoToNomina },
      { label: "Pagos", icon: DollarSign, onClick: () => navigate("/PagosProveedores") },
      { label: "Día", icon: CalendarDays, onClick: () => navigate("/DiaResumen") },
      { label: "Financiero", icon: Landmark, onClick: () => navigate("/productosFinanciero") },
      { label: "Almacén", icon: Store, onClick: () => navigate("/GestionAlmacen") },
      { label: "Mes", icon: Calendar, onClick: () => navigate("/MesResumen") }
    ] : [])
  ] : [];

  return (
    <PageLayout loading={loading}>
      <div className="bg-surface-main text-on-surface selection:bg-primary-fixed-dim selection:text-on-primary-fixed min-h-screen font-body-md pb-16">
        {/* TopAppBar */}
        <header className="bg-surface-main w-full z-10 flex justify-between items-center px-4 md:px-margin-desktop h-16 border-b border-surface-container relative">
          <div className="flex items-center gap-4 flex-1">
            <button className="text-primary-stitch hover:bg-surface-container transition-colors p-2 rounded-full active:scale-95 duration-150 shrink-0">
              <Menu size={24} />
            </button>
            <h1 className="text-headline-md font-bold text-primary-stitch hidden sm:block whitespace-nowrap">Portal Operativo</h1>

            <div className="flex-1 max-w-lg ml-auto mr-4 hidden md:block">
              <form className="w-full" onSubmit={handleSearch}>
                 <div className="flex gap-2">
                    <input 
                       type="text" 
                       value={ccInput}
                       onChange={(e) => setCcInput(e.target.value)}
                       placeholder="Cédula (CC)" 
                       className="w-1/3 min-w-[100px] bg-surface-main border border-primary-stitch/30 rounded-lg p-1.5 px-3 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
                       required
                    />
                    <input 
                       type="password" 
                       value={pinInput}
                       onChange={(e) => setPinInput(e.target.value)}
                       placeholder="PIN / Código" 
                       className="w-1/3 min-w-[100px] bg-surface-main border border-primary-stitch/30 rounded-lg p-1.5 px-3 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none"
                       required
                    />
                    <button type="submit" className="bg-primary-stitch text-white px-4 py-1.5 rounded-lg font-label-md hover:brightness-110 transition-all text-sm shrink-0">Ingresar</button>
                 </div>
              </form>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full relative">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-terracotta rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-surface-container">
              <div className="text-right hidden sm:block">
                <p className="text-label-md text-on-surface font-bold">{staffFound ? staffFound.Nombre : "Admin Centro"}</p>
                <p className="text-[10px] text-on-surface-variant uppercase">Estación 01</p>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed flex items-center justify-center bg-primary-fixed-dim text-primary-stitch font-bold">
                {staffFound ? staffFound.Nombre.charAt(0) : "A"}
              </div>
              {staffFound && (
                <button 
                  onClick={handleLogout}
                  className="ml-2 p-2 text-error hover:bg-error-container hover:text-error rounded-full transition-colors active:scale-95"
                  title="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="py-4 px-4 md:px-margin-desktop max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            
            {/* LEFT COLUMN: Comandas Activas */}
            <section className="lg:col-span-3 space-y-4 lg:sticky lg:top-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-primary-stitch flex items-center gap-2">
                  <Receipt size={24} />
                  Comandas Activas
                </h2>
                <span className="bg-primary-stitch text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {comandasActivas.length}
                </span>
              </div>
              <div className="space-y-4 max-h-[750px] overflow-auto pr-2 pb-4 scrollbar-thin">
                 {comandasActivas.map(item => (
                    <div key={item._id} className="bg-surface-card p-4 rounded-xl border border-outline-variant shadow-sm border-l-4 border-l-primary-stitch">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-label-md font-bold text-primary-stitch block mb-1">MESA {item.Mesa || "Gral"}</span>
                          <h3 className="font-body-md font-semibold text-on-surface leading-tight">{item.Tittle || "Sin Título"}</h3>
                          <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-2">{item.Notas || "Sin descripción"}</p>
                        </div>
                        <span className="bg-primary-stitch/10 text-primary-stitch text-[10px] font-bold px-2 py-1 rounded shrink-0 ml-2">ACTIVA</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-primary-stitch text-white font-label-md text-sm rounded-lg hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-1">
                           <Check size={16} /> Listo
                        </button>
                        <button className="px-3 py-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95">
                           <Printer size={16} />
                        </button>
                      </div>
                    </div>
                 ))}
                 {comandasActivas.length === 0 && (
                    <div className="text-center p-8 text-on-surface-variant text-body-sm bg-surface-card rounded-xl border border-outline-variant">
                       No hay comandas activas.
                    </div>
                 )}
              </div>
            </section>

            {/* CENTER COLUMN: Acceso al Sistema */}
            <section className="lg:col-span-6 space-y-4">
              
              {/* Controles de Staff - Mobile Only */}
              <div className="md:hidden bg-surface-card p-3 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
                <form className="w-full" onSubmit={handleSearch}>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         value={ccInput}
                         onChange={(e) => setCcInput(e.target.value)}
                         placeholder="Cédula (CC)" 
                         className="flex-1 bg-surface-main border border-outline-variant rounded-lg p-2 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none min-w-[80px]"
                         required
                      />
                      <input 
                         type="password" 
                         value={pinInput}
                         onChange={(e) => setPinInput(e.target.value)}
                         placeholder="PIN / Código" 
                         className="flex-1 bg-surface-main border border-outline-variant rounded-lg p-2 text-body-sm focus:ring-1 focus:ring-primary-stitch outline-none min-w-[80px]"
                         required
                      />
                      <button type="submit" className="bg-primary-stitch text-white px-4 py-2 rounded-lg font-label-md hover:brightness-110 transition-all shrink-0">Ingresar</button>
                   </div>
                </form>
              </div>
              
              {error && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm border border-error/20">
                  {error}
                </div>
              )}

              <h2 className="font-headline-sm text-headline-sm text-primary-stitch flex items-center gap-2">
                <Grid size={24} />
                Acceso al Sistema
              </h2>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {systemButtons.map((btn, idx) => {
                  const Icon = btn.icon;
                  return (
                    <button 
                      key={idx} 
                      onClick={btn.onClick}
                      className="flex flex-col items-center justify-center py-3 px-2 sm:p-4 bg-surface-card rounded-xl border border-outline-variant hover:border-primary-stitch hover:shadow-md transition-all group active:scale-95"
                    >
                      <Icon className="text-primary-stitch mb-1 sm:mb-2" size={28} strokeWidth={1.5} />
                      <span className="font-label-md text-on-surface-variant group-hover:text-primary-stitch text-center px-1 text-[11px] sm:text-[12px] leading-tight">{btn.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Botones del Staff seleccionado */}
              {staffFound && (
                <div className="mt-4 space-y-3">
                  <h2 className="font-headline-sm text-headline-sm text-secondary-stitch flex items-center gap-2 border-t border-outline-variant pt-4">
                    <Settings size={20} />
                    Acciones de {staffFound.Nombre} {staffFound.isAdmin && <span className="bg-primary-stitch text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">ADMIN</span>}
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                    {staffButtons.map((btn, idx) => {
                      const Icon = btn.icon;
                      return (
                        <button 
                          key={`staff-${idx}`} 
                          onClick={btn.onClick}
                          className="flex flex-col items-center justify-center py-3 px-2 sm:p-4 bg-surface-card rounded-xl border border-secondary-stitch/30 hover:border-secondary-stitch hover:shadow-md transition-all group active:scale-95"
                        >
                          <Icon className="text-secondary-stitch mb-1 sm:mb-2" size={28} strokeWidth={1.5} />
                          <span className="font-label-md text-on-surface-variant group-hover:text-secondary-stitch text-center px-1 text-[11px] sm:text-[12px] leading-tight">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vistas específicas de Staff (Turnos o Info) */}
              {activeView === "instance" && staffFound && (
                <div className="mt-6 bg-surface-card border border-outline-variant rounded-xl p-4 shadow-sm">
                  <h3 className="font-headline-sm mb-4 text-primary-stitch border-b pb-2">Editar Info</h3>
                  <StaffInstance staff={staffFound} editable />
                </div>
              )}

              {activeView === "shift" && staffFound && (
                <div className="mt-6 bg-surface-card border border-outline-variant rounded-xl p-4 shadow-sm">
                  <h3 className="font-headline-sm mb-4 text-primary-stitch border-b pb-2">Gestión de Turnos</h3>
                  <StaffShift staffId={staffFound._id} estaffid={staffFound._id} />
                </div>
              )}

            </section>

            {/* RIGHT COLUMN: Notas y Actividad */}
            <section className="lg:col-span-3 space-y-4">
              <h2 className="font-headline-sm text-headline-sm text-primary-stitch flex items-center gap-2">
                <FileEdit size={24} />
                Notas de Operación
              </h2>
              
              <div className="bg-surface-card rounded-xl border border-outline-variant p-4 shadow-sm mb-6">
                <textarea 
                  className="w-full bg-surface-main border border-outline-variant rounded-lg p-3 text-body-sm placeholder:text-outline focus:ring-1 focus:ring-primary-stitch min-h-[100px] resize-none outline-none" 
                  placeholder="Escribe una nota rápida..."
                  value={newNotaContent}
                  onChange={e => setNewNotaContent(e.target.value)}
                ></textarea>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="Para:" 
                      className="w-24 p-1.5 text-xs bg-surface-main rounded border border-outline-variant focus:ring-1 focus:ring-primary-stitch outline-none"
                      value={newNotaPara} onChange={e => setNewNotaPara(e.target.value)}
                    />
                    <button className="text-on-surface-variant hover:text-primary-stitch p-1.5 rounded-full hover:bg-surface-main transition-colors">
                      <Paperclip size={18} />
                    </button>
                  </div>
                  <button onClick={handleCrearNota} className="bg-success-sage text-white font-label-md px-4 py-1.5 rounded-lg hover:brightness-110 active:scale-95 transition-all">
                     Guardar
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-outline-variant">
                <h3 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-2">Actividad Reciente</h3>
                {notasActivas.slice(0, 8).map(nota => (
                  <div key={nota._id} className="flex gap-3 items-start p-3 bg-surface-card border-l-4 border-success-sage rounded-xl shadow-sm border border-outline-variant/50">
                    <div className="bg-success-sage/10 p-1.5 rounded-lg shrink-0">
                      <CheckCircle className="text-success-sage" size={18} />
                    </div>
                    <div>
                      <p className={`font-body-sm text-on-surface font-medium leading-tight ${nota.done ? 'line-through text-outline' : ''}`}>{nota.content}</p>
                      <span className="text-[10px] text-outline font-label-md uppercase mt-1.5 block">Para: {nota.para} • De: {nota.de}</span>
                    </div>
                  </div>
                ))}
                {notasActivas.length === 0 && (
                   <div className="text-center p-4 text-outline text-body-sm">
                      No hay notas recientes.
                   </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}

export default StaffPortal;