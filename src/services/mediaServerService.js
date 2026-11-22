import supabase from '../config/supabaseClient';

const HEALTH_TIMEOUT_MS = 4000;
const CATALOG_TIMEOUT_MS = 12000;

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
 * Resolves a media URL against the active server baseUrl.
 */
export function resolveMediaUrl(baseUrl, urlOrPath) {
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
 * Builds the canonical stream URL for a track using a given baseUrl.
 */
export function buildStreamUrl(baseUrl, track) {
  if (baseUrl && track?.id) {
    return `${baseUrl}/media/audio/${encodeURIComponent(track.id)}`;
  }
  return resolveMediaUrl(baseUrl, track?.streamUrl || track?.url || '');
}

/**
 * Builds the canonical cover URL for a track using a given baseUrl.
 */
export function buildCoverUrl(baseUrl, track) {
  if (baseUrl && track?.id) {
    return `${baseUrl}/media/audio/${encodeURIComponent(track.id)}/cover`;
  }
  return resolveMediaUrl(baseUrl, track?.coverUrl || track?.cover || '');
}

/**
 * Reads the single active media server row from Supabase `media_server_config`.
 * Uses anon key public read. Does not touch any legacy tables or Supabase Storage.
 */
export async function fetchMediaServerConfig() {
  const { data: serverCfg, error } = await supabase
    .from('media_server_config')
    .select('public_url, online, total_audio, updated_at')
    .eq('id', 'default')
    .single();

  if (error) {
    return {
      online: false,
      baseUrl: null,
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

/**
 * Discovers the active Personal Media Server URL from Supabase and checks /api/health.
 */
export async function discoverMediaServer(timeoutMs = HEALTH_TIMEOUT_MS) {
  const config = await fetchMediaServerConfig();

  if (!config.online || !config.baseUrl) {
    return {
      online: false,
      baseUrl: null,
      config,
      reason: config.error ? 'config_error' : 'server_offline',
    };
  }

  const healthy = await checkMediaServerHealth(config.baseUrl, timeoutMs);
  if (!healthy) {
    return {
      online: false,
      baseUrl: config.baseUrl,
      config,
      reason: 'health_timeout',
    };
  }

  return {
    online: true,
    baseUrl: config.baseUrl,
    config,
    reason: null,
  };
}

/**
 * Normalizes a single track from the Personal Media Server API into the shape used by the Radio UI.
 */
export function normalizeTrack(raw, baseUrl, index = 0) {
  const id = raw?.id != null ? String(raw.id) : `track-${index}`;
  const streamUrl = resolveMediaUrl(baseUrl, raw?.streamUrl) || (baseUrl ? `${baseUrl}/media/audio/${encodeURIComponent(id)}` : '');
  const coverUrl = resolveMediaUrl(baseUrl, raw?.coverUrl) || (baseUrl ? `${baseUrl}/media/audio/${encodeURIComponent(id)}/cover` : '');

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
        resolveMediaUrl(baseUrl, alb.coverUrl) ||
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
    const coverUrl = firstTrackCover || resolveMediaUrl(cleanBase, alb.coverUrl);
    return {
      ...alb,
      coverUrl,
      cover: coverUrl,
      tracks: nextAlbTracks,
    };
  });

  return { tracks: nextTracks, albums: nextAlbums };
}
