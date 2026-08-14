/**
 * Extractor Inteligente de Metadatos de Archivos de Audio y Estructuras de Carpetas.
 * Extrae: Título, Artista, Álbum, Género, Año, Mood, Duración y Carátula (ID3 APIC).
 */

export const parseAudioFileMetadata = (file) => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const relativePath = file.webkitRelativePath || file.name;
    
    // Parser fallback basado en el nombre del archivo y la estructura de carpetas
    const fallbackInfo = parseFilenameAndPath(relativePath, file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const view = new DataView(buffer);

      let title = fallbackInfo.title;
      let artist = fallbackInfo.artist;
      let album = fallbackInfo.album;
      let genre = fallbackInfo.genre;
      let year = fallbackInfo.year;
      let mood = fallbackInfo.mood;
      let coverUrl = null;

      try {
        // Verificar si contiene cabecera ID3v2 ('ID3')
        if (buffer.byteLength > 10 && view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
          const id3Size = (view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9);
          let offset = 10;

          while (offset < id3Size + 10 && offset + 10 < buffer.byteLength) {
            const frameId = String.fromCharCode(
              view.getUint8(offset),
              view.getUint8(offset + 1),
              view.getUint8(offset + 2),
              view.getUint8(offset + 3)
            );

            const frameSize = (view.getUint8(offset + 4) << 24) |
                              (view.getUint8(offset + 5) << 16) |
                              (view.getUint8(offset + 6) << 8) |
                              view.getUint8(offset + 7);

            if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) break;

            const frameDataOffset = offset + 10;

            // Extraer texto helper
            const readTextFrame = () => {
              try {
                const bytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
                const encodingByte = new Uint8Array(buffer, frameDataOffset, 1)[0];
                let encoding = 'utf-8';
                if (encodingByte === 1) encoding = 'utf-16';
                const str = new TextDecoder(encoding).decode(bytes).replace(/\0/g, '').trim();
                return str;
              } catch {
                return '';
              }
            };

            // TIT2 -> Title
            if (frameId === 'TIT2') {
              const val = readTextFrame();
              if (val) title = val;
            }

            // TPE1 -> Artist
            if (frameId === 'TPE1') {
              const val = readTextFrame();
              if (val) artist = val;
            }

            // TALB -> Album
            if (frameId === 'TALB') {
              const val = readTextFrame();
              if (val) album = val;
            }

            // TCON -> Genre
            if (frameId === 'TCON') {
              const val = readTextFrame();
              if (val) genre = cleanGenreString(val);
            }

            // TDRC / TYER -> Year
            if (frameId === 'TDRC' || frameId === 'TYER') {
              const val = readTextFrame();
              const match = val.match(/\b(19\d\d|20\d\d)\b/);
              if (match) year = match[1];
            }

            // TMOO o TXXX -> Mood
            if (frameId === 'TMOO') {
              const val = readTextFrame();
              if (val) mood = val;
            }

            // APIC -> Cover Image
            if (frameId === 'APIC') {
              try {
                const bytes = new Uint8Array(buffer, frameDataOffset, frameSize);
                let imgOffset = 1;
                while (imgOffset < bytes.length && bytes[imgOffset] !== 0) imgOffset++;
                imgOffset += 2; // saltar null byte y picture type

                let imageStart = imgOffset;
                for (let i = imgOffset; i < bytes.length - 1; i++) {
                  if ((bytes[i] === 0xFF && bytes[i + 1] === 0xD8) || (bytes[i] === 0x89 && bytes[i + 1] === 0x50)) {
                    imageStart = i;
                    break;
                  }
                }

                const imgBuffer = bytes.subarray(imageStart);
                const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
                coverUrl = URL.createObjectURL(blob);
              } catch (err) {
                console.log("No se pudo extraer carátula ID3:", err);
              }
            }

            offset += 10 + frameSize;
          }
        }
      } catch (err) {
        console.warn("Error leyendo metadatos ID3:", err);
      }

      // Obtener duración mediante elemento Audio
      const audio = new Audio();
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        resolve({
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          artist: artist || 'Artista Desconocido',
          album: album || 'Sencillo',
          genre: genre || 'General',
          year: year || new Date().getFullYear().toString(),
          mood: mood || detectMoodFromTitle(title, genre),
          cover: coverUrl,
          duration: Math.round(audio.duration || 0),
          objectUrl,
          relativePath
        });
      };
      audio.onerror = () => {
        resolve({
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          artist: artist || 'Artista Desconocido',
          album: album || 'Sencillo',
          genre: genre || 'General',
          year: year || new Date().getFullYear().toString(),
          mood: mood || 'Relax',
          cover: coverUrl,
          duration: 180,
          objectUrl,
          relativePath
        });
      };
    };

    reader.onerror = () => resolve({
      title: fallbackInfo.title,
      artist: fallbackInfo.artist,
      album: fallbackInfo.album,
      genre: fallbackInfo.genre,
      year: fallbackInfo.year,
      mood: fallbackInfo.mood,
      cover: null,
      duration: 180,
      objectUrl,
      relativePath
    });

    // Leer los primeros 1MB para captura acelerada de ID3
    reader.readAsArrayBuffer(file.slice(0, 1024 * 1024));
  });
};

