import { useState, useEffect, useMemo } from 'react';
import supabase from '../config/supabaseClient';
import { getLocalDateStr } from '../utils/dateUtils';
import { useMediaServer } from '../context/MediaServerContext';

function parseLunchJson(compLunch) {
  if (!compLunch) return null;
  if (typeof compLunch === 'object') return compLunch;
  try {
    return JSON.parse(compLunch);
  } catch {
    return null;
  }
}

export function selectBestLunch(lunchItems, todayStr = getLocalDateStr()) {
  if (!Array.isArray(lunchItems) || lunchItems.length === 0) return null;

  const validEntries = lunchItems
    .map((item) => {
      const parsed = parseLunchJson(item?.Comp_Lunch);
      if (!parsed) return null;
      const primaryDate = typeof parsed?.fecha?.fecha === 'string' ? parsed.fecha.fecha.trim() : '';
      const selectedDates = Array.isArray(parsed?.fechasSeleccionadas)
        ? parsed.fechasSeleccionadas.filter((d) => typeof d === 'string' && d.trim())
        : [];
      const hasContent = Boolean(
        parsed?.entrada?.nombre ||
        parsed?.proteina?.nombre ||
        parsed?.carbohidrato?.nombre ||
        parsed?.acompanante?.nombre ||
        parsed?.ensalada?.nombre ||
        parsed?.bebida?.nombre
      );
      if (!hasContent) return null;
      return { item, primaryDate, selectedDates };
    })
    .filter(Boolean);

  if (validEntries.length === 0) return null;

  // 1. Coincidencia exacta con hoy (hora local)
  const exactToday = validEntries.find(
    (e) => e.primaryDate === todayStr || e.selectedDates.includes(todayStr)
  );
  if (exactToday) return exactToday.item;

  // 2. Próximo menú más cercano (fecha > hoy)
  const upcoming = validEntries
    .filter((e) => e.primaryDate && e.primaryDate > todayStr)
    .sort((a, b) => a.primaryDate.localeCompare(b.primaryDate));
  if (upcoming.length > 0) return upcoming[0].item;

  // 3. Menú más reciente (fecha < hoy)
  const past = validEntries
    .filter((e) => e.primaryDate && e.primaryDate < todayStr)
    .sort((a, b) => b.primaryDate.localeCompare(a.primaryDate));
  if (past.length > 0) return past[0].item;

  return validEntries[0].item;
}

export function useCafeData() {
  const { resolveMediaUrl } = useMediaServer();
  const [agendaEvents, setAgendaEvents] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [eventCarouselIdx, setEventCarouselIdx] = useState(0);
  const [menuCarouselIdx, setMenuCarouselIdx] = useState(0);

  // Fetch Agenda (próximos eventos)
  const fetchAgenda = async () => {
    try {
      const today = getLocalDateStr();
      const { data, error } = await supabase
        .from('Agenda')
        .select('_id, nombreES, fecha, horaInicio, horaFinal, bannerIMG, linkInscripcion, valor')
        .gte('fecha', today)
        .not('ejecutado', 'is', null)
        .order('fecha', { ascending: true })
        .limit(10);
      if (!error && data) setAgendaEvents(data);
    } catch (err) {
      console.warn('[Radio] Agenda no disponible:', err.message);
    }
  };

  const [todaysLunch, setTodaysLunch] = useState(null);

  // Fetch Menú (platos con foto y almuerzos)
  const fetchMenu = async () => {
    try {
      // 1. Fetch regular menu items for the carousel
      const { data: menuData, error: menuError } = await supabase
        .from('Menu')
        .select('_id, NombreES, Precio, Foto, TipoES, SubTipoES, DescripcionMenuES, Estado, SUB_GRUPO')
        .eq('Estado', 'Activo')
        .not('Foto', 'is', null)
        .order('Order', { ascending: true })
        .limit(100);

      if (!menuError && menuData) {
        setMenuItems(menuData.filter(m => m.Foto && m.Foto.trim() !== '' && m.SUB_GRUPO !== 'TARDEO_ALMUERZO'));
      }

      // 2. Fetch lunch items specifically
      const { data: lunchDataDB, error: lunchError } = await supabase
        .from('Menu')
        .select('_id, NombreES, Precio, Foto, TipoES, SubTipoES, DescripcionMenuES, Estado, SUB_GRUPO, Comp_Lunch')
        .eq('Estado', 'Activo')
        .eq('SUB_GRUPO', 'TARDEO_ALMUERZO');

      if (!lunchError && lunchDataDB && lunchDataDB.length > 0) {
        const todayStr = getLocalDateStr();
        const foundLunch = selectBestLunch(lunchDataDB, todayStr);
        setTodaysLunch(foundLunch);
      }
    } catch (err) {
      console.warn('[Radio] Menu no disponible:', err.message);
    }
  };

  useEffect(() => {
    fetchAgenda();
    fetchMenu();
  }, []);

  // Auto-carrusel eventos y menú
  useEffect(() => {
    if (agendaEvents.length <= 1) return;
    const timer = setInterval(() => {
      setEventCarouselIdx(prev => (prev + 1) % agendaEvents.length);
    }, 300000); // 5 minutes
    return () => clearInterval(timer);
  }, [agendaEvents.length]);

  useEffect(() => {
    if (menuItems.length <= 1) return;
    const timer = setInterval(() => {
      setMenuCarouselIdx(prev => (prev + 1) % menuItems.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [menuItems.length]);

  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  };

  const resolvedAgendaEvents = useMemo(
    () => agendaEvents.map((e) => (e?.bannerIMG ? { ...e, bannerIMG: resolveMediaUrl(e.bannerIMG) } : e)),
    [agendaEvents, resolveMediaUrl]
  );

  const resolvedMenuItems = useMemo(
    () => menuItems.map((m) => (m?.Foto ? { ...m, Foto: resolveMediaUrl(m.Foto) } : m)),
    [menuItems, resolveMediaUrl]
  );

  const resolvedTodaysLunch = useMemo(
    () => (todaysLunch?.Foto ? { ...todaysLunch, Foto: resolveMediaUrl(todaysLunch.Foto) } : todaysLunch),
    [todaysLunch, resolveMediaUrl]
  );

  return {
    agendaEvents: resolvedAgendaEvents,
    menuItems: resolvedMenuItems,
    eventCarouselIdx,
    setEventCarouselIdx,
    menuCarouselIdx,
    setMenuCarouselIdx,
    currentEvent: resolvedAgendaEvents[eventCarouselIdx],
    currentMenuItem: resolvedMenuItems[menuCarouselIdx],
    todaysLunch: resolvedTodaysLunch,
    formatEventDate
  };
}
