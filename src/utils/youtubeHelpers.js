/**
 * Extrae el ID de un video de YouTube desde diversos formatos de URL.
 * Soporta:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - VIDEO_ID directo (11 caracteres)
 */
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Si ya es un ID de 11 caracteres sin protocolo
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Retorna la URL del thumbnail de YouTube con la máxima compatibilidad (mqdefault / 0.jpg).
 */
export function getYoutubeThumbnail(videoId) {
  if (!videoId) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600';
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Formatea segundos a mm:ss o hh:mm:ss.
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Categorías predefinidas para organizar temas de YouTube
 */
export const YOUTUBE_CATEGORIES = [
  'Todos',
  'Lofi & Chill',
  'Jazz & Lounge',
  'Rock & Classic',
  'Ambient & Relax',
  'Salsa & Tropical',
  'Pop & Electronic'
];

/**
 * Playlist inicial curada de enlaces de YouTube por defecto.
 */
export const DEFAULT_YOUTUBE_PLAYLIST = [
  {
    id: 'yt-default-1',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    youtubeId: '5qap5aO4i9A',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=600',
    category: 'Lofi & Chill',
    order_index: 0,
    is_favorite: true,
    isLiveStream: true,
    type: 'youtube'
  },
  {
    id: 'yt-default-2',
    title: 'Relaxing Jazz Piano Radio',
    artist: 'Cafe Music BGM',
    youtubeId: '21qNxnCS8MA',
    url: 'https://www.youtube.com/watch?v=21qNxnCS8MA',
    cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
    category: 'Jazz & Lounge',
    order_index: 1,
    is_favorite: false,
    isLiveStream: true,
    type: 'youtube'
  },
  {
    id: 'yt-default-3',
    title: 'Coffee Shop Ambience & Smooth Jazz',
    artist: 'Relaxing BGM',
    youtubeId: 'fEvM-OUbaKs',
    url: 'https://www.youtube.com/watch?v=fEvM-OUbaKs',
    cover: 'https://images.unsplash.com/photo-1445985543468-b42169244793?auto=format&fit=crop&q=80&w=600',
    category: 'Ambient & Relax',
    order_index: 2,
    is_favorite: true,
    isLiveStream: true,
    type: 'youtube'
  }
];

/**
 * Extrae el ID de una lista de reproducción (Playlist) de YouTube.
 * Soporta:
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
 */
export function extractPlaylistId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Obtiene el título y autor/canal de un video de YouTube automáticamente mediante oEmbed o noembed.
 */
export async function fetchYoutubeMetadata(urlOrId) {
  const videoId = extractYoutubeId(urlOrId);
  if (!videoId) return null;

  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = getYoutubeThumbnail(videoId);

  // Intentar oEmbed oficial de YouTube
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          url: targetUrl,
          title: data.title,
          artist: data.author_name || 'Canal de YouTube',
          cover: thumbnail
        };
      }
    }
  } catch (e) {
    // Fallback silencioso a noembed
  }

  // Fallback 2: Noembed
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          url: targetUrl,
          title: data.title,
          artist: data.author_name || 'Canal de YouTube',
          cover: thumbnail
        };
      }
    }
  } catch (e) {}

  return {
    videoId,
    url: targetUrl,
    title: `Video de YouTube (${videoId})`,
    artist: 'YouTube',
    cover: thumbnail
  };
}

/**
 * Extrae los videos de una playlist pública de YouTube utilizando el Feed RSS XML + fallback de proxies CORS.
 */
export async function fetchYoutubePlaylist(playlistId) {
  if (!playlistId) return [];

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const entries = Array.from(xmlDoc.querySelectorAll("entry"));

        if (entries.length > 0) {
          return entries.map(entry => {
            const videoIdNode = entry.querySelector("videoId") || entry.getElementsByTagName("yt:videoId")[0];
            const videoId = videoIdNode ? videoIdNode.textContent.trim() : '';
            const titleNode = entry.querySelector("title");
            const title = titleNode ? titleNode.textContent.trim() : `Video ${videoId}`;
            const authorNode = entry.querySelector("name") || entry.querySelector("author > name");
            const author = authorNode ? authorNode.textContent.trim() : 'Canal de YouTube';

            return {
              videoId,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              title,
              artist: author,
              cover: getYoutubeThumbnail(videoId)
            };
          }).filter(item => item.videoId && item.videoId.length === 11);
        }
      }
    } catch (err) {
      console.warn("Proxy playlist attempt failed:", err);
    }
  }
  return [];
}

