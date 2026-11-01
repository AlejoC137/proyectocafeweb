import { searchLocalCatalog, searchOpenFederatedAudio, getOrStartTransfer, getTransferStatus, P2P_CACHE_DIR } from './p2pGateway.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q || '';

  try {
    if (!query.trim()) {
      return res.status(200).json({ results: [] });
    }

    const localResults = searchLocalCatalog(query);
    const openResults = await searchOpenFederatedAudio(query);
    const combined = [...localResults, ...openResults];

    return res.status(200).json({
      query,
      count: combined.length,
      results: combined
    });
  } catch (err) {
    console.error('[api/p2p-search] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
