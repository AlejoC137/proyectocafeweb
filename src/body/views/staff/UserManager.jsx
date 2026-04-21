import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getAllFromTable, updateItem, deleteItem } from "../../../redux/actions";
import { USER_PREFERENCES } from "../../../redux/actions-types";
import PageLayout from "../../../components/ui/page-layout";
import ContentCard from "../../../components/ui/content-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search, 
  Trash2, 
  Save, 
  Gift, 
  X,
  History,
  Mail,
  Phone,
  MapPin,
  RefreshCw
} from "lucide-react";
import supabase from "../../../config/supabaseClient";

export default function UserManager() {
  const dispatch = useDispatch();
  const allUsers = useSelector((state) => state.allUserPreferences || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [userSales, setUserSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [dispatch]);

  const fetchUserSales = async (userId) => {
    if (!userId) return;
    setSalesLoading(true);
    try {
      const { data, error } = await supabase
        .from("Ventas")
        .select("*")
        .eq("Cliente", userId) // Using userId as the link
        .order("Date", { ascending: false });

      if (error) throw error;
      setUserSales(data || []);
    } catch (err) {
      console.error("Error fetching user sales:", err);
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    await dispatch(getAllFromTable(USER_PREFERENCES));
    setLoading(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = allUsers.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phone && String(user.phone).includes(term))
    );
  });

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setEditForm(user);
    fetchUserSales(user._id); // Fetch sales when selected
  };

  const closeUserPanel = () => {
    setSelectedUser(null);
    setEditForm({});
    setUserSales([]); // Clear sales
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleUpdateUser = async () => {
    if (!editForm._id) return;
    setIsUpdating(true);
    try {
      // Usamos supabase directamente para asegurar que mapee a "userPreferences" con mayúsculas si es necesario,
      // pero usar updateItem del Redux debería funcionar.
      await dispatch(updateItem(
        editForm._id, 
        {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone ? parseInt(editForm.phone) : null,
          address: editForm.address,
          password: editForm.password,
          loyalty_points: editForm.loyalty_points ? parseInt(editForm.loyalty_points) : 0,
          acepta_promociones: editForm.acepta_promociones,
          acepta_nuevos_eventos: editForm.acepta_nuevos_eventos,
        }, 
        USER_PREFERENCES
      ));
      alert("Usuario actualizado correctamente");
      fetchUsers(); // Actualizar la lista
      setSelectedUser({ ...editForm });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      alert("Hubo un error al actualizar el usuario");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser._id) return;
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${selectedUser.name || selectedUser.email}? Esta acción no se puede deshacer.`)) {
      setIsUpdating(true);
      try {
        await dispatch(deleteItem(selectedUser._id, USER_PREFERENCES));
        alert("Usuario eliminado correctamente");
        closeUserPanel();
        fetchUsers();
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("Error al eliminar el usuario");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <PageLayout loading={loading}>
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Lista de Usuarios */}
        <div className={`w-full ${selectedUser ? 'lg:w-1/3 border-r pr-4' : 'lg:w-full'}`}>
          <ContentCard 
            title="Manejador de Usuarios" 
            icon={<Users className="w-5 h-5 text-blue-500" />}
          >
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              <Button onClick={fetchUsers} variant="outline" title="Refrescar">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-white rounded-md border max-h-[600px] overflow-y-auto">
              {filteredUsers.length > 0 ? (
                <ul className="divide-y">
                  {filteredUsers.map((user) => (
                    <li 
                      key={user._id} 
                      onClick={() => handleSelectUser(user)}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${selectedUser?._id === user._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{user.name || "Sin Nombre"}</p>
                          <p className="text-sm text-gray-500">{user.email || "Sin Email"}</p>
                          {(user.phone || user.phone === 0) && (
                            <p className="text-xs text-gray-400 mt-1">📞 {user.phone}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {user.loyalty_points || 0} pts
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No se encontraron usuarios.
                </div>
              )}
            </div>
          </ContentCard>
        </div>

        {/* Panel de Detalles / Edición de Usuario */}
        {selectedUser && (
          <div className="w-full lg:w-2/3">
            <ContentCard 
              title={`Perfil: ${selectedUser.name || 'Sin Nombre'}`}
              className="sticky top-4"
            >
              <div className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer" onClick={closeUserPanel}>
                <X className="w-5 h-5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                
                {/* Formulario Izquierda */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" /> Nombre Completo
                    </label>
                    <Input 
                      name="name" 
                      value={editForm.name || ""} 
                      onChange={handleFormChange}
                      placeholder="Nombre del usuario"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" /> Email
                    </label>
                    <Input 
                      name="email" 
                      type="email"
                      value={editForm.email || ""} 
                      onChange={handleFormChange}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4" /> Teléfono
                    </label>
                    <Input 
                      name="phone" 
                      type="number"
                      value={editForm.phone || ""} 
                      onChange={handleFormChange}
                      placeholder="Ej: 3001234567"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" /> Dirección
                    </label>
                    <Input 
                      name="address" 
                      value={editForm.address || ""} 
                      onChange={handleFormChange}
                      placeholder="Dirección de entrega"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      <Save className="w-4 h-4 text-purple-600" /> Contraseña
                    </label>
                    <Input 
                      name="password" 
                      type="text"
                      value={editForm.password || ""} 
                      onChange={handleFormChange}
                      placeholder="Contraseña del usuario"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100 space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Marketing / Comunicación</p>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="acepta_promociones" 
                        name="acepta_promociones"
                        checked={editForm.acepta_promociones || false} 
                        onChange={(e) => setEditForm({...editForm, acepta_promociones: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="acepta_promociones" className="text-xs font-medium text-blue-900 cursor-pointer">
                        Acepta Promociones y Ofertas 🎁
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="acepta_nuevos_eventos" 
                        name="acepta_nuevos_eventos"
                        checked={editForm.acepta_nuevos_eventos || false} 
                        onChange={(e) => setEditForm({...editForm, acepta_nuevos_eventos: e.target.checked})}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="acepta_nuevos_eventos" className="text-xs font-medium text-blue-900 cursor-pointer">
                        Enterarme de Nuevos Eventos 🍷
                      </label>
                    </div>
                  </div>
                </div>

                {/* Formulario Derecha */}
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <label className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5" /> Puntos de Lealtad
                    </label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        name="loyalty_points" 
                        type="number"
                        value={editForm.loyalty_points || 0} 
                        onChange={handleFormChange}
                        className="bg-white max-w-[120px]"
                      />
                      <span className="text-sm text-gray-500">
                        (Redimidos: {selectedUser.redeemed_points || 0})
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Equivalen a: $ {new Intl.NumberFormat('es-CO').format((editForm.loyalty_points || 0) * (parseInt(import.meta.env.VITE_POINTS_REDEMPTION_VALUE) || 1))} COP
                    </p>
                  </div>

                  {/* Historial de Compras REAL desde tabla Ventas */}
                  <div className="bg-white p-3 rounded-md border shadow-sm">
                    <label className="text-sm font-bold flex items-center gap-2 mb-2 border-b pb-2 text-blue-700">
                      <History className="w-4 h-4" /> Historial de Compras Real
                    </label>
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {salesLoading ? (
                        <div className="text-center py-4 text-gray-400 text-xs">Cargando ventas...</div>
                      ) : userSales.length > 0 ? (
                        userSales.map((sale) => (
                          <div key={sale._id} className="text-[10px] border-b pb-1 last:border-0">
                            <div className="flex justify-between font-bold">
                              <span>{sale.Date}</span>
                              <span className="text-emerald-600">$ {new Intl.NumberFormat('es-CO').format(sale.Total_Ingreso || 0)}</span>
                            </div>
                            <div className="text-gray-500 truncate">
                              {sale.Productos ? JSON.parse(sale.Productos).map(p => p.NombreES).join(", ") : "Sin productos"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-xs italic">Sin compras registradas en el sistema.</div>
                      )}
                    </div>
                  </div>

                  {/* Almuerzos y Preferencias (LunchByOrder) */}
                  <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
                    <label className="text-sm font-bold flex items-center gap-2 mb-2 border-b border-emerald-200 pb-2 text-emerald-800">
                      <History className="w-4 h-4" /> Perfil Dietético y Pedidos
                    </label>
                    
                    {/* Preferencias de LunchByOrder */}
                    {selectedUser.userPreferences ? (
                      <div className="mb-3 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Perfil Dietético:</p>
                        <div className="text-[11px] text-gray-700 bg-white/50 p-2 rounded border border-emerald-100 flex flex-col gap-1">
                          {(() => {
                            const prefs = typeof selectedUser.userPreferences === 'string' 
                              ? JSON.parse(selectedUser.userPreferences || '{}') 
                              : (selectedUser.userPreferences || {});
                            
                            const allergies = Object.entries(prefs.Alergies || {})
                              .filter(([_, val]) => val)
                              .map(([key]) => key);
                            
                            return (
                              <>
                                {allergies.length > 0 && <p>⚠️ <span className="font-bold">Alergias:</span> {allergies.join(", ")}</p>}
                                {prefs.noComo?.length > 0 && <p>❌ <span className="font-bold">No Como:</span> {prefs.noComo.join(", ")}</p>}
                                {prefs.primeDiet?.length > 0 && <p>🥗 <span className="font-bold">Dieta:</span> {prefs.primeDiet.join(", ")}</p>}
                                {prefs.meGusta?.length > 0 && <p>👍 <span className="font-bold">Gusta:</span> {prefs.meGusta.join(", ")}</p>}
                                {prefs.Picante > 0 && <p>🌶️ <span className="font-bold">Picante:</span> Nivel {prefs.Picante}</p>}
                                {prefs.Notas && <p>📝 <span className="font-bold">Notas:</span> {prefs.Notas}</p>}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    ) : null}

                    {/* Almuerzos Ordenados */}
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Últimos Almuerzos:</p>
                    <div className="max-h-[120px] overflow-y-auto text-[11px] space-y-1">
                      {(() => {
                        let lunches = [];
                        try {
                          lunches = typeof selectedUser.ordered_lunches === 'string' 
                            ? JSON.parse(selectedUser.ordered_lunches || '[]') 
                            : (selectedUser.ordered_lunches || []);
                          if (!Array.isArray(lunches)) lunches = [];
                        } catch (e) {
                          console.error("Error parsing ordered_lunches", e);
                        }
                        
                        return lunches.length > 0 ? (
                          lunches.map((lunch, idx) => (
                            <div key={idx} className="bg-white/80 p-1.5 rounded flex justify-between items-center border border-emerald-50">
                              <span>{lunch.date || 'Sin fecha'}</span>
                              <span className="font-bold text-emerald-600">{lunch.menu || 'Almuerzo'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 italic">No hay almuerzos registrados.</div>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-6 pt-4 border-t flex justify-between">
                <Button 
                  disabled={isUpdating} 
                  variant="destructive" 
                  onClick={handleDeleteUser}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Usuario
                </Button>
                
                <div className="flex gap-2">
                  <Button disabled={isUpdating} variant="outline" onClick={closeUserPanel}>
                    Cancelar
                  </Button>
                  <Button disabled={isUpdating} onClick={handleUpdateUser} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4" /> {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </div>

            </ContentCard>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