/**
 * Extrae los videos de un Mix / Radio de YouTube (list=RD... o start_radio=1) analizando la página del mix vía proxy.
 */
export async function fetchYoutubeMix(urlOrPlaylistId) {
  let targetUrl = urlOrPlaylistId;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.youtube.com/watch?v=POzphzik4l0&list=${urlOrPlaylistId}`;
  }

  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const videoIds = extractAllYoutubeVideoIds(html);
        if (videoIds.length > 0) {
          return videoIds;
        }
      }
    } catch (err) {
      console.warn("Error obteniendo mix de YouTube via proxy:", err);
    }
  }
  return [];
}

/**
 * Extrae todos los IDs de video de YouTube únicos encontrados en un texto o bloque de URLs (incluyendo v= y rv=).
 */
export function extractAllYoutubeVideoIds(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();

  // Match v=VIDEO_ID, /v/VIDEO_ID, shorts/VIDEO_ID, youtu.be/VIDEO_ID, embed/VIDEO_ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // Match rv=VIDEO_ID (videos relacionados en URLs de mix de YouTube)
  const rvRegex = /[?&]rv=([a-zA-Z0-9_-]{11})/gi;
  while ((match = rvRegex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // Verificar líneas individuales si se pegaron IDs puros
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      found.add(trimmed);
    }
  }

  return Array.from(found);
}

/**
 * Procesa masivamente un texto pegado (URLs, Mixes, Playlists o IDs) y recupera sus metadatos de forma asíncrona.
 */
export async function parseBulkYoutubeInput(rawText, onProgress = () => {}) {
  if (!rawText || !rawText.trim()) return [];

  const trimmed = rawText.trim();
  const playlistId = extractPlaylistId(trimmed);
  const isMixUrl = Boolean(
    (playlistId && playlistId.startsWith('RD')) || 
    trimmed.includes('start_radio=1') || 
    trimmed.includes('&list=RD') ||
    trimmed.includes('?list=RD')
  );

  let videoIds = [];

  // 1. Si es un Mix o Radio de YouTube (list=RD... o start_radio=1)
  if (isMixUrl) {
    onProgress(0, 1, "Extrayendo lista de canciones del Mix / Radio de YouTube...");
    const mixVideoIds = await fetchYoutubeMix(trimmed);
    if (mixVideoIds.length > 0) {
      videoIds = mixVideoIds;
    }
  }

  // 2. Si es una Playlist estándar de YouTube (list=PL...)
  if (videoIds.length === 0 && playlistId && !playlistId.startsWith('RD')) {
    onProgress(0, 1, "Cargando lista de reproducción de YouTube...");
    const playlistItems = await fetchYoutubePlaylist(playlistId);
    if (playlistItems.length > 0) {
      return playlistItems;
    }
  }

  // 3. Extraer todos los IDs de video directamente de la URL o texto (v=..., rv=..., etc.)
  const directIds = extractAllYoutubeVideoIds(trimmed);
  for (const id of directIds) {
    if (!videoIds.includes(id)) {
      videoIds.unshift(id); // Colocar videos principales al inicio
    }
  }

  if (videoIds.length === 0) return [];

  // Limitar a un máximo razonable de 50 canciones por extracción
  const uniqueIds = Array.from(new Set(videoIds)).slice(0, 50);
  const total = uniqueIds.length;
  const items = [];

  for (let i = 0; i < total; i++) {
    onProgress(i + 1, total, `Leyendo información de canción ${i + 1} de ${total}...`);
    const meta = await fetchYoutubeMetadata(uniqueIds[i]);
    if (meta) items.push(meta);
  }

  return items;
}


