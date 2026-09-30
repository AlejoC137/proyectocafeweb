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
 * Retorna la URL del thumbnail de YouTube con la máxima compatibilidad (hqdefault / 0.jpg).
 */
export function getYoutubeThumbnail(videoId) {
  if (!videoId) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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

export const formatTime = formatDuration;

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
    cover: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
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
    cover: 'https://img.youtube.com/vi/21qNxnCS8MA/hqdefault.jpg',
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
    cover: 'https://img.youtube.com/vi/fEvM-OUbaKs/hqdefault.jpg',
    category: 'Ambient & Relax',
    order_index: 2,
    is_favorite: true,
    isLiveStream: true,
    type: 'youtube'
  }
];

/**
 * Extrae el ID de una lista de reproducción (Playlist) de YouTube.
 */
export function extractPlaylistId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Obtiene el título y autor/canal de un video de YouTube automáticamente mediante oEmbed o Invidious API.
 */
export async function fetchYoutubeMetadata(urlOrId) {
  const videoId = extractYoutubeId(urlOrId);
  if (!videoId) return null;

  const listId = extractPlaylistId(urlOrId);
  const targetUrl = typeof urlOrId === 'string' && urlOrId.startsWith('http')
    ? urlOrId
    : (listId ? `https://www.youtube.com/watch?v=${videoId}&list=${listId}` : `https://www.youtube.com/watch?v=${videoId}`);
  const thumbnail = getYoutubeThumbnail(videoId);

  // 1. Intentar oEmbed oficial de YouTube
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          listId,
          url: targetUrl,
          title: data.title,
          artist: data.author_name || 'Canal de YouTube',
          cover: thumbnail
        };
      }
    }
  } catch (e) {}

  // 2. Intentar API Invidious / Piped
  const invidiousEndpoints = [
    `https://yewtu.be/api/v1/videos/${videoId}`,
    `https://invidious.drgns.space/api/v1/videos/${videoId}`,
    `https://pipedapi.kavin.rocks/streams/${videoId}`
  ];

  for (const endpoint of invidiousEndpoints) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.title || data.uploader)) {
          return {
            videoId,
            listId,
            url: targetUrl,
            title: data.title || `Video de YouTube (${videoId})`,
            artist: data.author || data.uploader || 'Canal de YouTube',
            cover: thumbnail
          };
        }
      }
    } catch (e) {}
  }

  // 3. Fallback 3: Noembed
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          listId,
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
    listId,
    url: targetUrl,
    title: `Video YouTube - ${videoId}`,
    artist: 'Canal de YouTube',
    cover: thumbnail
  };
}

/**
 * Extrae los videos de una playlist pública de YouTube utilizando APIs públicas, Feed RSS XML y proxies CORS.
 */
export async function fetchYoutubePlaylist(playlistId) {
  if (!playlistId) return [];

  // Si es un mix dinámico (comienza con RD), delegar a fetchYoutubeMix
  if (playlistId.startsWith('RD') || playlistId.startsWith('UL')) {
    const mixTracks = await fetchYoutubeMix(playlistId);
    if (mixTracks && mixTracks.length > 0) return mixTracks;
  }

  // 1. Intentar APIs REST directas de Piped / Invidious
  const apiEndpoints = [
    `https://pipedapi.kavin.rocks/playlists/${playlistId}`,
    `https://yewtu.be/api/v1/playlists/${playlistId}`,
    `https://invidious.jing.rocks/api/v1/playlists/${playlistId}`
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const rawVideos = data.relatedStreams || data.videos || data.items || [];
        if (rawVideos.length > 0) {
          return rawVideos.map(v => {
            const vId = v.videoId || (v.url ? extractYoutubeId(v.url) : null);
            if (!vId) return null;
            return {
              videoId: vId,
              url: `https://www.youtube.com/watch?v=${vId}`,
              title: v.title || `Video ${vId}`,
              artist: v.uploaderName || v.author || v.uploader || 'YouTube',
              cover: v.thumbnail || getYoutubeThumbnail(vId)
            };
          }).filter(Boolean);
        }
      }
    } catch (e) {}
  }

  // 2. Intentar Feed RSS XML vía Proxies CORS
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

  // 3. Fallback: Parsear la página HTML completa de la playlist vía Mix scraper
  try {
    const htmlItems = await fetchYoutubeMix(playlistId);
    if (htmlItems && htmlItems.length > 0) return htmlItems;
  } catch (e) {}

  return [];
}

/**
 * Parsea el HTML de una página de YouTube Mix / Watch y extrae todos los títulos, artistas e IDs de la cola del Mix.
 */
