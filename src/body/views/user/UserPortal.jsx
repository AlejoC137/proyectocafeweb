import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllFromTable, updateItem } from "../../../redux/actions";
import { USER_PREFERENCES, AGENDA } from "../../../redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  Flame,
  FileText,
  QrCode,
  Bell,
  MessageSquare,
  Sparkles,
  User,
  Mail,
  ShieldCheck,
  Phone,
  LogOut,
  TrendingUp,
  Calendar,
  Utensils,
  History,
  Settings,
  ChevronRight,
  Gift,
  Heart,
  MapPin,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle
} from "lucide-react";
import supabase from "../../../config/supabaseClient";
import ClientForm from "../ventaCompra/ClientForm";

export default function UserPortal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allUsers = useSelector((state) => state.allUserPreferences || []);
  const allAgenda = useSelector((state) => state.allAgenda || []);

  const [loading, setLoading] = useState(!!localStorage.getItem("userPortalId"));
  const [accessInput, setAccessInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userSales, setUserSales] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, events, history, diet, settings, messages
  const [isRegistering, setIsRegistering] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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

  useEffect(() => {
    if (allAgenda.length === 0) {
      dispatch(getAllFromTable(AGENDA));
    }
  }, [dispatch, allAgenda.length]);

  const proximoEvento = useMemo(() => {
    if (!allAgenda.length) return null;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = allAgenda
      .filter(e => e.fecha >= today && (e.estado === 'aprobado' || !e.estado))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return upcoming[0] || null;
  }, [allAgenda]);

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

    fetchUserMessages(user._id);
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from("UserMessages")
        .update({ isRead: true })
        .eq("_id", messageId);

      if (error) throw error;

      // Actualizar localmente
      setUserMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isRead: true } : m
      ));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const fetchUserMessages = async (userId) => {
    setMessagesLoading(true);
    try {
      // Buscamos mensajes para el usuario específico O mensajes globales (userId is null)
      const { data, error } = await supabase
        .from("UserMessages")
        .select("*")
        .or(`userId.eq.${userId},userId.is.null`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
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
    setUserMessages([]);
    setActiveTab("overview");
    localStorage.removeItem("userPortalId");
  };

  if (!currentUser) {
    return (
      <PageLayout loading={loading}>
        <div className="flex items-center justify-center min-h-[70vh] p-1">
          <div className="max-w-md w-full">
            {isRegistering ? (
              <ClientForm
                onClose={() => setIsRegistering(false)}
                initialData={accessInput}
              />
            ) : (
              <ContentCard className="shadow-2xl border-sage-green/20">
                <div className="text-center mb-1">
                  <div className="bg-sage-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-1">
                    <User className="w-8 h-8 text-sage-green" />
                  </div>
                  <h2 className="text-2xl font-bold text-not-black font-SpaceGrotesk">Bienvenido a Proyecto Café</h2>
                  <p className="text-gray-500 text-sm">Ingresa tus datos para gestionar tu información</p>
                </div>

                <form onSubmit={handleAccess} className="space-y-1">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Correo Electrónico o Teléfono</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="ejemplo@correo.com o 3001234567"
                        value={accessInput}
                        onChange={(e) => setAccessInput(e.target.value)}
                        required
                        className="pl-1"
                        disabled={showPassword}
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  {showPassword && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                      <label className="text-sm font-medium text-gray-700">Contraseña</label>
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="********"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          required
                          className="pl-1"
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
                    <div className="space-y-1">
                      <p className="text-sm text-red-500 font-medium">{error}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const message = `Hola soy ,  ${accessInput}  puedes recordarme la clave de usuario ?`;
                          window.open(`https://wa.me/573008214593?text=${encodeURIComponent(message)}`, "_blank");
                        }}
                        className="w-full text-xs text-sage-green hover:bg-sage-green/5 font-bold gap-1"
                      >
                        <Phone className="w-3 h-3" /> ¿Olvidaste tu contraseña? Escríbenos
                      </Button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-sage-green hover:bg-sage-green/90 text-white py-1 text-lg font-bold shadow-lg shadow-sage-green/20"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : showPassword ? "Acceder" : "Continuar"}
                  </Button>
                </form>

                <div className="mt-1 pt-1 border-t text-center space-y-1">
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
      {/* Toast Notification / Micro-interacciones */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-not-black text-white px-1 py-1 rounded-full shadow-2xl flex items-center gap-1 font-bold text-sm">
            <div className="bg-green-500/20 p-1 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            {toastMsg}
          </div>
        </div>
      )}

      <div className="container mx-auto p-1 pb-1 max-w-7xl">

        {/* NEW TOP SECTION: Perfil & Progreso (Jerarquía Visual & Anatomía del Perfil) */}
        <div className="bg-white rounded-xl p-1 mb-1 shadow-md border border-sage-green/10 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="absolute top-0 right-0 -mr-1 -mt-1 w-80 h-80 bg-sage-green/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-1 -mb-1 w-80 h-80 bg-cobalt-blue/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-1 relative z-10 flex-col md:flex-row p-1 m-1">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sage-green to-cobalt-blue flex items-center justify-center text-white text-3xl font-black shadow-md shrink-0 border-2 border-white m-1">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-1 border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all hover:scale-105">
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            <div className="lg:col-span-1 space-y-1">
              <ContentCard className="p-1 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <nav className="flex flex-col gap-1">
                  {[
                    { id: "overview", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
                    { id: "events", label: "Eventos", icon: <Calendar className="w-4 h-4" /> },
                    {
                      id: "messages", label: "Mensajes", icon: (
                        <div className="relative">
                          <Bell className="w-4 h-4" />
                          {userMessages.some(m => !m.isRead) && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                          )}
                        </div>
                      )
                    },
                    { id: "diet", label: "Alimentación", icon: <Utensils className="w-4 h-4" /> },
                    { id: "history", label: "Compras", icon: <History className="w-4 h-4" /> },
                    { id: "settings", label: "Perfil", icon: <Settings className="w-4 h-4" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 px-1 py-1 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                        ? "bg-sage-green text-white shadow-lg shadow-sage-green/30 translate-x-1"
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

              <div className="bg-gradient-to-br from-cobalt-blue to-blue-600 p-1 rounded-3xl text-white shadow-2xl overflow-hidden relative group cursor-pointer transition-transform hover:scale-[1.02]">
                <div className="absolute -right-1 -bottom-1 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <QrCode size={200} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-1">
                    <div className="bg-white/20 p-1 rounded-2xl">
                      <Gift className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-1 py-1 rounded-full"></span>
                  </div>
                  <p className="text-sm opacity-80 font-bold uppercase tracking-tighter">Puntos</p>
                  <h2 className="text-5xl font-black mt-1 font-SpaceGrotesk">{currentUser.loyalty_points || 0}</h2>
                  <div className="mt-1 pt-1 border-t border-white/20 flex justify-between items-end">
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
                <div className="space-y-1 animate-in fade-in duration-500">

                  {/* Vitrina de Próximo Evento - High Impact Hero Section */}
                  {proximoEvento && (
                    <div
                      onClick={() => navigate(`/EventosOffer?id=${proximoEvento._id.substring(0, 8)}`)}
                      className="relative w-full h-[350px] md:h-[450px] rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer mb-1 group border border-sage-green/10"
                    >
                      {proximoEvento.bannerIMG ? (
                        <img
                          src={proximoEvento.bannerIMG}
                          alt={proximoEvento.nombreES}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sage-green to-cobalt-blue flex items-center justify-center">
                          <Calendar className="w-20 h-20 text-white/20" />
                        </div>
                      )}

                      {/* Overlay Gradiente Premium */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-1 md:p-1">
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="bg-sage-green text-white px-1 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block shadow-lg">
                              Próximo Evento
                            </span>
                            <span className="bg-white/20 backdrop-blur-md text-white px-1 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border border-white/10">
                              ¡Inscríbete ya!
                            </span>
                          </div>

                          <h2 className="text-4xl md:text-6xl font-black text-white mb-1 font-SpaceGrotesk tracking-tighter">
                            {proximoEvento.nombreES || proximoEvento.nombre}
                          </h2>

                          <div className="flex flex-wrap items-center gap-1 text-white/90 font-bold">
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-1 py-1 rounded-2xl border border-white/10">
                              <Calendar className="w-5 h-5 text-sage-green" />
                              <span className="text-sm md:text-base">
                                {new Date(proximoEvento.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-1 py-1 rounded-2xl border border-white/10">
                              <Clock className="w-5 h-5 text-sage-green" />
                              <span className="text-sm md:text-base">{proximoEvento.horaInicio}</span>
                            </div>
                            {proximoEvento.valor && (
                              <div className="flex items-center gap-1 bg-sage-green/90 px-1 py-1 rounded-2xl shadow-xl">
                                <span className="text-sm md:text-base font-black">
                                  {proximoEvento.valor === "0" ? "GRATIS" : proximoEvento.valor}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón flotante de acción */}
                      <div className="absolute top-1 right-1 bg-white text-black p-1 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 flex items-center justify-center">
                        <ExternalLink className="w-6 h-6" />
                      </div>

                      {/* Efecto de Brillo al pasar el mouse */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  )}

                  {/* Banner de Bienvenida o Mensaje Importante */}
                  {userMessages.length > 0 && userMessages[0] && (
                    <div
                      onClick={() => setActiveTab("messages")}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1 rounded-3xl shadow-xl cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      <div className="bg-white/10 backdrop-blur-md p-1 rounded-[22px] text-white flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="bg-white/20 p-1 rounded-2xl animate-bounce">
                            {userMessages[0].type === 'welcome' ? <Sparkles className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mensaje Reciente</p>
                            <h3 className="text-xl font-bold font-SpaceGrotesk">{userMessages[0].title}</h3>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 opacity-50" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <ContentCard title="Próximos Eventos" icon={<Calendar className="text-sage-green" />} className="h-full border-none shadow-lg">
                      {userEvents.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {userEvents.slice(0, 3).map((reg) => (
                            <div
                              key={reg._id}
                              onClick={() => navigate(`/EventosOffer?id=${reg.agenda?._id}`)}
                              className="flex justify-between items-center p-1 bg-sage-green/5 rounded-2xl border border-sage-green/10 hover:border-sage-green/30 transition-all cursor-pointer hover:scale-[1.01] shadow-sm"
                            >
                              <div>
                                <p className="font-bold text-not-black">{reg.agenda?.nombreES || "Evento Especial"}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar size={12} className="text-gray-400" />
                                  <p className="text-[10px] text-gray-500 font-medium">{reg.agenda?.fecha || "Pendiente"}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] px-1 py-1 rounded-full font-black uppercase ${reg.estado_pago === 'pagado' || reg.estado_pago === 'gratis'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {reg.estado_pago}
                              </span>
                            </div>
                          ))}
                          {userEvents.length > 3 && (
                            <button onClick={() => setActiveTab("events")} className="group flex items-center justify-center gap-1 text-xs text-sage-green font-black hover:underline w-full py-1">
                              Ver todos los eventos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-1 text-gray-400">
                          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-1 border border-dashed">
                            <Calendar className="opacity-20" size={32} />
                          </div>
                          <p className="font-medium">No tienes inscripciones activas.</p>
                          <Button variant="link" onClick={() => navigate("/EventosOffer")} className="text-sage-green font-bold">Ver agenda de eventos</Button>
                        </div>
                      )}
                    </ContentCard>

                    <ContentCard title="Compras Recientes" icon={<History className="text-terracotta-accent" />} className="h-full border-none shadow-lg">
                      {userSales.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {userSales.slice(0, 3).map((sale) => (
                            <div key={sale._id} className="p-1 bg-terracotta-accent/5 border border-terracotta-accent/10 rounded-2xl hover:border-terracotta-accent/30 transition-all">
                              <div className="flex justify-between font-bold text-sm">
                                <span className="text-gray-600">{sale.Date}</span>
                                <span className="text-terracotta-accent font-black">$ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Utensils size={12} className="text-gray-400" />
                                <p className="text-[10px] text-gray-500 font-medium truncate">
                                  {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                                </p>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => setActiveTab("history")} className="group flex items-center justify-center gap-1 text-xs text-terracotta-accent font-black hover:underline w-full py-1">
                            Ver historial de compras <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-1 text-gray-400">
                          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-1 border border-dashed">
                            <History className="opacity-20" size={32} />
                          </div>
                          <p className="font-medium">Aún no hay compras registradas.</p>
                        </div>
                      )}
                    </ContentCard>
                  </div>

                  <ContentCard title="Resumen de Perfil" className="border-none shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                      <div className="group p-1 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
                        <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Mail className="w-5 h-5 text-sage-green" />
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Email</p>
                        <p className="font-bold text-not-black truncate">{currentUser.email || 'No registrado'}</p>
                      </div>
                      <div className="group p-1 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all">
                        <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <Phone className="w-5 h-5 text-sage-green" />
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Teléfono</p>
                        <p className="font-bold text-not-black">{currentUser.phone || 'No registrado'}</p>
                      </div>
                      <div className="group p-1 bg-cream-bg/50 rounded-3xl border border-sage-green/5 hover:border-sage-green/20 transition-all md:col-span-2 lg:col-span-1">
                        <div className="bg-sage-green/10 w-10 h-10 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5 text-sage-green" />
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Dirección</p>
                        <p className="font-bold text-not-black truncate">{currentUser.address || 'No registrada'}</p>
                      </div>
                    </div>
                    <div className="mt-1 pt-1 border-t border-sage-green/10 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs font-bold text-gray-500">Cuenta Verificada</p>
                      </div>
                      <Button variant="ghost" onClick={() => setActiveTab("settings")} className="text-sage-green font-black gap-1">
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

              {activeTab === "messages" && (
                <ContentCard title="Centro de Notificaciones" icon={<Bell className="text-purple-600" />} className="border-none shadow-xl">
                  <div className="space-y-1 py-1">
                    {messagesLoading ? (
                      <div className="text-center py-1 text-gray-400">Cargando mensajes...</div>
                    ) : userMessages.length > 0 ? (
                      userMessages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`p-1 rounded-3xl border transition-all ${msg.type === 'welcome' ? 'bg-emerald-50/50 border-emerald-100' :
                            msg.type === 'promo' ? 'bg-amber-50/50 border-amber-100' :
                              'bg-indigo-50/50 border-indigo-100'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1">
                              <div className={`p-1 rounded-xl ${msg.type === 'welcome' ? 'bg-emerald-100 text-emerald-600' :
                                msg.type === 'promo' ? 'bg-amber-100 text-amber-600' :
                                  'bg-indigo-100 text-indigo-600'
                                }`}>
                                {msg.type === 'welcome' ? <Sparkles size={18} /> :
                                  msg.type === 'promo' ? <Gift size={18} /> :
                                    <MessageSquare size={18} />}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{msg.title}</h3>
                                <p className="text-[10px] text-gray-500 font-medium">
                                  {new Date(msg.created_at).toLocaleDateString('es-CO', {
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            {msg.userId === null && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1 py-1 rounded-full font-black uppercase tracking-tighter">Global</span>
                            )}
                            {!msg.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(msg._id)}
                                className="text-[10px] bg-blue-600 text-white px-1 py-1 rounded-full font-bold hover:bg-blue-700 transition-colors"
                              >
                                Marcar como leído
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed pl-1">
                            {msg.content}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-1 text-gray-400">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-1 border border-dashed">
                          <Bell className="opacity-10" size={32} />
                        </div>
                        <p className="font-bold text-lg">No tienes mensajes nuevos.</p>
                        <p className="text-sm">Aquí verás anuncios, promociones y mensajes de bienvenida.</p>
                      </div>
                    )}
                  </div>
                </ContentCard>
              )}

              {activeTab === "diet" && (
                <ContentCard title="Gestión de Perfil Alimenticio" className="border-none shadow-xl">
                  <div className="space-y-1 py-1">
                    <div className="bg-sage-green/5 p-1 rounded-3xl border border-sage-green/10">
                      <h3 className="text-xl font-black text-sage-green mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-6 h-6" /> Alergias y Restricciones
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        <div className="space-y-1">
                          <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Alergias Conocidas</label>
                          <div className="grid grid-cols-1 gap-1">
                            {alergenosOptions.map(al => (
                              <div key={al} className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
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

                        <div className="space-y-1">
                          <label className="text-sm font-black text-gray-600 uppercase tracking-widest pl-1">Ingredientes "No Como"</label>
                          <div className="grid grid-cols-1 gap-1">
                            {noComoOptions.map(nc => (
                              <div key={nc} className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 hover:border-sage-green transition-colors cursor-pointer">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-cobalt-blue flex items-center gap-1">
                          <Heart className="w-6 h-6" /> Dieta Principal
                        </h3>
                        <Select
                          value={dietForm.primeDiet && dietForm.primeDiet[0] ? dietForm.primeDiet[0] : ""}
                          onValueChange={(val) => setDietForm({ ...dietForm, primeDiet: [val] })}
                        >
                          <SelectTrigger className="w-full py-1 rounded-2xl font-bold bg-white border-gray-200 focus:ring-sage-green">
                            <SelectValue placeholder="Selecciona tu dieta" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-sage-green/20">
                            {dietOptions.map(d => (
                              <SelectItem key={d} value={d} className="font-bold py-1">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="pt-1 space-y-1">
                          <h4 className="font-black text-amber-600 flex items-center gap-1">
                            <Flame size={18} /> Nivel de Picante
                          </h4>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button
                                key={n}
                                onClick={() => setDietForm({ ...dietForm, Picante: n })}
                                className={`flex-1 py-1 rounded-xl font-black transition-all ${dietForm.Picante >= n
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

                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-sage-green flex items-center gap-1">
                          <FileText className="w-6 h-6" /> Notas Adicionales
                        </h3>
                        <textarea
                          value={dietForm.Notas || ""}
                          onChange={(e) => setDietForm({ ...dietForm, Notas: e.target.value })}
                          className="w-full h-[180px] p-1 rounded-3xl border border-gray-200 focus:ring-2 focus:ring-sage-green outline-none font-medium resize-none shadow-inner"
                          placeholder="Escribe aquí cualquier otra preferencia, alergia no listada o detalle importante..."
                        />
                      </div>
                    </div>

                    <div className="pt-1 border-t flex justify-end">
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="bg-sage-green hover:bg-sage-green/90 text-white font-black px-1 py-1 rounded-3xl shadow-xl shadow-sage-green/30 text-lg transition-all hover:scale-105"
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
                            <th className="px-1 py-1 tracking-widest leading-none">Fecha / Hora</th>
                            <th className="px-1 py-1 tracking-widest leading-none">Ítems Consumidos</th>
                            <th className="px-1 py-1 text-right tracking-widest leading-none">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {userSales.map((sale) => (
                            <tr key={sale._id} className="hover:bg-sage-green/5 transition-colors group">
                              <td className="px-1 py-1 font-bold text-gray-600 whitespace-nowrap">{sale.Date}</td>
                              <td className="px-1 py-1">
                                <p className="font-bold text-not-black max-w-sm">
                                  {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin detalle"}
                                </p>
                                {sale.Mesa && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Servicio en {sale.Mesa}</span>}
                              </td>
                              <td className="px-1 py-1 text-right font-black text-sage-green text-lg">
                                $ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}
                              </td>
                            </tr>
                          ))}
                          {userSales.length === 0 && (
                            <tr>
                              <td colSpan="3" className="px-1 py-1 text-center text-gray-400">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-1 border border-dashed">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 py-1">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-gray-800 flex items-center gap-1">
                        <User size={20} className="text-sage-green" /> Información Básica
                      </h4>
                      <div className="space-y-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="py-1 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Teléfono Móvil</label>
                          <Input
                            value={editForm.phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="py-1 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Dirección Registrada</label>
                          <Input
                            value={editForm.address || ""}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="py-1 rounded-2xl font-bold bg-gray-50/50 border-gray-100 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-gray-800 flex items-center gap-1">
                        <ShieldCheck size={20} className="text-amber-500" /> Seguridad de Acceso
                      </h4>
                      <div className="bg-amber-50/50 p-1 rounded-3xl border border-amber-100/50 space-y-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest pl-1">Contraseña Nueva</label>
                          <Input
                            type="password"
                            placeholder="Ingresa nueva contraseña si deseas cambiarla"
                            value={editForm.password || ""}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            className="py-1 rounded-2xl font-bold bg-white border-amber-100 focus:ring-amber-500"
                          />
                        </div>
                        <p className="text-xs text-amber-700/70 font-medium leading-relaxed bg-white/50 p-1 rounded-xl">
                          ⚠️ **Nota importante:** Tu contraseña te permite acceder a este portal y agiliza tus próximas inscripciones a eventos y compras. No la compartas con nadie.
                        </p>
                      </div>

                      <div className="pt-1 flex gap-1">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                          className="flex-1 bg-sage-green hover:bg-sage-green/90 text-white font-black py-1 rounded-3xl shadow-lg shadow-sage-green/20"
                        >
                          {isUpdating ? "Guardando..." : "Guardar Perfil"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => { setEditForm(currentUser); setActiveTab("overview"); }}
                          disabled={isUpdating}
                          className="font-bold py-1 rounded-3xl text-gray-500"
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
      </div>
    </PageLayout>
  );
}
