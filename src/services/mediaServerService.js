import supabase from '../config/supabaseClient';

const HEALTH_TIMEOUT_MS = 4000;
const CATALOG_TIMEOUT_MS = 12000;
const LOCALHOST_MEDIA_SERVER_URL = 'http://localhost:4880';

let cachedActiveBaseUrl = null;

export function setActiveMediaServerBaseUrl(rawUrl) {
  cachedActiveBaseUrl = normalizeBaseUrl(rawUrl);
  return cachedActiveBaseUrl;
}

export function getActiveMediaServerBaseUrl() {
  return cachedActiveBaseUrl;
}

const MEDIA_PROTOCOL_REGEX = /^media:\/\/(img|thumb)\/([a-f0-9]+)(\?.*)?$/i;
const MEDIA_TUNNEL_REGEX =
  /^https?:\/\/(?:[a-z0-9-]+\.trycloudflare\.com|localhost:4880|127\.0\.0\.1:4880)\/media\/(img|thumb)\/([a-f0-9]+)(\?.*)?$/i;

/**
 * Normalizes a base URL by removing trailing slashes.
 */
export function normalizeBaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }
  return trimmed;
}

/**
 * Resolves a relative server path against a baseUrl (used internally for audio endpoints).
 */
function resolveServerPath(baseUrl, urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (!baseUrl) return trimmed;
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Checks whether a URL is a Personal Media Server reference (`media://...` or tunnel/localhost media URL).
 */
export function isMediaServerRef(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return MEDIA_PROTOCOL_REGEX.test(trimmed) || MEDIA_TUNNEL_REGEX.test(trimmed);
}

/**
 * Extracts `{ kind, id, query }` from a Personal Media Server reference, or returns null.
 */
export function parseMediaServerRef(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m1 = trimmed.match(MEDIA_PROTOCOL_REGEX);
  if (m1) {
    return { kind: m1[1].toLowerCase(), id: m1[2], query: m1[3] || '' };
  }
  const m2 = trimmed.match(MEDIA_TUNNEL_REGEX);
  if (m2) {
    return { kind: m2[1].toLowerCase(), id: m2[2], query: m2[3] || '' };
  }
  return null;
}

/**
 * Converts a temporary tunnel/localhost media URL into the stable canonical `media://img/<id>` URI.
 * External URLs (Google Drive, Unsplash, etc.) are returned intact.
 */
export function toCanonicalMediaUri(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const parsed = parseMediaServerRef(trimmed);
  if (!parsed) return trimmed;
  return `media://${parsed.kind}/${parsed.id}${parsed.query}`;
}

/**
 * Resolves a stored media URL (`media://img/<id>`, `media://thumb/<id>`, or legacy tunnel URL)
 * against the active Personal Media Server `baseUrl`.
 * External URLs (Google Drive, Unsplash, data:image/..., etc.) are returned intact.
 */
export function resolveMediaUrl(url, activeBaseUrl) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const parsed = parseMediaServerRef(trimmed);
  if (parsed) {
    const cleanBase = normalizeBaseUrl(activeBaseUrl) || cachedActiveBaseUrl;
    if (!cleanBase) {
      return trimmed.startsWith('media://') ? '' : trimmed;
    }
    return `${cleanBase}/media/${parsed.kind}/${parsed.id}${parsed.query}`;
  }

  return trimmed;
}

/**
 * Resolves a stored media URL to an optimized WebP thumbnail from the Personal Media Server.
 * External URLs are returned intact.
 */
export function resolveMediaThumbUrl(url, activeBaseUrl, width = 360) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const parsed = parseMediaServerRef(trimmed);
  if (parsed) {
    const cleanBase = normalizeBaseUrl(activeBaseUrl) || cachedActiveBaseUrl;
    if (!cleanBase) {
      return trimmed.startsWith('media://') ? '' : trimmed;
    }
    return `${cleanBase}/media/thumb/${parsed.id}?w=${encodeURIComponent(width)}&fmt=webp`;
  }

  return trimmed;
}

/**
 * Builds the canonical stream URL for a track using a given baseUrl.
 */
export function buildStreamUrl(baseUrl, track) {
  if (baseUrl && track?.id) {
    return `${baseUrl}/media/audio/${encodeURIComponent(track.id)}`;
  }
  return resolveServerPath(baseUrl, track?.streamUrl || track?.url || '');
}

/**
 * Builds the canonical cover URL for a track using a given baseUrl.
 */
export function buildCoverUrl(baseUrl, track) {
  if (baseUrl && track?.id) {
    return `${baseUrl}/media/audio/${encodeURIComponent(track.id)}/cover`;
  }
  return resolveServerPath(baseUrl, track?.coverUrl || track?.cover || '');
}

