import React, { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import MenuPrint from "./MenuPrint";
import MenuPrintHorizontal from "./MenuPrintHorizontal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Layers, Plus, Trash2, Edit, Check, X, Copy } from "lucide-react";

function MenuPrintManager() {
  const [menus, setMenus] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(2); // default to horizontal menu
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneSourceId, setCloneSourceId] = useState(2); // default to clone from menu 2 (horizontal default)
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_print_config")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      // Ensure that at least default menu 1 (vertical) and 2 (horizontal) are present in the UI representation
      let loadedMenus = data || [];
      const hasVertical = loadedMenus.some((m) => m.id === 1);
      const hasHorizontal = loadedMenus.some((m) => m.id === 2);

      if (!hasVertical) {
        loadedMenus.push({
          id: 1,
          images: [],
          group_descriptions: { __layout: { name: "Menú Vertical (Principal)", type: "vertical" } },
          show_icons: true,
        });
      }
      if (!hasHorizontal) {
        loadedMenus.push({
          id: 2,
          images: [],
          group_descriptions: { __layout: { name: "Menú Horizontal (Principal)", type: "horizontal" } },
          show_icons: true,
        });
      }

      // Sort again by id
      loadedMenus.sort((a, b) => a.id - b.id);
      setMenus(loadedMenus);

      // If activeMenuId is not in the list, set to first one
      if (!loadedMenus.some((m) => m.id === activeMenuId)) {
        setActiveMenuId(loadedMenus[0]?.id || 2);
      }
    } catch (err) {
      console.error("Error loading menus list:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMenuDisplayName = (menu) => {
    if (menu.group_descriptions?.__layout?.name) {
      return menu.group_descriptions.__layout.name;
    }
    if (menu.id === 1) return "Menú Vertical Principal";
    if (menu.id === 2) return "Menú Horizontal Principal";
    return `Menú Clonado ${menu.id}`;
  };

  const getMenuType = (menu) => {
    if (menu.id === 1) return "vertical";
    if (menu.id === 2) return "horizontal";
    return menu.group_descriptions?.__layout?.type || "horizontal";
  };

  const activeMenu = menus.find((m) => m.id === activeMenuId) || { id: 2 };
  const activeMenuType = getMenuType(activeMenu);

  const startEditName = () => {
    setEditedName(getMenuDisplayName(activeMenu));
    setIsEditingName(true);
  };

  const saveEditedName = async () => {
    if (!editedName.trim()) return;
    try {
      const updatedLayout = {
        ...(activeMenu.group_descriptions?.__layout || {}),
        name: editedName.trim(),
      };
      const updatedDescriptions = {
        ...(activeMenu.group_descriptions || {}),
        __layout: updatedLayout,
      };

      const { error } = await supabase
        .from("menu_print_config")
        .update({ group_descriptions: updatedDescriptions })
        .eq("id", activeMenuId);

      if (error) throw error;

      // Update state local
      setMenus(
        menus.map((m) =>
          m.id === activeMenuId
            ? { ...m, group_descriptions: updatedDescriptions }
            : m
        )
      );
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
      alert("Error al actualizar el nombre del menú");
    }
  };

  const handleCloneMenu = async () => {
    const finalName = cloneName.trim() || `Clon de ${getMenuDisplayName(menus.find(m => m.id === cloneSourceId) || { id: 2 })}`;
    setIsCreating(true);
    try {
      // Find source menu data
      const source = menus.find((m) => m.id === cloneSourceId) || { id: 2, images: [], group_descriptions: {} };
      
      // Generate new ID
      const newId = menus.length > 0 ? Math.max(...menus.map((m) => m.id)) + 1 : 3;

      const newMenuRow = {
        id: newId,
        images: source.images || [],
        group_descriptions: {
          ...(source.group_descriptions || {}),
          __layout: {
            ...(source.group_descriptions?.__layout || {}),
            name: finalName,
            type: "horizontal", // Clones are horizontal menus
          },
        },
        show_icons: source.show_icons ?? true,
      };

      const { error } = await supabase.from("menu_print_config").insert([newMenuRow]);
      if (error) throw error;

      setShowCloneModal(false);
      setCloneName("");
      setActiveMenuId(newId);
      await fetchMenus();
    } catch (err) {
      console.error("Error cloning menu:", err);
      alert("Error al clonar el menú");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (activeMenuId === 1 || activeMenuId === 2) {
      alert("No se pueden eliminar los menús principales del sistema.");
      return;
    }

    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente el menú "${getMenuDisplayName(activeMenu)}"?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("menu_print_config").delete().eq("id", activeMenuId);
      if (error) throw error;

      setActiveMenuId(2); // fallback to default horizontal menu
      await fetchMenus();
    } catch (err) {
      console.error("Error deleting menu:", err);
      alert("Error al eliminar el menú");
    }
  };

  if (loading && menus.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen bg-zinc-100 font-bold italic uppercase text-2xl animate-pulse">
        Cargando Diseñador de Menús...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-zinc-100">
      {/* Dynamic Parent Header Bar - Hidden in printing */}
      <div className="fixed top-[56px] left-0 w-full z-[120] bg-[#fcf8f2] border-b-4 border-black text-black h-16 flex items-center justify-between px-6 shadow-md print:hidden overflow-hidden">
        
        {/* Left Side: Logo/Title & Dynamic Name */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 bg-black text-[#fcf8f2] font-black uppercase text-xs px-3 py-1.5 rounded border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
            <Layers size={14} />
            <span>MENÚS</span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8 border-2 border-black font-bold text-sm bg-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1 max-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditedName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                />
                <button
                  onClick={saveEditedName}
                  className="bg-green-400 hover:bg-green-500 border-2 border-black p-1 rounded active:translate-y-0.5"
                  title="Guardar Nombre"
                >
                  <Check size={14} className="text-black font-black" />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="bg-red-400 hover:bg-red-500 border-2 border-black p-1 rounded active:translate-y-0.5"
                  title="Cancelar"
                >
                  <X size={14} className="text-black font-black" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-black uppercase italic text-sm md:text-base text-black max-w-[250px] truncate">
                  {getMenuDisplayName(activeMenu)}
                </span>
                <button
                  onClick={startEditName}
                  className="hover:bg-zinc-200 p-1.5 rounded transition-colors text-black"
                  title="Editar Nombre de Menú"
                >
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Scrollable Tabs */}
        <div className="flex-1 mx-6 flex items-center justify-start overflow-x-auto gap-2 py-2 no-scrollbar scroll-smooth">
          {menus.map((m) => {
            const isActive = m.id === activeMenuId;
            const isVertical = getMenuType(m) === "vertical";
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMenuId(m.id);
                  setIsEditingName(false);
                }}
                className={`flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-md transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  isActive
                    ? "bg-yellow-300 text-black"
                    : "bg-white text-black hover:bg-zinc-100"
                }`}
              >
                <span>{isVertical ? "📋" : "📖"}</span>
                <span>{getMenuDisplayName(m)}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Clone & Delete Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              setCloneSourceId(activeMenuType === "horizontal" ? activeMenuId : 2);
              setShowCloneModal(true);
            }}
            className="bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs h-9 px-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-md transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Clonar Horizontal</span>
          </Button>

          {activeMenuId !== 1 && activeMenuId !== 2 && (
            <Button
              onClick={handleDeleteMenu}
              className="bg-red-400 hover:bg-red-500 text-black border-2 border-black font-black uppercase text-xs h-9 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-md transition-all flex items-center gap-1.5"
              title="Eliminar Menú"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full flex flex-col">
        {activeMenuType === "vertical" ? (
          <div className="pt-[64px]">
            <MenuPrint menuId={activeMenuId} />
          </div>
        ) : (
          <MenuPrintHorizontal
            menuId={activeMenuId}
            controlTopClass="top-[120px]"
            containerPaddingClass="pt-[240px]"
          />
        )}
      </div>

      {/* Clone Menu Dialog Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fcf8f2] border-4 border-black p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full animate-in zoom-in-95 duration-200 mx-4">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
              <h3 className="font-black text-xl uppercase italic flex items-center gap-2">
                <Copy size={20} />
                <span>Clonar Menú</span>
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="font-black hover:text-red-600 transition-colors"
              >
                CERRAR X
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">
                  Nombre del Nuevo Menú
                </label>
                <Input
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="ej. Menú Fin de Semana Especial"
                  className="border-2 border-black font-bold bg-white focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block">
                  Copiar Estructura De:
                </label>
                <select
                  value={cloneSourceId}
                  onChange={(e) => setCloneSourceId(Number(e.target.value))}
                  className="w-full border-2 border-black font-bold bg-white p-2 text-sm rounded outline-none focus:ring-0"
                >
                  {menus
                    .filter((m) => getMenuType(m) === "horizontal")
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {getMenuDisplayName(m)} (ID: {m.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <Button
                  onClick={() => setShowCloneModal(false)}
                  className="bg-white hover:bg-zinc-100 text-black border-2 border-black font-bold uppercase text-xs h-10 px-4 active:translate-y-0.5"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCloneMenu}
                  disabled={isCreating}
                  className="bg-green-400 hover:bg-green-500 text-black border-2 border-black font-black uppercase text-xs h-10 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isCreating ? "Clonando..." : "Crear Clon"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPrintManager;
