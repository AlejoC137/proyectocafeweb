import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, updateItem } from "../../../redux/actions";
import { USER_PREFERENCES } from "../../../redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  User,
  Search,
  MapPin,
  Phone,
  Mail,
  Gift,
  History,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Heart,
  ShieldCheck,
  Utensils,
  AlertTriangle,
  Flame,
  FileText,
  QrCode
} from "lucide-react";
import supabase from "../../../config/supabaseClient";
import ClientForm from "../ventaCompra/ClientForm";

export default function UserPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allUsers = useSelector((state) => state.allUserPreferences || []);

  const [loading, setLoading] = useState(!!localStorage.getItem("userPortalId"));
  const [accessInput, setAccessInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userSales, setUserSales] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, events, history, diet, settings
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({});
  const [dietForm, setDietForm] = useState({
    Alergies: {},
    noComo: [],
    primeDiet: [],
    Picante: 0,
    Notas: ""
  });

  const alergenosOptions = ["Frutos secos 🥜", "Mariscos 🦐", "Gluten 🌾", "Cerdo 🐷"];
  const noComoOptions = ["Cebolla 🧅", "Pepino 🥒", "Pimentón 🫑", "Plátano 🍌"];
  const dietOptions = [
    "Vegano 🌱", "Vegetariano 🥗", "Sin Gluten 🌾", "Sin Lactosa 🥛",
    "Bajo en Carbohidratos 🍚", "Bajo en Calorías 📉", "Alto en Proteínas 💪"
  ];

  useEffect(() => {
    if (allUsers.length === 0) {
      dispatch(getAllFromTable(USER_PREFERENCES));
    }
  }, [dispatch]);

  // Persistence logic
  useEffect(() => {
    const storedUserId = localStorage.getItem("userPortalId");
    if (storedUserId && !currentUser && allUsers.length > 0) {
      const user = allUsers.find(u => u._id === storedUserId);
      if (user) {
        loginUser(user);
      } else {
        localStorage.removeItem("userPortalId");
        setLoading(false);
      }
    } else if (!storedUserId) {
      setLoading(false);
    }
  }, [allUsers, currentUser]);

  const handleAccess = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const term = accessInput.trim().toLowerCase();
    const user = allUsers.find(u =>
      (u.email && u.email.toLowerCase() === term) ||
      (u.phone && String(u.phone) === term)
    );

    if (user) {
      if (user.password && !showPassword) {
        setShowPassword(true);
        setLoading(false);
        return;
      }

      if (user.password && passwordInput !== user.password) {
        setError("Contraseña incorrecta.");
        setLoading(false);
        return;
      }

      loginUser(user);
    } else {
      setError("No se encontró ningún usuario con ese correo o teléfono.");
      setLoading(false);
    }
  };

  const loginUser = async (user) => {
    setCurrentUser(user);
    setEditForm(user);
    localStorage.setItem("userPortalId", user._id);

    // Parse dietary preferences if they exist
    if (user.userPreferences) {
      try {
        const parsed = typeof user.userPreferences === 'string'
          ? JSON.parse(user.userPreferences)
          : user.userPreferences;
        setDietForm({
          Alergies: parsed.Alergies || {},
          noComo: parsed.noComo || [],
          primeDiet: parsed.primeDiet || [],
          Picante: parsed.Picante || 0,
          Notas: parsed.Notas || ""
        });
      } catch (e) {
        console.error("Error parsing userPreferences", e);
      }
    }

    setLoading(true);

    try {
      const { data: sales, error: salesErr } = await supabase
        .from("Ventas")
        .select("*")
        .eq("Cliente", user._id)
        .order("Date", { ascending: false });

      if (!salesErr) setUserSales(sales || []);

      const { data: events, error: eventsErr } = await supabase
        .from("attendees")
        .select("*, agenda:evento_id(*)")
        .or(`email.eq.${user.email},telefono.eq.${user.phone},usuario_id.eq.${user._id}`);

      if (!eventsErr) setUserEvents(events || []);

    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser?._id) return;
    setIsUpdating(true);
    try {
      await dispatch(updateItem(
        currentUser._id,
        {
          name: editForm.name,
          phone: editForm.phone ? parseInt(editForm.phone) : null,
          address: editForm.address,
          password: editForm.password,
          userPreferences: JSON.stringify(dietForm)
        },
        USER_PREFERENCES
      ));

      const updatedUser = { ...currentUser, ...editForm, userPreferences: JSON.stringify(dietForm) };
      setCurrentUser(updatedUser);
      alert("Información actualizada correctamente.");
    } catch (err) {
      console.error("Error update profile:", err);
      alert("Hubo un error al actualizar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAccessInput("");
    setPasswordInput("");
    setShowPassword(false);
    setUserSales([]);
    setUserEvents([]);
    setActiveTab("overview");
    localStorage.removeItem("userPortalId");
  };

  if (!currentUser) {
    return (
      <PageLayout loading={loading}>
        <div className="flex items-center justify-center min-h-[70vh] p-4">
          <div className="max-w-md w-full">
            {isRegistering ? (
              <ClientForm
                onClose={() => setIsRegistering(false)}
                initialData={accessInput}
              />
            ) : (
              <ContentCard className="shadow-2xl border-sage-green/20">
                <div className="text-center mb-8">
                  <div className="bg-sage-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-sage-green" />
                  </div>
                  <h2 className="text-2xl font-bold text-not-black font-SpaceGrotesk">Bienvenido a Proyecto Café</h2>
                  <p className="text-gray-500 text-sm">Ingresa tus datos para gestionar tu información</p>
                </div>

                <form onSubmit={handleAccess} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Correo Electrónico o Teléfono</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="ejemplo@correo.com o 3001234567"
                        value={accessInput}
                        onChange={(e) => setAccessInput(e.target.value)}
                        required
                        className="pl-10"
                        disabled={showPassword}
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  {showPassword && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-sm font-medium text-gray-700">Contraseña</label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="********"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          required
                          className="pl-10"
                          autoFocus
                        />
                        <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      </div>
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(false)}
                          className="text-xs text-sage-green hover:underline font-bold"
                        >
                          Regresar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const message = `hola soy , - ${accessInput} - puedes recordarme la clave de usuario ?`;
                            window.open(`https://wa.me/573008214593?text=${encodeURIComponent(message)}`, "_blank");
                          }}
                          className="text-[10px] text-gray-400 hover:text-sage-green font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> ¿Olvidaste tu clave?
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="space-y-2">
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const message = `Hola soy ,  ${accessInput}  puedes recordarme la clave de usuario ?`;
                          window.open(`https://wa.me/573008214593?text=${encodeURIComponent(message)}`, "_blank");
                        }}
                        className="w-full text-xs text-sage-green hover:bg-sage-green/5 font-bold gap-2"
                      >
                        <Phone className="w-3 h-3" /> ¿Olvidaste tu contraseña? Escríbenos
                      </Button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-sage-green hover:bg-sage-green/90 text-white py-6 text-lg font-bold shadow-lg shadow-sage-green/20"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : showPassword ? "Acceder" : "Continuar"}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t text-center space-y-4">
                  <p className="text-xs text-gray-400 italic">
                    ¿No tienes cuenta aún?
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsRegistering(true)}
                    className="w-full border-sage-green text-sage-green hover:bg-sage-green/5 font-bold"
                  >
                    Crear mi cuenta ahora
                  </Button>
                </div>
              </ContentCard>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout loading={loading}>
      <div className="container mx-auto p-4 pb-24">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="animate-in fade-in slide-in-from-left-4">
            <h1 className="text-4xl font-bold text-not-black font-SpaceGrotesk">Hola, {currentUser.name || 'Usuario'}!</h1>
            <p className="text-gray-500 font-medium">Gestiona tu experiencia en Proyecto Café</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all hover:scale-105">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          <div className="lg:col-span-1 space-y-6">
            <ContentCard className="p-2 border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <nav className="flex flex-col gap-1">
                {[
                  { id: "overview", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
                  { id: "events", label: "Eventos", icon: <Calendar className="w-4 h-4" /> },
                  { id: "diet", label: "Alimentación", icon: <Utensils className="w-4 h-4" /> },
                  { id: "history", label: "Compras", icon: <History className="w-4 h-4" /> },
                  { id: "settings", label: "Perfil", icon: <Settings className="w-4 h-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                      ? "bg-sage-green text-white shadow-lg shadow-sage-green/30 translate-x-2"
                      : "text-gray-500 hover:bg-sage-green/5 hover:text-sage-green"
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </nav>
            </ContentCard>

            <div className="bg-gradient-to-br from-cobalt-blue to-blue-600 p-8 rounded-3xl text-white shadow-2xl overflow-hidden relative group cursor-pointer transition-transform hover:scale-[1.02]">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <QrCode size={200} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Gift className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Loyalty Card</span>
                </div>
                <p className="text-sm opacity-80 font-bold uppercase tracking-tighter">Puntos de Lealtad</p>
                <h2 className="text-5xl font-black mt-2 font-SpaceGrotesk">{currentUser.loyalty_points || 0}</h2>
                <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] opacity-70 uppercase font-black">Tu saldo actual</p>
                    <p className="text-xl font-black">${new Intl.NumberFormat('es-CO').format((currentUser.loyalty_points || 0) * (parseInt(import.meta.env.VITE_POINTS_REDEMPTION_VALUE) || 1))} <span className="text-[10px] opacity-60">COP</span></p>
                  </div>
                  <div className="animate-pulse">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 pb-8">

            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ContentCard title="Próximos Eventos" icon={<Calendar className="text-sage-green" />} className="h-full border-none shadow-lg">
                    {userEvents.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        {userEvents.slice(0, 3).map((reg) => (
                          <div 
                            key={reg._id} 
                            onClick={() => navigate(`/EventosOffer?id=${reg.agenda?._id}`)}
                            className="flex justify-between items-center p-4 bg-sage-green/5 rounded-2xl border border-sage-green/10 hover:border-sage-green/30 transition-all cursor-pointer hover:scale-[1.01] shadow-sm"
                          >
                            <div>
                              <p className="font-bold text-not-black">{reg.agenda?.nombreES || "Evento Especial"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar size={12} className="text-gray-400" />
                                <p className="text-[10px] text-gray-500 font-medium">{reg.agenda?.fecha || "Pendiente"}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${reg.estado_pago === 'pagado' || reg.estado_pago === 'gratis'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {reg.estado_pago}
                            </span>
                          </div>
                        ))}
                        {userEvents.length > 3 && (
                          <button onClick={() => setActiveTab("events")} className="group flex items-center justify-center gap-2 text-xs text-sage-green font-black hover:underline w-full py-2">
                            Ver todos los eventos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                          <Calendar className="opacity-20" size={32} />
                        </div>
                        <p className="font-medium">No tienes inscripciones activas.</p>
                        <Button variant="link" onClick={() => navigate("/EventosOffer")} className="text-sage-green font-bold">Ver agenda de eventos</Button>
                      </div>
                    )}
                  </ContentCard>

                  <ContentCard title="Compras Recientes" icon={<History className="text-terracotta-accent" />} className="h-full border-none shadow-lg">
                    {userSales.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        {userSales.slice(0, 3).map((sale) => (
                          <div key={sale._id} className="p-4 bg-terracotta-accent/5 border border-terracotta-accent/10 rounded-2xl hover:border-terracotta-accent/30 transition-all">
                            <div className="flex justify-between font-bold text-sm">
                              <span className="text-gray-600">{sale.Date}</span>
                              <span className="text-terracotta-accent font-black">$ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Utensils size={12} className="text-gray-400" />
                              <p className="text-[10px] text-gray-500 font-medium truncate">
                                {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                              </p>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setActiveTab("history")} className="group flex items-center justify-center gap-2 text-xs text-terracotta-accent font-black hover:underline w-full py-2">
                          Ver historial de compras <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                          <History className="opacity-20" size={32} />
                        </div>
                        <p className="font-medium">Aún no hay compras registradas.</p>
                      </div>
                    )}
                  </ContentCard>
                </div>

                <ContentCard title="Resumen de Perfil" className="border-none shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
                      <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-sage-green" />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Email</p>
                      <p className="font-bold text-not-black truncate">{currentUser.email || 'No registrado'}</p>
                    </div>
                    <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
                      <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5 text-sage-green" />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Teléfono</p>
                      <p className="font-bold text-not-black">{currentUser.phone || 'No registrado'}</p>
                    </div>
                    <div className="group p-5 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all md:col-span-2 lg:col-span-1">
                      <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-sage-green" />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Dirección</p>
                      <p className="font-bold text-not-black truncate">{currentUser.address || 'No registrada'}</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-sage-green/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-xs font-bold text-gray-500">Cuenta Verificada</p>
                    </div>
                    <Button variant="ghost" onClick={() => setActiveTab("settings")} className="text-sage-green font-black gap-2">
                      Editar Perfil <ChevronRight size={14} />
                    </Button>
                  </div>
                </ContentCard>
              </div>
            )}

            {activeTab === "events" && (
              <ContentCard title="Mis Inscripciones a Eventos" className="border-none shadow-xl">
                <div className="space-y-6">
                  {userEvents.length > 0 ? (
                    userEvents.map((reg) => (
                      <div 
                        key={reg._id} 
                        onClick={() => navigate(`/EventosOffer?id=${reg.agenda?._id}`)}
                        className="flex flex-col md:flex-row gap-6 p-6 border rounded-3xl hover:border-sage-green/40 hover:shadow-lg transition-all group cursor-pointer"
                      >
                        {reg.agenda?.bannerIMG ? (
                          <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-md">
                            <img src={reg.agenda.bannerIMG} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                          </div>
                        ) : (
                          <div className="w-full md:w-48 h-32 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                            <Calendar size={32} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-black text-2xl text-not-black font-SpaceGrotesk">{reg.agenda?.nombreES || "Evento Especial"}</h3>
                            <span className={`text-[10px] px-4 py-1.5 rounded-full font-black tracking-widest ${reg.estado_pago === 'pagado' || reg.estado_pago === 'gratis'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {reg.estado_pago.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                            <p className="flex items-center gap-2 font-bold"><Calendar size={18} className="text-sage-green" /> {reg.agenda?.fecha || 'Próximamente'}</p>
                            <p className="flex items-center gap-2 font-bold"><User size={18} className="text-sage-green" /> {reg.nombre}</p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {reg.dieta_especial && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black flex items-center gap-1 border border-emerald-100">
                                <Utensils size={10} /> DIETA: {reg.dieta_especial}
                              </span>
                            )}
                            {reg.telefono && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black flex items-center gap-1 border border-blue-100">
                                <Phone size={10} /> {reg.telefono}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-24 text-gray-400">
                      <Calendar className="mx-auto mb-4 opacity-10" size={64} />
                      <p className="font-bold text-lg">No tienes eventos registrados actualmente.</p>
                      <Button onClick={() => navigate("/EventosOffer")} className="mt-4 bg-sage-green text-white font-bold">Ver próximos eventos</Button>
                    </div>
                  )}
                </div>
              </ContentCard>
            )}

            {activeTab === "diet" && (
              <ContentCard title="Gestión de Perfil Alimenticio" className="border-none shadow-xl">
                <div className="space-y-10 py-4">
                  <div className="bg-sage-green/5 p-6 rounded-3xl border border-sage-green/10">
                    <h3 className="text-xl font-black text-sage-green mb-6 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6" /> Alergias y Restricciones
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Alergias Conocidas</label>
                        <div className="grid grid-cols-1 gap-4">
                          {alergenosOptions.map(al => (
                            <div key={al} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
                              <Checkbox
                                id={`al-${al}`}
                                checked={!!dietForm.Alergies[al]}
                                onCheckedChange={(checked) => setDietForm({
                                  ...dietForm,
                                  Alergies: { ...dietForm.Alergies, [al]: checked }
                                })}
                              />
                              <Label htmlFor={`al-${al}`} className="font-bold text-gray-700 cursor-pointer flex-1">{al}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Ingredientes "No Como"</label>
                        <div className="grid grid-cols-1 gap-4">
                          {noComoOptions.map(nc => (
                            <div key={nc} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
                              <Checkbox
                                id={`nc-${nc}`}
                                checked={dietForm.noComo.includes(nc)}
                                onCheckedChange={(checked) => {
                                  const newNC = checked
                                    ? [...dietForm.noComo, nc]
                                    : dietForm.noComo.filter(i => i !== nc);
                                  setDietForm({ ...dietForm, noComo: newNC });
                                }}
                              />
                              <Label htmlFor={`nc-${nc}`} className="font-bold text-gray-700 cursor-pointer flex-1">{nc}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-cobalt-blue flex items-center gap-3">
                        <Heart className="w-6 h-6" /> Dieta Principal
                      </h3>
                      <Select
                        value={dietForm.primeDiet && dietForm.primeDiet[0] ? dietForm.primeDiet[0] : ""}
                        onValueChange={(val) => setDietForm({ ...dietForm, primeDiet: [val] })}
                      >
                        <SelectTrigger className="w-full py-6 rounded-2xl font-bold bg-white border-gray-200 focus:ring-sage-green">
                          <SelectValue placeholder="Selecciona tu dieta" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-sage-green/20">
                          {dietOptions.map(d => (
                            <SelectItem key={d} value={d} className="font-bold py-3">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="pt-4 space-y-4">
                        <h4 className="font-black text-amber-600 flex items-center gap-2">
                          <Flame size={18} /> Nivel de Picante
                        </h4>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => setDietForm({ ...dietForm, Picante: n })}
                              className={`flex-1 py-3 rounded-xl font-black transition-all ${dietForm.Picante >= n
                                ? "bg-amber-500 text-white shadow-md shadow-amber-200 scale-105"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-sage-green flex items-center gap-3">
                        <FileText className="w-6 h-6" /> Notas Adicionales
                      </h3>
                      <textarea
                        value={dietForm.Notas || ""}
                        onChange={(e) => setDietForm({ ...dietForm, Notas: e.target.value })}
                        className="w-full h-[180px] p-4 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-sage-green outline-none font-medium resize-none shadow-inner"
                        placeholder="Escribe aquí cualquier otra preferencia, alergia no listada o detalle importante..."
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t flex justify-end">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdating}
                      className="bg-sage-green hover:bg-sage-green/90 text-white font-black px-12 py-7 rounded-3xl shadow-xl shadow-sage-green/30 text-lg transition-all hover:scale-105"
                    >
                      {isUpdating ? "Sincronizando..." : "Actualizar Perfil Alimenticio"}
                    </Button>
                  </div>
                </div>
              </ContentCard>
            )}

            {activeTab === "history" && (
              <ContentCard title="Historial Completo de Consumos" className="border-none shadow-xl">
                <div className="overflow-hidden rounded-3xl border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 font-black">
                        <tr>
                          <th className="px-6 py-5 tracking-widest leading-none">Fecha / Hora</th>
                          <th className="px-6 py-5 tracking-widest leading-none">Ítems Consumidos</th>
                          <th className="px-6 py-5 text-right tracking-widest leading-none">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userSales.map((sale) => (
                          <tr key={sale._id} className="hover:bg-sage-green/5 transition-colors group">
                            <td className="px-6 py-5 font-bold text-gray-600 whitespace-nowrap">{sale.Date}</td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-not-black max-w-sm">
                                {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                              </p>
                              {sale.Mesa && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Servicio en {sale.Mesa}</span>}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-sage-green text-lg">
                              $ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}
                            </td>
                          </tr>
                        ))}
                        {userSales.length === 0 && (
                          <tr>
                            <td colSpan="3" className="px-6 py-20 text-center text-gray-400">
                              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                                <History className="opacity-10" size={32} />
                              </div>
                              <p className="font-bold">Aún no tienes movimientos registrados en el sistema.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ContentCard>
            )}

            {activeTab === "settings" && (
              <ContentCard title="Configuración de Perfil Personal" className="border-none shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-4">
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <User size={20} className="text-sage-green" /> Información Básica
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Teléfono Móvil</label>
                        <Input
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Dirección Registrada</label>
                        <Input
                          value={editForm.address || ""}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="py-6 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-amber-500" /> Seguridad de Acceso
                    </h4>
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1">Contraseña Nueva</label>
                        <Input
                          type="password"
                          placeholder="Ingresa nueva contraseña si deseas cambiarla"
                          value={editForm.password || ""}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="py-6 rounded-2xl font-bold bg-white border-amber-100 focus:ring-amber-500"
                        />
                      </div>
                      <p className="text-xs text-amber-700/70 font-medium leading-relaxed bg-white/50 p-4 rounded-xl">
                        ⚠️ **Nota importante:** Tu contraseña te permite acceder a este portal y agiliza tus próximas inscripciones a eventos y compras. No la compartas con nadie.
                      </p>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="flex-1 bg-sage-green hover:bg-sage-green/90 text-white font-black py-7 rounded-3xl shadow-lg shadow-sage-green/20"
                      >
                        {isUpdating ? "Guardando..." : "Guardar Perfil"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setEditForm(currentUser); setActiveTab("overview"); }}
                        disabled={isUpdating}
                        className="font-bold py-7 rounded-3xl text-gray-500"
                      >
                        Descartar
                      </Button>
                    </div>
                  </div>
                </div>
              </ContentCard>
            )}

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
