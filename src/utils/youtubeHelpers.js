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
