import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../config/supabaseClient';

const SYNC_TABLE = 'radio_current_play';
const SYNC_ROW_ID = 1;

/**
 * Hook de sincronizacion global de radio via Supabase Realtime + Presencia de Escuchas + Control Remoto.
 * - Lee el estado actual al montar el componente.
 * - Suscribe a cambios en tiempo real (WebSocket).
 * - Monitorea instancias/oyentes en vivo (Presence + BroadcastChannel local).
 * - Permite enviar comandos a instancias individuales o a todas (F5, pausar, reproducir, listas específicas).
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

  // Reloj de emisión continua en vivo (Live Broadcast Clock)
  const liveTimeTickRef = useRef(null);

  const channelRef = useRef(null);
  const onRemoteCommandRef = useRef(onRemoteCommand);
  onRemoteCommandRef.current = onRemoteCommand;

  const clientId = useRef((() => {
    try {
      const stored = sessionStorage.getItem('proyecto_radio_client_id');
      if (stored) return stored;
      const gen = 'listener-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
      sessionStorage.setItem('proyecto_radio_client_id', gen);
      return gen;
    } catch (e) {
      return 'listener-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    }
  })()).current;

  const hasVolumeColumnRef = useRef(true);

  // Combinar escuchas remotos (Supabase Presence) con locales (BroadcastChannel)
  const updateMergedListeners = useCallback((remoteList = []) => {
    const now = Date.now();
    const map = new Map();

    // 1. Agregar escuchas remotos de Supabase
    remoteList.forEach(item => {
      if (item.clientId && item.clientId !== clientId) {
        map.set(item.clientId, {
          ...item,
          source: 'remote',
          updatedAt: item.updatedAt || now
        });
      }
    });

    // 2. Agregar escuchas locales válidos (< 10 segundos)
    localListenersMap.current.forEach((val, key) => {
      if (now - val.updatedAt < 10000 && key !== clientId) {
        map.set(key, { ...val, source: 'local' });
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
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const list = [];
        Object.keys(state).forEach((key) => {
          const arr = state[key];
          if (Array.isArray(arr)) {
            arr.forEach((p) => {
              if (p.role === 'listener' || !p.role) {
                list.push(p);
              }
            });
          }
        });
        updateMergedListeners(list);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RadioSync] Suscripción Realtime y Presence activa.');
          if (!isManager) {
            try {
              await channel.track({
                clientId,
                role: 'listener',
                device: /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
                isPlaying: Boolean(presenceData?.isPlaying),
                trackTitle: presenceData?.trackTitle || 'En espera',
                artist: presenceData?.artist || '',
                volume: presenceData?.volume !== undefined ? presenceData.volume : 0.85,
                isMuted: Boolean(presenceData?.isMuted),
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

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (bcReload) bcReload.close();
      if (bcVolume) bcVolume.close();
      if (bcCommand) bcCommand.close();
      if (bcPresence) bcPresence.close();
    };
  }, [clientId, isManager, updateMergedListeners]);

  // Actualizar Presence en Supabase y localmente cuando cambie el estado de reproducción
  useEffect(() => {
    if (!isManager && channelRef.current) {
      try {
        channelRef.current.track({
          clientId,
          role: 'listener',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
          isPlaying: Boolean(presenceData?.isPlaying),
          trackTitle: presenceData?.trackTitle || 'En espera',
          artist: presenceData?.artist || '',
          volume: presenceData?.volume !== undefined ? presenceData.volume : 0.85,
          isMuted: Boolean(presenceData?.isMuted),
          updatedAt: Date.now()
        });
      } catch (e) {}
    }
  }, [isManager, clientId, presenceData?.isPlaying, presenceData?.trackTitle, presenceData?.artist, presenceData?.volume, presenceData?.isMuted]);

  // Enviar heartbeat local (BroadcastChannel) cada 3 segundos si es oyente
  useEffect(() => {
    if (isManager) return;
    let bc;
    try {
      bc = new BroadcastChannel('radio-presence-channel');
    } catch (e) {
      return;
    }

    const sendPing = () => {
      try {
        bc.postMessage({
          type: 'PRESENCE_PING',
          clientId,
          role: 'listener',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
          isPlaying: Boolean(presenceData?.isPlaying),
          trackTitle: presenceData?.trackTitle || 'En espera',
          artist: presenceData?.artist || '',
          volume: presenceData?.volume !== undefined ? presenceData.volume : 0.85,
          isMuted: Boolean(presenceData?.isMuted),
          updatedAt: Date.now()
        });
      } catch (e) {}
    };

    sendPing();
    const interval = setInterval(sendPing, 3000);
    return () => {
      clearInterval(interval);
      bc.close();
    };
  }, [isManager, clientId, presenceData?.isPlaying, presenceData?.trackTitle, presenceData?.artist, presenceData?.volume, presenceData?.isMuted]);

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
    } catch (e) {
      console.warn('[RadioSync] Error enviando comando remoto:', e);
    }
  };

  const broadcastVolume = async (volume, isMuted = false) => {
    // REGLA JERÁRQUICA ESTRICTA:
    // Un oyente/receptor (Proyecto Radio) NO PUEDE alterar el volumen maestro de emisión ni silenciar Radio Manager.
    // Solo el operador maestro (isManager === true) puede emitir cambios globales.
    if (!isManager) {
      return;
    }

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

  const broadcastForceReload = async (targetClientId = 'all') => {
    try {
      setIsSyncing(true);

      // 1. Emitir comando por BroadcastChannel y Supabase
      await sendRemoteCommand({
        type: 'FORCE_RELOAD',
        targetClientId,
      });

      // 2. Si es para todos, registrar también en tabla
      if (targetClientId === 'all') {
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
      }
    } catch (err) {
      console.warn('[RadioSync] Error en broadcastForceReload:', err.message);
    } finally {
      setIsSyncing(false);
    }

    if (targetClientId === 'all' || targetClientId === clientId) {
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  return {
    currentPlay,
    remoteVolume,
    broadcastPlay,
    broadcastStop,
    broadcastVolume,
    broadcastForceReload,
    sendRemoteCommand,
    listeners,
    activeListenersCount: listeners.length,
    clientId,
    isSyncing,
    syncError,
  };
}
