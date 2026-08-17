/**
 * 2-Layer Genre System (Capa 1: Género Principal + Capa 2: Sub-género / Estilo)
 * Ejemplo: "Hip Hop" + "Rap" => "Hip Hop / Rap"
 */

export const TWO_LAYER_GENRES_MAP = {
  'Hip Hop': ['Rap', 'Underground', 'Trap', 'Boom Bap', 'Latino', 'Consciente'],
  'Rock': ['Argentino', 'Suave', 'Pesado', 'Nacional', 'Indie / Alt', 'Clásico', 'Progresivo', 'Psicodélico', 'Sinfónico'],
  'Jazz': ['Fusion', 'Smooth', 'Bossa', 'Bop', 'Acid Jazz', 'Latino'],
  'Lofi': ['Chill', 'Study / Enfoque', 'Sleep', 'Jazzhop', 'Synthwave', 'Ambient'],
  'Pop': ['Latino', '80s / 90s', 'Indie', 'Synthpop', 'Urbano'],
  'Salsa': ['Brava', 'Romántica', 'Clásica', 'Cumbia / Vallenato'],
  'Electrónica': ['House', 'Techno', 'Deep', 'Ambient', 'Trance'],
  'Reggae': ['Dub', 'Dancehall', 'Roots', 'Ska'],
  'Acústico': ['Unplugged', 'Guitarra', 'Piano', 'Folk'],
  'Metal': ['Heavy', 'Thrash', 'Sinfónico', 'Gótico', 'Power']
};

export const PARENT_GENRES = Object.keys(TWO_LAYER_GENRES_MAP);

export function formatTwoLayerGenre(parent, sub) {
  const cleanParent = (parent || 'Rock').trim();
  const cleanSub = (sub || '').trim();
  if (!cleanSub || cleanSub.toLowerCase() === 'general' || cleanSub.toLowerCase() === 'todos') {
    return cleanParent;
  }
  if (cleanParent.toLowerCase() === cleanSub.toLowerCase()) {
    return cleanParent;
  }
  return `${cleanParent} / ${cleanSub}`;
}

export function parseTwoLayerGenre(genreString = '') {
  if (!genreString) return { parent: 'Rock', sub: 'General' };
  const parts = genreString.split(/[\/-]/).map(p => p.trim());
  if (parts.length >= 2) {
    return { parent: parts[0], sub: parts.slice(1).join(' ') };
  }
  const words = genreString.trim().split(/\s+/);
  if (words.length >= 2) {
    const candidateParent = words[0];
    const matchingParent = PARENT_GENRES.find(p => p.toLowerCase() === candidateParent.toLowerCase());
    if (matchingParent) {
      return { parent: matchingParent, sub: words.slice(1).join(' ') };
    }
  }
  return { parent: genreString.trim(), sub: '' };
}