export function parseYoutubeMixHTML(htmlText) {
  if (!htmlText || typeof htmlText !== 'string') return [];

  const items = [];
  const seenIds = new Set();

  // 1. Extraer bloques playlistPanelVideoRenderer
  const panelRegex = /"playlistPanelVideoRenderer"\s*:\s*(\{[\s\S]*?\})\s*,\s*"(?:playlistPanelVideoRenderer|navigationEndpoint|currentIndex)/g;
  let match;

  while ((match = panelRegex.exec(htmlText)) !== null) {
    try {
      const blockStr = match[1];
      const videoIdMatch = blockStr.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
      if (!videoIdMatch) continue;
      const videoId = videoIdMatch[1];
      if (seenIds.has(videoId)) continue;

      let title = '';
      const titleMatch = blockStr.match(/"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
      if (titleMatch) title = titleMatch[1];

      let artist = '';
      const artistMatch = blockStr.match(/"shortBylineText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
      if (artistMatch) artist = artistMatch[1];

      seenIds.add(videoId);
      items.push({
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: title || `Canción ${items.length + 1}`,
        artist: artist || 'Canal de YouTube',
        cover: getYoutubeThumbnail(videoId)
      });
    } catch (e) {}
  }

  // 2. Si no hubo coincidencias con el bloque estricto, buscar todos los videoId únicos
  if (items.length === 0) {
    const rawIds = extractAllYoutubeVideoIds(htmlText);
    for (const vId of rawIds) {
      if (!seenIds.has(vId)) {
        seenIds.add(vId);
        items.push({
          videoId: vId,
          url: `https://www.youtube.com/watch?v=${vId}`,
          title: `Video YouTube ${vId}`,
          artist: 'Canal de YouTube',
          cover: getYoutubeThumbnail(vId)
        });
      }
    }
  }

  return items;
}

/**
 * Extrae los videos de un Mix / Radio de YouTube (list=RD... o start_radio=1) analizando la página del mix vía proxy.
 */
export async function fetchYoutubeMix(urlOrPlaylistId) {
  let targetUrl = urlOrPlaylistId;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.youtube.com/watch?v=568ubOysBFQ&list=${urlOrPlaylistId}`;
  }

  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const parsedItems = parseYoutubeMixHTML(html);
        if (parsedItems.length > 0) {
          return parsedItems;
        }
      }
    } catch (err) {
      console.warn("Error obteniendo mix de YouTube via proxy:", err);
    }
  }
  return [];
}

/**
 * Extrae todos los IDs de video de YouTube únicos encontrados en un texto, HTML o bloque de URLs (incluyendo JSON `videoId`).
 */
export function extractAllYoutubeVideoIds(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();
  let match;

  // 1. Patrones estándar de URL de YouTube
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // 2. Extraer "videoId":"11_caracteres" dentro del HTML/JSON de listas y mixes de YouTube
  const jsonVideoIdRegex = /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/gi;
  while ((match = jsonVideoIdRegex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // 3. Extraer videoId escapado ("videoId\x22:\x2211_caracteres\x22")
  const jsonEscapedRegex = /videoId\\":\s*\\"([a-zA-Z0-9_-]{11})\\"/gi;
  while ((match = jsonEscapedRegex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // 4. Parámetros rv= o v= en URLs de videos relacionados de Mixes
  const rvRegex = /[?&](?:rv|v)=([a-zA-Z0-9_-]{11})/gi;
  while ((match = rvRegex.exec(text)) !== null) {
    if (match[1]) found.add(match[1]);
  }

  // 5. Verificar líneas individuales si son IDs directos de 11 caracteres
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
 * Helper para realizar peticiones HTTP a APIs externas a través de proxies CORS autorizados.
 * Evita errores "blocked by CORS policy" en el navegador.
 */
export async function fetchWithCORSProxy(targetUrl) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res && res.ok) {
        return res;
      }
    } catch (e) {}
  }
  return null;
}



/**
 * Parsea el JSON retornado por YouTube InnerTube API y extrae todas las canciones del Mix.
 */
export function extractTracksFromYoutubeiResponse(data) {
  if (!data) return [];

  const items = [];
  const seenIds = new Set();

  try {
    const playlistContents = 
      data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents ||
      data?.playlist?.playlist?.contents ||
      [];

    for (const item of playlistContents) {
      const renderer = item.playlistPanelVideoRenderer || item.playlistVideoRenderer;
      if (!renderer || !renderer.videoId) continue;

      const vId = renderer.videoId;
      if (seenIds.has(vId)) continue;

      const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || `Canción ${items.length + 1}`;
      const artist = renderer.shortBylineText?.runs?.[0]?.text || renderer.longBylineText?.runs?.[0]?.text || 'Canal de YouTube';
      const thumbnail = renderer.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || getYoutubeThumbnail(vId);

      seenIds.add(vId);
      items.push({
        videoId: vId,
        url: `https://www.youtube.com/watch?v=${vId}`,
        title,
        artist,
        cover: thumbnail
      });
    }
  } catch (e) {
    console.warn("Error parseando InnerTube API:", e);
  }

  return items;
}

/**
 * Parsea bloques de texto copiado directamente desde la interfaz de YouTube (títulos, canales y duraciones)
 */
