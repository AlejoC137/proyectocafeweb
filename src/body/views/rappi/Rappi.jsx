import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllFromTable } from "@/redux/actions";
import {
  MENU,
  RECETAS_MENU,
  RECETAS_PRODUCCION,
} from "@/redux/actions-types";
import { getRappiConfig, DEFAULT_RAPPI_CONFIG } from "@/redux/actions-Rappi";

import PageLayout from "@/components/ui/page-layout";
import CategoryNavBar from "@/components/ui/category-nav-bar";

import RappiProductosTab from "./tabs/RappiProductosTab";
import RappiAnalisisTab from "./tabs/RappiAnalisisTab";
import RappiTiendaTab from "./tabs/RappiTiendaTab";

export function Rappi() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(DEFAULT_RAPPI_CONFIG);

  // Redux state
  const menu = useSelector((state) => state.allMenu || []);
  const recetasMenu = useSelector((state) => state.allRecetasMenu || []);
  const recetasProduccion = useSelector((state) => state.allRecetasProduccion || []);

  // Determinar pestaña activa desde URL (por defecto "productos")
  const activeTab = (tab || "productos").toLowerCase();

  const handleTabChange = (targetTab) => {
    navigate(`/Rappi/${targetTab}`);
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          dispatch(getAllFromTable(MENU)),
          dispatch(getAllFromTable(RECETAS_MENU)),
          dispatch(getAllFromTable(RECETAS_PRODUCCION)),
        ]);
        const cfg = await dispatch(getRappiConfig("RAPPI"));
        if (cfg) setConfig(cfg);
      } catch (err) {
        console.error("Error cargando datos en Rappi view:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [dispatch]);

  // Categorías de navegación para CategoryNavBar
  const categories = [
    { type: "productos", label: "1. Catálogo & Moderador", icon: "🛵" },
    { type: "analisis", label: "2. Historial & Financiero", icon: "📊" },
    { type: "tienda", label: "3. Clon Rappi (Mockup)", icon: "🛒" },
  ];

  const headerActions = (
    <CategoryNavBar
      categories={categories}
      currentType={activeTab}
      onTypeChange={handleTabChange}
    />
  );

  return (
    <PageLayout
      title="Rappi & Canales de Venta"
      actions={headerActions}
      loading={loading}
    >
      {activeTab === "productos" && (
        <RappiProductosTab
          menu={menu}
          recetasMenu={recetasMenu}
          recetasProduccion={recetasProduccion}
          config={config}
          onConfigChange={setConfig}
        />
      )}

      {activeTab === "analisis" && (
        <RappiAnalisisTab
          menu={menu}
          recetasMenu={recetasMenu}
          recetasProduccion={recetasProduccion}
          config={config}
        />
      )}

      {activeTab === "tienda" && (
        <RappiTiendaTab
          menu={menu}
          config={config}
        />
      )}
    </PageLayout>
  );
}

export default Rappi;
