import { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';

export function useCafeData() {
  const [agendaEvents, setAgendaEvents] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [eventCarouselIdx, setEventCarouselIdx] = useState(0);
  const [menuCarouselIdx, setMenuCarouselIdx] = useState(0);

  // Fetch Agenda (próximos eventos)
  const fetchAgenda = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
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
        const todayStr = new Date().toISOString().split('T')[0];
        let foundLunch = lunchDataDB.find(item => {
          if (!item.Comp_Lunch) return false;
          try {
            const parsed = JSON.parse(item.Comp_Lunch);
            return parsed?.fecha?.fecha === todayStr;
          } catch { return false; }
        });

        if (!foundLunch) {
          foundLunch = lunchDataDB.find(item => item.Comp_Lunch);
        }
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

  return {
    agendaEvents,
    menuItems,
    eventCarouselIdx,
    setEventCarouselIdx,
    menuCarouselIdx,
    setMenuCarouselIdx,
    currentEvent: agendaEvents[eventCarouselIdx],
    currentMenuItem: menuItems[menuCarouselIdx],
    todaysLunch,
    formatEventDate
  };
}
