import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllFromTable, updateItem } from "../../../redux/actions";
import { USER_PREFERENCES } from "../../../redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import supabase from "../../../config/supabaseClient";
import { MESSAGE_TEMPLATES } from "../../../utils/messageTemplates";

// Sub-components
import UserPortalLogin from "./UserPortal/UserPortalLogin";
import UserPortalSidebarNav from "./UserPortal/UserPortalSidebarNav";
import UserOverviewTab from "./UserPortal/UserOverviewTab";
import UserEventsTab from "./UserPortal/UserEventsTab";
import UserMessagesTab from "./UserPortal/UserMessagesTab";
import UserDietTab from "./UserPortal/UserDietTab";
import UserHistoryTab from "./UserPortal/UserHistoryTab";
import UserSettingsTab from "./UserPortal/UserSettingsTab";

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
  const [activeTab, setActiveTab] = useState("overview"); // overview, events, history, diet, settings, messages
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(location.pathname.includes("/Registro"));

  useEffect(() => {
    setIsRegistering(location.pathname.includes("/Registro"));
  }, [location.pathname]);
  const [userMessages, setUserMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

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

    fetchUserMessages(user);
  };

  const handleMarkAsRead = async (messageId) => {
    setUserMessages(prev => prev.map(m =>
      m._id === messageId ? { ...m, isRead: true } : m
    ));
  };

  const fetchUserMessages = async (userObj) => {
    setMessagesLoading(true);
    try {
      const localMessages = [
        {
          _id: "msg_welcome",
          title: MESSAGE_TEMPLATES.WELCOME.title,
          content: MESSAGE_TEMPLATES.WELCOME.content(userObj.name || 'Invitado'),
          type: MESSAGE_TEMPLATES.WELCOME.type,
          isRead: false,
          created_at: new Date().toISOString()
        },
        {
          _id: "msg_promo",
          title: MESSAGE_TEMPLATES.PROMO.title,
          content: MESSAGE_TEMPLATES.PROMO.content,
          type: MESSAGE_TEMPLATES.PROMO.type,
          isRead: false,
          created_at: new Date().toISOString()
        }
      ];
      setUserMessages(localMessages);
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
      <UserPortalLogin
        loading={loading}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        navigate={navigate}
        accessInput={accessInput}
        setAccessInput={setAccessInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        error={error}
        handleAccess={handleAccess}
      />
    );
  }

  return (
    <PageLayout loading={loading}>
      <div className="container mx-auto p-4 pb-24">
        {/* Header */}
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
          {/* Sidebar Nav */}
          <UserPortalSidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userMessages={userMessages}
            currentUser={currentUser}
          />

          {/* Active Tab Panel */}
          <div className="lg:col-span-3 pb-8">
            {activeTab === "overview" && (
              <UserOverviewTab
                userMessages={userMessages}
                userEvents={userEvents}
                userSales={userSales}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
                navigate={navigate}
              />
            )}

            {activeTab === "events" && (
              <UserEventsTab
                userEvents={userEvents}
                navigate={navigate}
              />
            )}

            {activeTab === "messages" && (
              <UserMessagesTab
                messagesLoading={messagesLoading}
                userMessages={userMessages}
                handleMarkAsRead={handleMarkAsRead}
              />
            )}

            {activeTab === "diet" && (
              <UserDietTab
                dietForm={dietForm}
                setDietForm={setDietForm}
                alergenosOptions={alergenosOptions}
                noComoOptions={noComoOptions}
                dietOptions={dietOptions}
                handleUpdateProfile={handleUpdateProfile}
                isUpdating={isUpdating}
              />
            )}

            {activeTab === "history" && (
              <UserHistoryTab
                userSales={userSales}
              />
            )}

            {activeTab === "settings" && (
              <UserSettingsTab
                editForm={editForm}
                setEditForm={setEditForm}
                handleUpdateProfile={handleUpdateProfile}
                isUpdating={isUpdating}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
