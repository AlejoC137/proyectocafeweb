import { getTransferStatus, P2P_CACHE_DIR } from './p2pGateway.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, path: clientPath } = req.query;
  let targetPath = clientPath;

  if (!targetPath && id) {
    const transfer = getTransferStatus(id);
    if (transfer && transfer.localPath && fs.existsSync(transfer.localPath)) {
      targetPath = transfer.localPath;
    } else {
      const possibleCached = path.join(P2P_CACHE_DIR, `${encodeURIComponent(id)}.mp3`);
      if (fs.existsSync(possibleCached)) {
        targetPath = possibleCached;
      }
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'Stream buffer not ready or track not found' });
  }

  try {
    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'audio/mpeg');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(targetPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(targetPath).pipe(res);
    }
  } catch (err) {
    console.error('[api/p2p-stream] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
