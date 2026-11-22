import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import supabase from '../config/supabaseClient';
import {
  discoverMediaServer,
  resolveMediaUrl as rawResolveMediaUrl,
  resolveMediaThumbUrl as rawResolveMediaThumbUrl,
  fetchMediaImages as rawFetchMediaImages,
  uploadImageToMediaServer as rawUploadImageToMediaServer,
  toCanonicalMediaUri,
  isMediaServerRef,
} from '../services/mediaServerService';

const MediaServerContext = createContext({
  baseUrl: null,
  online: false,
  loading: true,
  reason: null,
  config: null,
  refresh: async () => {},
  resolveMediaUrl: (url) => rawResolveMediaUrl(url),
  resolveMediaThumbUrl: (url, width = 360) => rawResolveMediaThumbUrl(url, null, width),
  fetchMediaImages: (options) => rawFetchMediaImages(null, options),
  uploadImageToMediaServer: (file, options) => rawUploadImageToMediaServer(file, options),
  toCanonicalMediaUri,
  isMediaServerRef,
});

export function MediaServerProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState(null);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(null);
  const [config, setConfig] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await discoverMediaServer();
      setBaseUrl(result.baseUrl || null);
      setOnline(Boolean(result.online));
      setReason(result.reason || null);
      setConfig(result.config || null);
      return result;
    } catch (err) {
      setOnline(false);
      setReason('discovery_error');
      return { online: false, baseUrl: null, reason: 'discovery_error' };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Escuchar actualizaciones en tiempo real de media_server_config (rotación de Quick Tunnel)
    const channel = supabase
      .channel('media-server-config-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_server_config', filter: 'id=eq.default' },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [refresh]);

  const resolveMediaUrl = useCallback(
    (url) => rawResolveMediaUrl(url, baseUrl),
    [baseUrl]
  );

  const resolveMediaThumbUrl = useCallback(
    (url, width = 360) => rawResolveMediaThumbUrl(url, baseUrl, width),
    [baseUrl]
  );

  const fetchMediaImages = useCallback(
    (options = {}) => rawFetchMediaImages(baseUrl, options),
    [baseUrl]
  );

  const uploadImageToMediaServer = useCallback(
    (file, options = {}) => rawUploadImageToMediaServer(file, { ...options, baseUrl }),
    [baseUrl]
  );

  const value = useMemo(
    () => ({
      baseUrl,
      online,
      loading,
      reason,
      config,
      refresh,
      resolveMediaUrl,
      resolveMediaThumbUrl,
      fetchMediaImages,
      uploadImageToMediaServer,
      toCanonicalMediaUri,
      isMediaServerRef,
    }),
    [
      baseUrl,
      online,
      loading,
      reason,
      config,
      refresh,
      resolveMediaUrl,
      resolveMediaThumbUrl,
      fetchMediaImages,
      uploadImageToMediaServer,
    ]
  );

  return (
    <MediaServerContext.Provider value={value}>
      {children}
    </MediaServerContext.Provider>
  );
}

export function useMediaServer() {
  return useContext(MediaServerContext);
}

export default MediaServerContext;
