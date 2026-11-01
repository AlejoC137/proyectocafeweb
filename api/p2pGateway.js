import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de almacenamiento temporal de streaming y caché P2P
export const P2P_CACHE_DIR = path.resolve('G:\\Mi unidad\\Radio\\p2p_cache');
if (!fs.existsSync(P2P_CACHE_DIR)) {
  try {
    fs.mkdirSync(P2P_CACHE_DIR, { recursive: true });
  } catch (e) {
    console.warn('[P2PGateway] Error creando directorio caché:', e.message);
  }
}

// Estado en memoria de tareas de streaming y descargas progresivas
// key: trackId -> { id, title, artist, status: 'connecting'|'buffering'|'ready'|'failed', progress, bytesReceived, totalBytes, localPath, url }
const activeTransfers = new Map();

/**
 * Normalizador de búsqueda local y de catálogo P2P
 */
export function searchLocalCatalog(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  const catalogPath = 'G:\\Mi unidad\\Radio\\catalog.json';
  if (fs.existsSync(catalogPath)) {
    try {
      const content = fs.readFileSync(catalogPath, 'utf8');
      const data = JSON.parse(content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content);
      if (Array.isArray(data)) {
        for (const album of data) {
          const albumName = album.albumName || album.folderName || '';
          const albumArtist = album.artist || '';
          const albumCover = album.cover || '';
          
          if (Array.isArray(album.tracks)) {
            for (const t of album.tracks) {
              const title = (t.title || '').toLowerCase();
              const artist = (t.artist || albumArtist).toLowerCase();
              const alb = (t.album || albumName).toLowerCase();
              
              if (title.includes(q) || artist.includes(q) || alb.includes(q)) {
                results.push({
                  id: `p2p-local-${Buffer.from(t.filePath || t.fileName || t.title).toString('hex').slice(0, 16)}`,
                  title: t.title,
                  artist: t.artist || albumArtist || 'Desconocido',
                  album: t.album || albumName,
                  duration: t.duration || 180,
                  cover: t.cover || albumCover,
                  source: 'P2P_LOCAL_INDEX',
                  bitrate: '320kbps',
                  peerStatus: 'Disponible (Slot Inmediato)',
                  speed: 'High',
                  filePath: t.filePath || '',
                  fileName: t.fileName || ''
                });
                if (results.length >= 25) break;
              }
            }
          }
          if (results.length >= 25) break;
        }
      }
    } catch (e) {
      console.warn('[P2PGateway] Error leyendo catalog.json:', e.message);
    }
  }

  // Buscar también en archivos ya cacheados en p2p_cache
  if (fs.existsSync(P2P_CACHE_DIR)) {
    try {
      const files = fs.readdirSync(P2P_CACHE_DIR);
      for (const file of files) {
        if (file.toLowerCase().endsWith('.mp3') && file.toLowerCase().includes(q)) {
          const filePath = path.join(P2P_CACHE_DIR, file);
          const stat = fs.statSync(filePath);
          const cleanName = file.replace(/\.mp3$/i, '');
          results.push({
            id: `p2p-cached-${Buffer.from(file).toString('hex').slice(0, 16)}`,
            title: cleanName,
            artist: 'P2P Cache Node',
            album: 'P2P Downloads',
            duration: Math.round(stat.size / 16000), // Aprox
            cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
            source: 'P2P_LOCAL_CACHE',
            bitrate: '256kbps',
            peerStatus: 'En Caché (0ms latency)',
            speed: 'Ultra',
            filePath,
            fileName: file
          });
        }
      }
    } catch (e) {}
  }

  return results;
}

/**
 * Conector a fuentes públicas abiertas de baja latencia (Jamendo / Internet Archive)
 * para garantizar resultados federados según el Hito 2.2 del informe
 */
