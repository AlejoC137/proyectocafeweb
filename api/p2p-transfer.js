import { getOrStartTransfer } from './p2pGateway.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, title = '', artist = '', filePath = '', fileName = '', streamUrl = '' } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing track id' });
  }

  try {
    const transfer = getOrStartTransfer({ id, title, artist, filePath, fileName, streamUrl });
    return res.status(200).json({ transfer });
  } catch (err) {
    console.error('[api/p2p-transfer] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
