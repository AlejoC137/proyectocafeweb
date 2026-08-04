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
        .order('fecha', { ascending: true })
        .limit(10);
      if (!error && data) setAgendaEvents(data);
    } catch (err) {
      console.warn('[Radio] Agenda no disponible:', err.message);
    }
  };

  // Fetch Menú (platos con foto)
  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('Menu')
        .select('_id, NombreES, Precio, Foto, TipoES, SubTipoES, DescripcionMenuES, Estado')
        .eq('Estado', 'Activo')
        .not('Foto', 'is', null)
        .order('Order', { ascending: true })
        .limit(20);
      if (!error && data) setMenuItems(data.filter(m => m.Foto && m.Foto.trim() !== ''));
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
    }, 5000);
    return () => clearInterval(timer);
  }, [agendaEvents.length]);

  useEffect(() => {
    if (menuItems.length <= 1) return;
    const timer = setInterval(() => {
      setMenuCarouselIdx(prev => (prev + 1) % menuItems.length);
    }, 4000);
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
    formatEventDate
  };
}