/**
 * Reads the single active media server row from Supabase `media_server_config`.
 * Uses anon key public read. Does not touch any legacy tables or Supabase Storage.
 */
export async function fetchMediaServerConfig() {
  const { data: serverCfg, error } = await supabase
    .from('media_server_config')
    .select('public_url, online, total_images, total_audio, updated_at')
    .eq('id', 'default')
    .single();

  if (error) {
    return {
      online: false,
      baseUrl: null,
      totalImages: 0,
      totalAudio: 0,
      updatedAt: null,
      error: error.message || 'No se pudo consultar la configuración del servidor',
    };
  }

  const baseUrl = normalizeBaseUrl(serverCfg?.public_url);
  const online = Boolean(serverCfg?.online && baseUrl);

  return {
    online,
    baseUrl,
    totalImages: Number(serverCfg?.total_images) || 0,
    totalAudio: Number(serverCfg?.total_audio) || 0,
    updatedAt: serverCfg?.updated_at || null,
    error: null,
  };
}

/**
 * Verifies that the Personal Media Server tunnel is reachable via GET ${baseUrl}/api/health.
 */
export async function checkMediaServerHealth(baseUrl, timeoutMs = HEALTH_TIMEOUT_MS) {
  const cleanBase = normalizeBaseUrl(baseUrl);
  if (!cleanBase) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanBase}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function isRunningOnLocalhost() {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Discovers the active Personal Media Server URL from Supabase and checks /api/health.
 * Falls back to http://localhost:4880 when running locally.
 */
export async function discoverMediaServer(timeoutMs = HEALTH_TIMEOUT_MS) {
  const config = await fetchMediaServerConfig();

  if (config.online && config.baseUrl) {
    const healthy = await checkMediaServerHealth(config.baseUrl, timeoutMs);
    if (healthy) {
      setActiveMediaServerBaseUrl(config.baseUrl);
      return {
        online: true,
        baseUrl: config.baseUrl,
        config,
        reason: null,
      };
    }
  }

  // Fallback local opcional si se abre desde localhost
  if (isRunningOnLocalhost()) {
    const localHealthy = await checkMediaServerHealth(LOCALHOST_MEDIA_SERVER_URL, 2000);
    if (localHealthy) {
      setActiveMediaServerBaseUrl(LOCALHOST_MEDIA_SERVER_URL);
      return {
        online: true,
        baseUrl: LOCALHOST_MEDIA_SERVER_URL,
        config: { ...config, online: true, baseUrl: LOCALHOST_MEDIA_SERVER_URL },
        reason: null,
      };
    }
  }

  // Even if health check timed out, keep baseUrl cached if Supabase provided one so images can attempt load
  if (config.baseUrl) {
    setActiveMediaServerBaseUrl(config.baseUrl);
  }

  return {
    online: false,
    baseUrl: config.baseUrl || null,
    config,
    reason: config.error ? 'config_error' : config.baseUrl ? 'health_timeout' : 'server_offline',
  };
}

/**
 * Lists or searches images hosted on the Personal Media Server.
 * GET ${baseUrl}/api/images?q=&folder=&ext=&sort=&page=&limit=
 */
export async function fetchMediaImages(baseUrl, options = {}) {
  const cleanBase = normalizeBaseUrl(baseUrl) || cachedActiveBaseUrl;
  if (!cleanBase) {
    throw new Error('Servidor multimedia personal no disponible');
  }

  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.folder) params.set('folder', options.folder);
  if (options.ext) params.set('ext', options.ext);
  if (options.sort) params.set('sort', options.sort);
  params.set('page', String(options.page || 1));
  params.set('limit', String(options.limit || 50));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || CATALOG_TIMEOUT_MS);

  try {
    const res = await fetch(`${cleanBase}/api/images?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al listar imágenes del servidor multimedia`);
    }

    const data = await res.json();
    const items = (Array.isArray(data?.items) ? data.items : []).map((item) => ({
      ...item,
      mediaUri: item?.id ? `media://img/${item.id}` : '',
      thumbUrl: item?.id ? `${cleanBase}/media/thumb/${item.id}?w=360&fmt=webp` : resolveServerPath(cleanBase, item?.thumbUrl),
      previewUrl: item?.id ? `${cleanBase}/media/thumb/${item.id}?w=800&fmt=webp` : resolveServerPath(cleanBase, item?.previewUrl),
      fullUrl: item?.id ? `${cleanBase}/media/img/${item.id}` : resolveServerPath(cleanBase, item?.fullUrl),
    }));

    return {
      total: Number(data?.total) || items.length,
      page: Number(data?.page) || 1,
      limit: Number(data?.limit) || 50,
      totalPages: Number(data?.totalPages) || 1,
      folders: Array.isArray(data?.folders) ? data.folders : [],
      extensions: Array.isArray(data?.extensions) ? data.extensions : [],
      items,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Uploads an image file to the Personal Media Server (`POST ${baseUrl}/api/admin/upload`).
 * Returns `{ id, mediaUri: 'media://img/<id>', fullUrl, thumbUrl, item }`.
 */
export async function uploadImageToMediaServer(file, options = {}) {
  if (!file) throw new Error('No se proporcionó ningún archivo de imagen');

  let cleanBase = normalizeBaseUrl(options.baseUrl) || cachedActiveBaseUrl;
  if (!cleanBase) {
    const discovered = await discoverMediaServer();
    cleanBase = discovered.baseUrl;
  }
  if (!cleanBase) {
    throw new Error('El Personal Media Server está desconectado. Inicia el servidor local e intenta de nuevo.');
  }

  const formData = new FormData();
  formData.append('files', file);
  formData.append('folder', options.folder || 'proyectocafe-galeria');

  const headers = {};
  const apiKey =
    options.apiKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MEDIA_SERVER_API_KEY) ||
    (typeof window !== 'undefined' ? window.localStorage?.getItem('media_server_api_key') : '') ||
    '';
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const res = await fetch(`${cleanBase}/api/admin/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errDetail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.error || errJson?.message) errDetail = errJson.error || errJson.message;
    } catch {}
    throw new Error(`Error al subir imagen al Personal Media Server: ${errDetail}`);
  }

  const data = await res.json();
  const uploadedItem =
    (Array.isArray(data?.items) && data.items[0]) ||
    (Array.isArray(data?.uploaded) && data.uploaded[0]) ||
    (Array.isArray(data?.files) && data.files[0]) ||
    data?.item ||
    data;

  const id = uploadedItem?.id || uploadedItem?.mediaId;
  if (!id) {
    throw new Error('El servidor multimedia no devolvió el ID de la imagen subida.');
  }

  return {
    id,
    mediaUri: `media://img/${id}`,
    fullUrl: `${cleanBase}/media/img/${id}`,
    thumbUrl: `${cleanBase}/media/thumb/${id}?w=360&fmt=webp`,
    item: uploadedItem,
  };
}

