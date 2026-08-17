/**
 * Utility for parsing ID3v2 metadata (Title, Artist, Album, Year, Genre, Picture)
 * directly from audio Files in the browser without external dependencies.
 */

export async function parseMp3Metadata(file) {
  const cleanFileName = file.name.replace(/\.[^/.]+$/, "");

  const defaultMeta = {
    title: cleanFileName,
    artist: 'Artista Desconocido',
    album: 'Sencillo',
    year: new Date().getFullYear().toString(),
    genre: 'Lofi / Chill',
    cover: null,
    duration: 180
  };

  try {
    // 1. Get audio duration via Blob URL
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    await new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          defaultMeta.duration = Math.round(audio.duration);
        }
        resolve();
      });
      audio.addEventListener('error', resolve);
      setTimeout(resolve, 1500);
    });
    URL.revokeObjectURL(objectUrl);

    // 2. Read ID3v2 header and tags from first 128KB of the file
    const bufferSize = Math.min(131072, file.size);
    const slice = file.slice(0, bufferSize);
    const arrayBuffer = await slice.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Check for ID3 magic bytes 'ID3' (0x49, 0x44, 0x33)
    if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
      const version = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
      const tagSize = ((view.getUint8(6) & 0x7F) << 21) |
                      ((view.getUint8(7) & 0x7F) << 14) |
                      ((view.getUint8(8) & 0x7F) << 7)  |
                       (view.getUint8(9) & 0x7F);

      let offset = 10;
      const maxOffset = Math.min(offset + tagSize, arrayBuffer.byteLength - 10);

      const decoderIso = new TextDecoder('iso-8859-1');
      const decoderUtf8 = new TextDecoder('utf-8');
      const decoderUtf16 = new TextDecoder('utf-16');

      const decodeText = (bytes) => {
        if (!bytes || bytes.length === 0) return '';
        const encoding = bytes[0];
        const dataBytes = bytes.subarray(1);
        try {
          if (encoding === 1 || encoding === 2) {
            return decoderUtf16.decode(dataBytes).replace(/\0/g, '').trim();
          } else if (encoding === 3) {
            return decoderUtf8.decode(dataBytes).replace(/\0/g, '').trim();
          } else {
            return decoderIso.decode(dataBytes).replace(/\0/g, '').trim();
          }
        } catch (e) {
          return '';
        }
      };

      while (offset < maxOffset) {
        let frameId = '';
        for (let i = 0; i < 4; i++) {
          const charCode = view.getUint8(offset + i);
          if (charCode >= 32 && charCode <= 126) {
            frameId += String.fromCharCode(charCode);
          }
        }

        if (frameId.length < 4) break;

        let frameSize = 0;
        if (version === 4) {
          frameSize = ((view.getUint8(offset + 4) & 0x7F) << 21) |
                      ((view.getUint8(offset + 5) & 0x7F) << 14) |
                      ((view.getUint8(offset + 6) & 0x7F) << 7)  |
                       (view.getUint8(offset + 7) & 0x7F);
        } else {
          frameSize = view.getUint32(offset + 4, false);
        }

        if (frameSize <= 0 || offset + 10 + frameSize > arrayBuffer.byteLength) break;

        const frameData = new Uint8Array(arrayBuffer, offset + 10, frameSize);

        if (frameId === 'TIT2' || frameId === 'TT2') {
          const title = decodeText(frameData);
          if (title) defaultMeta.title = title;
        } else if (frameId === 'TPE1' || frameId === 'TP1') {
          const artist = decodeText(frameData);
          if (artist) defaultMeta.artist = artist;
        } else if (frameId === 'TALB' || frameId === 'TAL') {
          const album = decodeText(frameData);
          if (album) defaultMeta.album = album;
        } else if (frameId === 'TDRC' || frameId === 'TYER' || frameId === 'TYE') {
          const year = decodeText(frameData);
          if (year) defaultMeta.year = year.substring(0, 4);
        } else if (frameId === 'TCON' || frameId === 'TCO') {
          const genre = decodeText(frameData);
          if (genre) defaultMeta.genre = genre.replace(/\(\d+\)/g, '').trim();
        } else if (frameId === 'APIC' || frameId === 'PIC') {
          try {
            let pos = 1;
            while (pos < frameData.length && frameData[pos] !== 0) pos++;
            pos++;
            pos++; // picture type
            while (pos < frameData.length && frameData[pos] !== 0) pos++;
            pos++;

            const imgData = frameData.subarray(pos);
            if (imgData.length > 0) {
              let mime = 'image/jpeg';
              if (imgData[0] === 0x89 && imgData[1] === 0x50) mime = 'image/png';
              let binary = '';
              const len = imgData.byteLength;
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(imgData[i]);
              }
              const base64 = btoa(binary);
              defaultMeta.cover = `data:${mime};base64,${base64}`;
            }
          } catch (imgErr) {
            console.warn("No se pudo extraer portada embebida del MP3:", imgErr);
          }
        }

        offset += 10 + frameSize;
      }
    }

    // 3. Extracción inteligente desde nombre de archivo si los ID3 no contenían artista/título
    if (defaultMeta.artist === 'Artista Desconocido' || defaultMeta.title === cleanFileName) {
      const parts = cleanFileName.split(/\s*[-_–—]\s*/);
      if (parts.length === 2) {
        // e.g. "Queen - Bohemian Rhapsody"
        defaultMeta.artist = parts[0].trim();
        defaultMeta.title = parts[1].trim();
      } else if (parts.length >= 3) {
        // e.g. "01 - Soda Stereo - De Musica Ligera"
        if (/^\d+$/.test(parts[0].trim())) {
          defaultMeta.artist = parts[1].trim();
          defaultMeta.title = parts.slice(2).join(' - ').trim();
        } else {
          defaultMeta.artist = parts[0].trim();
          defaultMeta.title = parts.slice(1).join(' - ').trim();
        }
      }
    }
  } catch (err) {
    console.warn("Error leyendo metadatos del archivo:", file.name, err);
  }

  return defaultMeta;
}