/**
 * Parsea el nombre de archivo y la ruta relativa para deducir Artista, Álbum, Título, Género.
 */
function parseFilenameAndPath(relativePath, fileName) {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const parts = relativePath.split('/').filter(Boolean);
  
  let genre = 'General';
  let artist = 'Artista Desconocido';
  let album = 'Sencillo';
  let title = nameWithoutExt;
  let year = new Date().getFullYear().toString();
  let mood = 'Relax';

  if (parts.length >= 4) {
    genre = cleanGenreString(parts[0]);
    artist = parts[1];
    album = parts[2];
  } else if (parts.length === 3) {
    artist = parts[0];
    album = parts[1];
  } else if (parts.length === 2) {
    artist = parts[0];
  }

  if (nameWithoutExt.includes(' - ')) {
    const fileParts = nameWithoutExt.split(' - ').map(s => s.trim());
    if (fileParts.length === 2) {
      artist = fileParts[0];
      title = fileParts[1].replace(/^\d+[\s.-]*/, '');
    } else if (fileParts.length >= 3) {
      artist = fileParts[0];
      album = fileParts[1];
      title = fileParts[2].replace(/^\d+[\s.-]*/, '');
    }
  } else {
    title = nameWithoutExt.replace(/^\d+[\s.-]+/, '');
  }

  const yearMatch = relativePath.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    year = yearMatch[1];
  }

  mood = detectMoodFromTitle(title, genre);

  return { title, artist, album, genre, year, mood };
}

function cleanGenreString(str) {
  if (!str) return 'General';
  const cleaned = str.replace(/^\(\d+\)/, '').trim();
  return cleaned || 'General';
}

function detectMoodFromTitle(title, genre) {
  const text = `${title} ${genre}`.toLowerCase();
  if (text.includes('chill') || text.includes('relax') || text.includes('lofi') || text.includes('ambient') || text.includes('sleep')) {
    return 'Chill & Relax';
  }
  if (text.includes('study') || text.includes('focus') || text.includes('cafe') || text.includes('jazz') || text.includes('coffee')) {
    return 'Estudio & Café';
  }
  if (text.includes('night') || text.includes('dark') || text.includes('luna') || text.includes('noche')) {
    return 'Noche & Calma';
  }
  if (text.includes('party') || text.includes('dance') || text.includes('rock') || text.includes('energy') || text.includes('upbeat')) {
    return 'Energético & Fiesta';
  }
  if (text.includes('love') || text.includes('amor') || text.includes('romantic') || text.includes('acoustic')) {
    return 'Romántico & Acústico';
  }
  return 'Ambiente General';
}
