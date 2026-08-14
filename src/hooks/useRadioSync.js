import { useState, useEffect, useRef } from 'react';
import supabase from '../config/supabaseClient';

const SYNC_TABLE = 'radio_current_play';
const SYNC_ROW_ID = 1;

/**
 * Hook de sincronizacion global de radio via Supabase Realtime.
 * - Lee el estado actual al montar el componente.
 * - Suscribe a cambios en tiempo real (WebSocket).
 * - Expone broadcastPlay() para publicar el estado activo a todas las sesiones.
 */
export function useRadioSync() {
  const [currentPlay, setCurrentPlay] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const channelRef = useRef(null);

  // Leer estado actual de Supabase al montar
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const { data, error } = await supabase
          .from(SYNC_TABLE)
          .select('*')
          .eq('id', SYNC_ROW_ID)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('[RadioSync] No se pudo leer current_play:', error.message);
          return;
        }

        if (data) {
          setCurrentPlay(data);
        }
      } catch (err) {
        console.warn('[RadioSync] Error al leer estado inicial:', err.message);
      }
    };

    fetchCurrent();
  }, []);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('radio-sync-global')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: SYNC_TABLE,
          filter: `id=eq.${SYNC_ROW_ID}`,
        },
        (payload) => {
          console.log('[RadioSync] Cambio global recibido:', payload.new);
          setCurrentPlay(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: SYNC_TABLE,
        },
        (payload) => {
          setCurrentPlay(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RadioSync] Suscripcion Realtime activa.');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncError('Realtime no disponible.');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const broadcastPlay = async (station, tab, playing = true) => {
    if (!station) return;

    const payload = {
      id: SYNC_ROW_ID,
      tab: tab || 'supabase',
      station_url: station.url || '',
      station_name: station.title || station.name || 'Desconocido',
      station_cover: station.cover || station.favicon || '',
      station_artist: station.artist || '',
      is_playing: playing,
      updated_at: new Date().toISOString(),
    };

    try {
      setIsSyncing(true);
      const { error } = await supabase
        .from(SYNC_TABLE)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[RadioSync] Error al publicar:', error.message);
        setSyncError(error.message);
      }
    } catch (err) {
      console.warn('[RadioSync] Error broadcastPlay:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const broadcastStop = async () => {
    try {
      await supabase
        .from(SYNC_TABLE)
        .update({ is_playing: false, updated_at: new Date().toISOString() })
        .eq('id', SYNC_ROW_ID);
    } catch (err) {
      console.warn('[RadioSync] Error al pausar globalmente:', err.message);
    }
  };

  return {
    currentPlay,
    broadcastPlay,
    broadcastStop,
    isSyncing,
    syncError,
  };
}