export function parseCopiedYoutubeText(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];

  let currentTitle = '';
  let currentArtist = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === 'Mi mix' || line.includes('Los mixes son listas de reproducción') || line === 'YouTube' || line === 'Principal') continue;

    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(line)) {
      if (currentTitle) {
        items.push({
          videoId: '',
          url: '',
          title: currentTitle,
          artist: currentArtist || 'YouTube',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'
        });
        currentTitle = '';
        currentArtist = '';
      }
    } else {
      if (!currentTitle) {
        currentTitle = line;
      } else if (!currentArtist) {
        currentArtist = line;
      }
    }
  }

  return items;
}

/**
 * Parsea listas de canciones en formato texto plano o CSV (ej: export de Spotify "Track Name,Artist Name,Album Name" o "Artista - Título")
 */
export function parseSpotifyOrTextSongs(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignorar encabezados comunes de CSV de Spotify o Export tools
    if (i === 0 && (line.toLowerCase().includes('track name') || line.toLowerCase().includes('artist name') || line.toLowerCase().includes('spotify:track'))) {
      continue;
    }

    // Caso 1: CSV delimitado por comas o tabulaciones
    if (line.includes(',') || line.includes('\t')) {
      // Manejar posibles comillas en CSV
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 2) {
        const title = parts[0];
        const artist = parts[1];
        if (title && title.length > 1) {
          items.push({
            videoId: '',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`,
            title: title,
            artist: artist || 'Spotify Export',
            cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
            searchQuery: `${artist} ${title}`
          });
          continue;
        }
      }
    }

    // Caso 2: Formato "Artista - Canción" o "Canción - Artista"
    if (line.includes(' - ')) {
      const parts = line.split(' - ').map(p => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        items.push({
          videoId: '',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${parts[0]} ${parts[1]}`)}`,
          title: parts[1],
          artist: parts[0],
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
          searchQuery: `${parts[0]} ${parts[1]}`
        });
        continue;
      }
    }

    // Caso 3: Línea con solo título de canción (al menos 3 caracteres y no es URL)
    if (line.length > 2 && !line.startsWith('http') && !line.includes('/')) {
      items.push({
        videoId: '',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(line)}`,
        title: line,
        artist: 'Desconocido',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
        searchQuery: line
      });
    }
  }

  return items;
}

/**
 * Procesa masivamente un texto pegado (Playlists de YouTube, Mixes, URLs, JSON, Spotify CSV o texto) sin bloqueos CORS.
 */
export async function parseBulkYoutubeInput(rawText, onProgress = () => {}) {
  if (!rawText || !rawText.trim()) return [];

  const trimmed = rawText.trim();

  // 1. Detectar si el texto contiene una URL de PLAYLIST o MIX de YouTube (list=...)
  const playlistId = extractPlaylistId(trimmed);
  if (playlistId) {
    onProgress(1, 1, `Consultando playlist de YouTube (${playlistId})...`);
    try {
      const playlistTracks = await fetchYoutubePlaylist(playlistId);
      if (playlistTracks && playlistTracks.length > 0) {
        return playlistTracks;
      }
    } catch (err) {
      console.warn("Fallo al leer playlist:", err);
    }
  }

  // 2. Si el texto pegado es una estructura JSON válida (arreglo u objeto de canciones)
  try {
    const jsonParsed = JSON.parse(trimmed);
    const jsonArray = Array.isArray(jsonParsed) ? jsonParsed : (jsonParsed.playlist || jsonParsed.tracks || jsonParsed.items || [jsonParsed]);
    
    if (jsonArray.length > 0) {
      const itemsFromJSON = jsonArray.map(item => {
        const vId = item.id || item.videoId || extractYoutubeId(item.url || item.youtube_url);
        return {
          videoId: vId || '',
          url: item.url || (vId ? `https://www.youtube.com/watch?v=${vId}` : ''),
          title: item.title || `Video ${vId || ''}`,
          artist: item.artist || item.author || 'Canal de YouTube',
          cover: getYoutubeThumbnail(vId)
        };
      }).filter(i => i.title);

      if (itemsFromJSON.length > 0) {
        return itemsFromJSON;
      }
    }
  } catch (e) {}

  // 3. Si se pegó un bloque de texto copiado directamente desde la lista de YouTube (títulos + artistas + duraciones)
  const copiedItems = parseCopiedYoutubeText(trimmed);
  if (copiedItems.length > 0) {
    return copiedItems;
  }

  // 4. Extraer todos los enlaces/IDs de videos de YouTube del texto o lista pegada
  const videoIds = extractAllYoutubeVideoIds(trimmed);
  if (videoIds.length > 0) {
    const uniqueIds = Array.from(new Set(videoIds)).slice(0, 100);
    const total = uniqueIds.length;
    const items = [];

    for (let i = 0; i < total; i++) {
      onProgress(i + 1, total, `Leyendo información de video ${i + 1} de ${total}...`);
      const meta = await fetchYoutubeMetadata(uniqueIds[i]);
      if (meta) items.push(meta);
    }

    if (items.length > 0) return items;
  }

  // 5. Si no hubo IDs de YouTube, intentar parsear como lista de canciones / Spotify CSV
  const textOrCsvItems = parseSpotifyOrTextSongs(trimmed);
  if (textOrCsvItems.length > 0) {
    return textOrCsvItems;
  }

  return [];
}