export async function searchOpenFederatedAudio(query) {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());
  const results = [];

  try {
    const archiveUrl = `https://archive.org/advancedsearch.php?q=${q}+AND+mediatype:audio&fl[]=identifier,title,creator,publicdate&rows=10&output=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(archiveUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      const docs = json?.response?.docs || [];
      for (const doc of docs) {
        const id = doc.identifier;
        if (id) {
          results.push({
            id: `p2p-archive-${id}`,
            title: doc.title || id,
            artist: doc.creator || 'Internet Archive Audio',
            album: 'Open Audio Archive',
            duration: 190,
            cover: `https://archive.org/services/img/${id}`,
            source: 'OPEN_FEDERATED_P2P',
            bitrate: '192kbps VBR',
            peerStatus: 'Peer Público Online',
            speed: 'Direct HTTP',
            archiveId: id,
            streamUrl: `https://archive.org/download/${id}/${id}_vbr.mp3`
          });
        }
      }
    }
  } catch (e) {
    // Timeout o error de red pasivo
  }

  return results;
}

/**
 * Iniciar o resolver streaming progresivo para una pista P2P
 */
export function getOrStartTransfer(track) {
  const { id, title, artist, filePath, fileName, streamUrl } = track;
  if (!id) return null;

  if (activeTransfers.has(id)) {
    return activeTransfers.get(id);
  }

  // Si ya es un archivo local físico existente
  if (filePath && fs.existsSync(filePath)) {
    const transfer = {
      id,
      title: title || 'Pista P2P',
      artist: artist || '',
      status: 'ready',
      progress: 100,
      localPath: filePath,
      streamUrl: `/api/p2p-stream?id=${encodeURIComponent(id)}`
    };
    activeTransfers.set(id, transfer);
    return transfer;
  }

  // Si existe en caché local de descargas
  const cachedFile = path.join(P2P_CACHE_DIR, `${encodeURIComponent(id)}.mp3`);
  if (fs.existsSync(cachedFile)) {
    const transfer = {
      id,
      title: title || 'Pista P2P',
      artist: artist || '',
      status: 'ready',
      progress: 100,
      localPath: cachedFile,
      streamUrl: `/api/p2p-stream?id=${encodeURIComponent(id)}`
    };
    activeTransfers.set(id, transfer);
    return transfer;
  }

  // Descarga progresiva y buffering en tiempo real
  const transfer = {
    id,
    title: title || 'Pista P2P',
    artist: artist || '',
    status: 'connecting',
    progress: 0,
    bytesReceived: 0,
    totalBytes: 0,
    localPath: cachedFile,
    streamUrl: `/api/p2p-stream?id=${encodeURIComponent(id)}`
  };
  activeTransfers.set(id, transfer);

  // Iniciar descarga asíncrona hacia el buffer de disco
  if (streamUrl && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://'))) {
    transfer.status = 'buffering';
    const writeStream = fs.createWriteStream(cachedFile);
    const client = streamUrl.startsWith('https://') ? https : http;

    try {
      const req = client.get(streamUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Seguir redirección
          https.get(res.headers.location, (redRes) => {
            redRes.pipe(writeStream);
            redRes.on('data', (chunk) => {
              transfer.bytesReceived += chunk.length;
              if (transfer.bytesReceived > 128 * 1024 && transfer.status === 'buffering') {
                transfer.status = 'ready'; // Buffer mínimo alcanzado para iniciar reproducción instantánea
              }
            });
            redRes.on('end', () => {
              transfer.status = 'ready';
              transfer.progress = 100;
            });
          }).on('error', () => {
            transfer.status = 'failed';
          });
          return;
        }

        transfer.totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        res.pipe(writeStream);

        res.on('data', (chunk) => {
          transfer.bytesReceived += chunk.length;
          if (transfer.totalBytes > 0) {
            transfer.progress = Math.round((transfer.bytesReceived / transfer.totalBytes) * 100);
          }
          if (transfer.bytesReceived > 128 * 1024 && transfer.status === 'buffering') {
            transfer.status = 'ready';
          }
        });

        res.on('end', () => {
          transfer.status = 'ready';
          transfer.progress = 100;
        });
      });

      req.on('error', (err) => {
        transfer.status = 'failed';
        transfer.error = err.message;
      });
    } catch (e) {
      transfer.status = 'failed';
      transfer.error = e.message;
    }
  } else {
    // Si no tiene URL directa ni archivo físico
    transfer.status = 'failed';
    transfer.error = 'No se encontró un peer disponible para transferir este archivo.';
  }

  return transfer;
}

export function getTransferStatus(id) {
  return activeTransfers.get(id) || null;
}
