export const MAX_PLAYLIST_SECONDS = 4 * 60 * 60; // 4 horas en segundos (14,400 seg)

// Canales SomaFM Curados Especialmente para Proyecto Café (Sección SomaFM API)
export const SOMAFM_CURATED_STATIONS = [
  {
    id: 'somafm-groovesalad',
    title: 'Groove Salad (SomaFM)',
    artist: 'Downtempo, Ambient & Chillout para Café',
    genre: 'Ambient / Chill',
    url: 'https://stream.somafm.com/groovesalad-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-illstreet',
    title: 'Illinois Street Lounge (SomaFM)',
    artist: 'Lounge Clásico, Exotica & Música de Coctelería',
    genre: 'Lounge',
    url: 'https://stream.somafm.com/illstreet-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-bossa',
    title: 'Bossa Beyond (SomaFM)',
    artist: 'Bossa Nova Moderna & Tradicional',
    genre: 'Bossa Nova',
    url: 'https://stream.somafm.com/bossa-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-lush',
    title: 'Lush (SomaFM)',
    artist: 'Downtempo Vocal & Sensuous Chill',
    genre: 'Downtempo',
    url: 'https://stream.somafm.com/lush-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'somafm-secretagent',
    title: 'Secret Agent (SomaFM)',
    artist: 'Retro Spy & Surf Lounge Beats',
    genre: 'Retro Beats',
    url: 'https://stream.somafm.com/secretagent-128-mp3',
    isLiveStream: true,
    cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=600'
  }
];

export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => resolve(0);
  });
};
