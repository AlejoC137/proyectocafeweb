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
  const [remoteVolume, setRemoteVolume] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const channelRef = useRef(null);
  const clientId = useRef('client-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now()).current;
  const hasVolumeColumnRef = useRef(true);

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
          if (data.volume !== undefined && data.volume !== null) {
            setRemoteVolume({
              volume: Number(data.volume),
              isMuted: Boolean(data.is_muted),
              timestamp: Date.now()
            });
          }
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
          if (payload.new?.station_name === 'FORCE_RELOAD') {
            console.log('[RadioSync] Recargando ventana por evento global FORCE_RELOAD (F5)');
            window.location.reload();
            return;
          }
          setCurrentPlay(payload.new);
          if (payload.new?.volume !== undefined && payload.new?.volume !== null) {
            setRemoteVolume({
              volume: Number(payload.new.volume),
              isMuted: Boolean(payload.new.is_muted),
              timestamp: Date.now()
            });
          }
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
          if (payload.new?.station_name === 'FORCE_RELOAD') {
            window.location.reload();
            return;
          }
          setCurrentPlay(payload.new);
          if (payload.new?.volume !== undefined && payload.new?.volume !== null) {
            setRemoteVolume({
              volume: Number(payload.new.volume),
              isMuted: Boolean(payload.new.is_muted),
              timestamp: Date.now()
            });
          }
        }
      )
      .on('broadcast', { event: 'FORCE_RELOAD' }, () => {
        console.log('[RadioSync] Broadcast FORCE_RELOAD recibido. Recargando página (F5)...');
        window.location.reload();
      })
      .on('broadcast', { event: 'VOLUME_CHANGE' }, ({ payload }) => {
        if (payload && payload.senderId !== clientId) {
          console.log('[RadioSync] Broadcast VOLUME_CHANGE recibido:', payload);
          setRemoteVolume({
            volume: payload.volume,
            isMuted: Boolean(payload.isMuted),
            timestamp: payload.timestamp || Date.now()
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RadioSync] Suscripcion Realtime activa.');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncError('Realtime no disponible.');
        }
      });

    channelRef.current = channel;

    // Escuchadores BroadcastChannel local entre pestañas del mismo navegador
    let bcReload;
    let bcVolume;
    try {
      bcReload = new BroadcastChannel('radio-reload-channel');
      bcReload.onmessage = (event) => {
        if (event.data?.type === 'FORCE_RELOAD') {
          console.log('[RadioSync] BroadcastChannel local FORCE_RELOAD recibido. Recargando (F5)...');
          window.location.reload();
        }
      };

      bcVolume = new BroadcastChannel('radio-volume-channel');
      bcVolume.onmessage = (event) => {
        if (event.data?.type === 'VOLUME_CHANGE' && event.data?.senderId !== clientId) {
          console.log('[RadioSync] BroadcastChannel local VOLUME_CHANGE recibido:', event.data);
          setRemoteVolume({
            volume: event.data.volume,
            isMuted: Boolean(event.data.isMuted),
            timestamp: event.data.timestamp || Date.now()
          });
        }
      };
    } catch (e) {}

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (bcReload) {
        bcReload.close();
      }
      if (bcVolume) {
        bcVolume.close();
      }
    };
  }, []);

  const broadcastVolume = async (volume, isMuted = false) => {
    const timestamp = Date.now();

    // 1. Emitir por BroadcastChannel local (inter-pestañas)
    try {
      const bc = new BroadcastChannel('radio-volume-channel');
      bc.postMessage({
        type: 'VOLUME_CHANGE',
        volume,
        isMuted,
        senderId: clientId,
        timestamp
      });
      bc.close();
    } catch (e) {}

    // 2. Emitir por Supabase Realtime Broadcast (WebSockets a todos los clientes)
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'VOLUME_CHANGE',
          payload: {
            volume,
            isMuted,
            senderId: clientId,
            timestamp
          }
        });
      }
    } catch (e) {
      console.warn('[RadioSync] Error en broadcastRealtime de volumen:', e.message);
    }

    // 3. Persistir en tabla radio_current_play si la columna existe
    if (hasVolumeColumnRef.current) {
      try {
        const { error } = await supabase
          .from(SYNC_TABLE)
          .update({
            volume,
            is_muted: isMuted,
            updated_at: new Date().toISOString()
          })
          .eq('id', SYNC_ROW_ID);

        if (error) {
          if (error.code === '42703') {
            // Columna no existe en la base de datos
            hasVolumeColumnRef.current = false;
          } else {
            console.warn('[RadioSync] Error al actualizar volumen en BD:', error.message);
          }
        }
      } catch (err) {
        hasVolumeColumnRef.current = false;
      }
    }
  };

  const broadcastPlay = async (station, tab, playing = true, currentVolume, currentMuted) => {
    if (!station) return;

    const basePayload = {
      id: SYNC_ROW_ID,
      tab: tab || 'supabase',
      station_url: station.url || '',
      station_name: station.title || station.name || 'Desconocido',
      station_cover: station.cover || station.favicon || '',
      station_artist: station.artist || '',
      is_playing: playing,
      updated_at: new Date().toISOString(),
    };

    const payloadWithVolume = (hasVolumeColumnRef.current && currentVolume !== undefined)
      ? { ...basePayload, volume: currentVolume, is_muted: Boolean(currentMuted) }
      : basePayload;

    try {
      setIsSyncing(true);
      let { error } = await supabase
        .from(SYNC_TABLE)
        .upsert(payloadWithVolume, { onConflict: 'id' });

      if (error && error.code === '42703') {
        hasVolumeColumnRef.current = false;
        const fallbackRes = await supabase
          .from(SYNC_TABLE)
          .upsert(basePayload, { onConflict: 'id' });
        error = fallbackRes.error;
      }

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

  const broadcastForceReload = async () => {
    try {
      setIsSyncing(true);

      // 1. Emitir por BroadcastChannel local (todas las pestañas del navegador)
      try {
        const bc = new BroadcastChannel('radio-reload-channel');
        bc.postMessage({ type: 'FORCE_RELOAD', timestamp: Date.now() });
        bc.close();
      } catch (e) {}

      // 2. Emitir por Supabase Realtime Broadcast (WebSockets)
      try {
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'FORCE_RELOAD',
            payload: { timestamp: Date.now() }
          });
        }
      } catch (e) {}

      // 3. Notificar en Supabase Postgres Table
      await supabase
        .from(SYNC_TABLE)
        .upsert({
          id: SYNC_ROW_ID,
          tab: 'supabase',
          station_url: '',
          station_name: 'FORCE_RELOAD',
          station_cover: '',
          station_artist: '',
          is_playing: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[RadioSync] Error en broadcastForceReload:', err.message);
    } finally {
      setIsSyncing(false);
    }

    // 4. Recargar la propia ventana actual
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return {
    currentPlay,
    remoteVolume,
    broadcastPlay,
    broadcastStop,
    broadcastVolume,
    broadcastForceReload,
    isSyncing,
    syncError,
  };
}
