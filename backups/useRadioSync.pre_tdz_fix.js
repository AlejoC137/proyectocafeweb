import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../config/supabaseClient';

const SYNC_TABLE = 'radio_current_play';
const SYNC_ROW_ID = 1;

/**
 * Hook de sincronizacion global de radio via Supabase Realtime + Presencia de Escuchas + Control Remoto.
 * - Lee el estado actual al montar el componente.
 * - Suscribe a cambios en tiempo real (WebSocket).
 * - Monitorea instancias/oyentes en vivo (Presence + Broadcast + BroadcastChannel local).
 * - Triple redundancia: Presence, Broadcast Realtime y BroadcastChannel para 100% de fiabilidad en red.
 */
export function useRadioSync(options = {}) {
  const { isManager = false, presenceData, onRemoteCommand } = options;

  const [currentPlay, setCurrentPlay] = useState(null);
  const [remoteVolume, setRemoteVolume] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Lista de escuchas/instancias activas
  const [listeners, setListeners] = useState([]);
  const localListenersMap = useRef(new Map());
  const broadcastListenersMap = useRef(new Map());
  const lastRemoteListRef = useRef([]);

  const channelRef = useRef(null);
  const onRemoteCommandRef = useRef(onRemoteCommand);
  onRemoteCommandRef.current = onRemoteCommand;

  const presenceDataRef = useRef(presenceData);
  presenceDataRef.current = presenceData;

  // Identificador de cliente único por pestaña/instancia
  const clientId = useRef((() => {
    const prefix = isManager ? 'manager-' : 'listener-';
    return prefix + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  })()).current;

  // Combinar escuchas remotos (Presence + Broadcast) con locales (BroadcastChannel)
  const updateMergedListeners = useCallback((remoteList) => {
    if (remoteList !== undefined) {
      lastRemoteListRef.current = remoteList;
    }
    const currentRemote = remoteList !== undefined ? remoteList : lastRemoteListRef.current;
    const now = Date.now();
    const map = new Map();

    // 1. Agregar escuchas remotos de Supabase Presence
    currentRemote.forEach(item => {
      if (item && item.clientId && item.clientId !== clientId) {
        if (item.role !== 'manager') {
          map.set(item.clientId, {
            ...item,
            source: 'remote-presence',
            updatedAt: item.updatedAt || now
          });
        }
      }
    });

    // 2. Agregar escuchas remotos de Supabase Realtime Broadcast (fallback robusto)
    broadcastListenersMap.current.forEach((val, key) => {
      if (now - val.updatedAt < 12000 && key !== clientId) {
        if (val.role !== 'manager') {
          map.set(key, { ...val, source: 'remote-broadcast' });
        }
      } else {
        broadcastListenersMap.current.delete(key);
      }
    });

    // 3. Agregar escuchas locales válidos (< 10 segundos, BroadcastChannel entre pestañas)
    localListenersMap.current.forEach((val, key) => {
      if (now - val.updatedAt < 10000 && key !== clientId) {
        if (val.role !== 'manager') {
          map.set(key, { ...val, source: 'local' });
        }
      } else {
        localListenersMap.current.delete(key);
      }
    });

    setListeners(Array.from(map.values()));
  }, [clientId]);

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

  // Suscribirse a cambios en tiempo real + Presence + Comandos remotos
  useEffect(() => {
    const channel = supabase.channel('radio-sync-global', {
      config: {
        presence: { key: clientId }
      }
    });

    const handlePresenceStateChange = () => {
      try {
        const state = channel.presenceState();
        const list = [];
        Object.keys(state).forEach((key) => {
          const arr = state[key];
          if (Array.isArray(arr)) {
            arr.forEach((p) => {
              if (p.role === 'listener' || (!p.role && !key.startsWith('manager-'))) {
                list.push({ ...p, clientId: p.clientId || key });
              }
            });
          }
        });
        updateMergedListeners(list);
      } catch (e) {}
    };

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: SYNC_TABLE,
          filter: `id=eq.${SYNC_ROW_ID}`,
        },
        (payload) => {
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
      .on('broadcast', { event: 'FORCE_RELOAD' }, ({ payload }) => {
        if (!payload || payload.targetClientId === 'all' || payload.targetClientId === clientId) {
          console.log('[RadioSync] Broadcast FORCE_RELOAD recibido. Recargando página (F5)...');
          window.location.reload();
        }
      })
      .on('broadcast', { event: 'REMOTE_COMMAND' }, ({ payload }) => {
        if (payload && payload.senderId !== clientId) {
          if (payload.targetClientId === 'all' || payload.targetClientId === clientId) {
            console.log('[RadioSync] Comando remoto recibido:', payload);
            if (payload.type === 'FORCE_RELOAD') {
              window.location.reload();
            } else if (onRemoteCommandRef.current) {
              onRemoteCommandRef.current(payload);
            }
          }
        }
      })
      .on('broadcast', { event: 'VOLUME_CHANGE' }, ({ payload }) => {
        if (payload && payload.senderId !== clientId) {
          setRemoteVolume({
            volume: payload.volume,
            isMuted: Boolean(payload.isMuted),
            timestamp: payload.timestamp || Date.now()
          });
        }
      })
      .on('broadcast', { event: 'LISTENER_PING' }, ({ payload }) => {
        if (payload && payload.clientId && payload.clientId !== clientId) {
          broadcastListenersMap.current.set(payload.clientId, {
            ...payload,
            updatedAt: Date.now()
          });
          updateMergedListeners();
        }
      })
      .on('presence', { event: 'sync' }, handlePresenceStateChange)
      .on('presence', { event: 'join' }, handlePresenceStateChange)
      .on('presence', { event: 'leave' }, handlePresenceStateChange)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RadioSync] Suscripción Realtime y Presence activa.');
          if (!isManager) {
            try {
              const currentPres = presenceDataRef.current;
              await channel.track({
                clientId,
                role: 'listener',
                device: /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
                isPlaying: Boolean(currentPres?.isPlaying),
                trackTitle: currentPres?.trackTitle || 'Radio al Aire',
                artist: currentPres?.artist || '',
                volume: currentPres?.volume !== undefined ? currentPres.volume : 0.85,
                isMuted: Boolean(currentPres?.isMuted),
                updatedAt: Date.now()
              });
            } catch (e) {}
          }
        } else if (status === 'CHANNEL_ERROR') {
          setSyncError('Realtime no disponible.');
        }
      });

    channelRef.current = channel;

    // Escuchadores BroadcastChannel local entre pestañas del mismo navegador
    let bcReload;
    let bcVolume;
    let bcCommand;
    let bcPresence;

    try {
      bcReload = new BroadcastChannel('radio-reload-channel');
      bcReload.onmessage = (event) => {
        if (event.data?.type === 'FORCE_RELOAD') {
          if (!event.data.targetClientId || event.data.targetClientId === 'all' || event.data.targetClientId === clientId) {
            window.location.reload();
          }
        }
      };

      bcVolume = new BroadcastChannel('radio-volume-channel');
      bcVolume.onmessage = (event) => {
        if (event.data?.type === 'VOLUME_CHANGE' && event.data?.senderId !== clientId) {
          setRemoteVolume({
            volume: event.data.volume,
            isMuted: Boolean(event.data.isMuted),
            timestamp: event.data.timestamp || Date.now()
          });
        }
      };

      bcCommand = new BroadcastChannel('radio-command-channel');
      bcCommand.onmessage = (event) => {
        const cmd = event.data;
        if (cmd && cmd.senderId !== clientId) {
          if (cmd.targetClientId === 'all' || cmd.targetClientId === clientId) {
            if (cmd.type === 'FORCE_RELOAD') {
              window.location.reload();
            } else if (onRemoteCommandRef.current) {
              onRemoteCommandRef.current(cmd);
            }
          }
        }
      };

      bcPresence = new BroadcastChannel('radio-presence-channel');
      bcPresence.onmessage = (event) => {
        if (event.data?.type === 'PRESENCE_PING' && event.data.clientId !== clientId) {
          localListenersMap.current.set(event.data.clientId, event.data);
          updateMergedListeners();
        }
      };
    } catch (e) {}

    // Limpieza periódica cada 3 segundos de escuchas inactivos
    const cleanupInterval = setInterval(() => {
      updateMergedListeners();
    }, 3000);

    return () => {
      clearInterval(cleanupInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (bcReload) bcReload.close();
      if (bcVolume) bcVolume.close();
      if (bcCommand) bcCommand.close();
      if (bcPresence) bcPresence.close();
    };
  }, [clientId, isManager, updateMergedListeners]);

  // Actualizar Presence en Supabase periódicamente y cuando cambie el estado de reproducción
  useEffect(() => {
    if (isManager) return;

    let bc;
    try {
      bc = new BroadcastChannel('radio-presence-channel');
    } catch (e) {}

    const sendHeartbeat = () => {
      const pres = presenceDataRef.current;
      const payload = {
        type: 'PRESENCE_PING',
        clientId,
        role: 'listener',
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
        isPlaying: Boolean(pres?.isPlaying),
        trackTitle: pres?.trackTitle || 'Radio al Aire',
        artist: pres?.artist || '',
        volume: pres?.volume !== undefined ? pres.volume : 0.85,
        isMuted: Boolean(pres?.isMuted),
        updatedAt: Date.now()
      };

      // 1. Localmente vía BroadcastChannel (mismo navegador / pestañas)
      if (bc) {
        try { bc.postMessage(payload); } catch (e) {}
      }

      // 2. Remotamente vía Supabase Realtime Broadcast (entre dispositivos)
      if (channelRef.current) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'LISTENER_PING',
            payload
          });
        } catch (e) {}

        // 3. Remotamente vía Supabase Presence track
        try {
          channelRef.current.track(payload);
        } catch (e) {}
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 2500);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [isManager, clientId]);

  // Enviar comando remoto (a una instancia o a todas)
  const sendRemoteCommand = async ({ type, targetClientId = 'all', payload = {} }) => {
    const cmd = {
      type,
      targetClientId,
      senderId: clientId,
      timestamp: Date.now(),
      ...payload
    };

    // 1. Enviar por BroadcastChannel local para pestañas en la misma máquina (0ms)
    try {
      const bc = new BroadcastChannel('radio-command-channel');
      bc.postMessage(cmd);
      bc.close();
    } catch (e) {}

    // 2. Enviar por Supabase Realtime a todas las instancias remotas conectadas
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'REMOTE_COMMAND',
          payload: cmd
        });
      }
    } catch (e) {}
  };

  // Forzar recarga global (F5) en todas las instancias oyentes
  const broadcastForceReload = async () => {
    try {
      const bc = new BroadcastChannel('radio-reload-channel');
      bc.postMessage({ type: 'FORCE_RELOAD', timestamp: Date.now() });
      bc.close();
    } catch (e) {}

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'FORCE_RELOAD',
          payload: { timestamp: Date.now(), targetClientId: 'all' }
        });
      }
    } catch (e) {}
  };

  const broadcastPlay = async (track, tab = 'supabase', isPlaying = true, volume = 0.85, isMuted = false) => {
    if (!isManager) return;
    setIsSyncing(true);
    try {
      const isoNow = new Date().toISOString();
      const payload = {
        station_name: track.title || 'Pista de Radio',
        station_artist: track.artist || '',
        station_cover: track.cover || '',
        station_url: track.url || track.station_url || '',
        tab: tab || 'supabase',
        is_playing: isPlaying,
        updated_at: isoNow
      };
      await supabase.from(SYNC_TABLE).update(payload).eq('id', SYNC_ROW_ID);
    } catch (e) {
      console.warn('[RadioSync] Error al emitir play:', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const broadcastStop = async () => {
    if (!isManager) return;
    setIsSyncing(true);
    try {
      await supabase
        .from(SYNC_TABLE)
        .update({
          is_playing: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', SYNC_ROW_ID);
    } catch (e) {
      console.warn('[RadioSync] Error al emitir pausa:', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const broadcastVolume = async (newVol, isMuted = false) => {
    if (!isManager) return;
    try {
      const bc = new BroadcastChannel('radio-volume-channel');
      bc.postMessage({ type: 'VOLUME_CHANGE', volume: newVol, isMuted, timestamp: Date.now(), senderId: clientId });
      bc.close();
    } catch (e) {}

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'VOLUME_CHANGE',
          payload: { volume: newVol, isMuted, timestamp: Date.now(), senderId: clientId }
        });
      }
    } catch (e) {}
  };

  return {
    currentPlay,
    remoteVolume,
    isSyncing,
    syncError,
    listeners,
    activeListenersCount: listeners.length,
    sendRemoteCommand,
    broadcastPlay,
    broadcastStop,
    broadcastVolume,
    broadcastForceReload
  };
}
export default useRadioSync;