/**
 * Normalizes a single track from the Personal Media Server API into the shape used by the Radio UI.
 */
export function normalizeTrack(raw, baseUrl, index = 0) {
  const id = raw?.id != null ? String(raw.id) : `track-${index}`;
  const streamUrl = resolveServerPath(baseUrl, raw?.streamUrl) || (baseUrl ? `${baseUrl}/media/audio/${encodeURIComponent(id)}` : '');
  const coverUrl = resolveServerPath(baseUrl, raw?.coverUrl) || (baseUrl ? `${baseUrl}/media/audio/${encodeURIComponent(id)}/cover` : '');

  return {
    id,
    title: raw?.title || raw?.fileName?.replace(/\.[^/.]+$/, '') || 'Pista sin título',
    artist: raw?.artist || 'Artista desconocido',
    album: raw?.album || 'Sencillos',
    duration: Number(raw?.duration) || 0,
    trackNumber: raw?.trackNumber ?? null,
    year: raw?.year ?? null,
    fileName: raw?.fileName || '',
    sizeBytes: Number(raw?.sizeBytes) || 0,
    sizeFormatted: raw?.sizeFormatted || '',
    coverUrl,
    streamUrl,
    // Compatibility aliases for player components
    url: streamUrl,
    cover: coverUrl,
    isLiveStream: false,
    source: 'media-server',
  };
}

/**
 * Fetches the music catalog from GET ${baseUrl}/api/audio?groupBy=album.
 */
export async function fetchMediaCatalog(baseUrl, options = {}) {
  const cleanBase = normalizeBaseUrl(baseUrl);
  if (!cleanBase) {
    throw new Error('URL base del Personal Media Server no válida');
  }

  const params = new URLSearchParams();
  params.set('groupBy', options.groupBy || 'album');
  if (options.q) params.set('q', options.q);
  if (options.album) params.set('album', options.album);
  if (options.artist) params.set('artist', options.artist);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || CATALOG_TIMEOUT_MS);

  try {
    const res = await fetch(`${cleanBase}/api/audio?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al cargar el catálogo`);
    }

    const data = await res.json();
    return normalizeCatalogResponse(data, cleanBase);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalizes the /api/audio JSON response into consistent `tracks` and `albums` arrays.
 */
export function normalizeCatalogResponse(data, baseUrl) {
  const rawTracks = Array.isArray(data?.tracks) ? data.tracks : [];
  const rawAlbums = Array.isArray(data?.albums) ? data.albums : [];

  // Normalize flat tracks list first
  let tracks = rawTracks.map((t, idx) => ({
    ...normalizeTrack(t, baseUrl, idx),
    playlistOriginalIndex: idx,
  }));

  // Build quick lookup from track id -> playlistOriginalIndex
  const trackIndexById = new Map();
  tracks.forEach((t, idx) => trackIndexById.set(t.id, idx));

  // If server returned albums with nested tracks but empty top-level tracks, collect them
  if (tracks.length === 0 && rawAlbums.length > 0) {
    let runningIdx = 0;
    rawAlbums.forEach((alb) => {
      (alb.tracks || []).forEach((rawT) => {
        const normalized = {
          ...normalizeTrack({ ...rawT, album: rawT.album || alb.album, artist: rawT.artist || alb.artist }, baseUrl, runningIdx),
          playlistOriginalIndex: runningIdx,
        };
        tracks.push(normalized);
        trackIndexById.set(normalized.id, runningIdx);
        runningIdx += 1;
      });
    });
  }

  // Group flat tracks by album name for fallback when album.tracks is empty
  const tracksByAlbumKey = new Map();
  tracks.forEach((t) => {
    const key = (t.album || 'Sencillos').trim().toLowerCase();
    if (!tracksByAlbumKey.has(key)) tracksByAlbumKey.set(key, []);
    tracksByAlbumKey.get(key).push(t);
  });

  let albums;
  if (rawAlbums.length > 0) {
    albums = rawAlbums.map((alb) => {
      const albumName = (alb.album || 'Sencillos').trim();
      const key = albumName.toLowerCase();

      let albumTracks = [];
      if (Array.isArray(alb.tracks) && alb.tracks.length > 0) {
        albumTracks = alb.tracks.map((rawT, idx) => {
          const normalized = normalizeTrack({ ...rawT, album: rawT.album || albumName }, baseUrl, idx);
          const originalIdx = trackIndexById.has(normalized.id) ? trackIndexById.get(normalized.id) : idx;
          return { ...normalized, playlistOriginalIndex: originalIdx };
        });
      } else {
        albumTracks = tracksByAlbumKey.get(key) || [];
      }

      const coverUrl =
        resolveServerPath(baseUrl, alb.coverUrl) ||
        albumTracks[0]?.coverUrl ||
        '';

      const totalDuration =
        Number(alb.totalDuration) ||
        albumTracks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0);

      return {
        name: albumName,
        album: albumName,
        artist: alb.artist || albumTracks[0]?.artist || 'Varios Artistas',
        coverUrl,
        cover: coverUrl,
        trackCount: Number(alb.trackCount) || albumTracks.length,
        totalDuration,
        tracks: albumTracks,
      };
    });
  } else {
    // Fallback: group tracks client-side if server returned flat mode
    albums = Array.from(tracksByAlbumKey.entries()).map(([, groupTracks]) => {
      const first = groupTracks[0];
      return {
        name: first.album || 'Sencillos',
        album: first.album || 'Sencillos',
        artist: first.artist || 'Varios Artistas',
        coverUrl: first.coverUrl || '',
        cover: first.coverUrl || '',
        trackCount: groupTracks.length,
        totalDuration: groupTracks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0),
        tracks: groupTracks,
      };
    });
  }

  return {
    total: Number(data?.total) || tracks.length,
    groupBy: data?.groupBy || 'album',
    tracks,
    albums,
  };
}

/**
 * Rewrites streamUrl & coverUrl across existing tracks and albums after a Cloudflare Tunnel URL change.
 */
export function rebaseCatalogUrls(tracks, albums, newBaseUrl) {
  const cleanBase = normalizeBaseUrl(newBaseUrl);
  if (!cleanBase) return { tracks, albums };

  const rebaseTrack = (t) => {
    if (!t?.id) return t;
    const streamUrl = buildStreamUrl(cleanBase, t);
    const coverUrl = buildCoverUrl(cleanBase, t);
    return {
      ...t,
      streamUrl,
      url: streamUrl,
      coverUrl,
      cover: coverUrl,
    };
  };

  const nextTracks = (tracks || []).map(rebaseTrack);
  const nextAlbums = (albums || []).map((alb) => {
    const nextAlbTracks = (alb.tracks || []).map(rebaseTrack);
    const firstTrackCover = nextAlbTracks[0]?.coverUrl || '';
    const coverUrl = firstTrackCover || resolveServerPath(cleanBase, alb.coverUrl);
    return {
      ...alb,
      coverUrl,
      cover: coverUrl,
      tracks: nextAlbTracks,
    };
  });

  return { tracks: nextTracks, albums: nextAlbums };
}
