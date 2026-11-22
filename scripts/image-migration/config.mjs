import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

let createClient;
try {
  ({ createClient } = await import('@supabase/supabase-js'));
} catch {
  const fallbackPkg = pathToFileURL('G:\\Mi unidad\\git\\markDown\\node_modules\\@supabase\\supabase-js\\dist\\index.mjs').href;
  ({ createClient } = await import(fallbackPkg));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const EXPORT_DIR = path.join(ROOT_DIR, 'migration-export');
export const SNAPSHOTS_DIR = path.join(EXPORT_DIR, 'db-snapshots');
export const MANIFEST_PATH = path.join(EXPORT_DIR, 'migration-manifest.json');
export const URL_MAP_PATH = path.join(EXPORT_DIR, 'url-map.json');

export const MEDIA_DEST_DIR = path.resolve(
  process.env.PROYECTOCAFE_MEDIA_DIR || 'G:\\Mi unidad\\MEDIA\\proyectocafe-galeria'
);
export const LOCAL_SERVER_DIR = path.resolve(
  process.env.LOCAL_SERVER_DIR || 'G:\\Mi unidad\\git\\Local Server'
);

export function loadEnvFiles() {
  for (const fileName of ['.env', '.env.local']) {
    const envPath = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnvFiles();

export const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://gmothqjjqvbxshvvlbrq.supabase.co'
).replace(/\/+$/, '');

export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw';

export const IMAGE_BUCKETS = ['Images_eventos', 'Radio'];

export const IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.jfif', '.png', '.webp', '.gif', '.avif', '.bmp', '.tiff', '.tif', '.svg', '.ico'
]);

export const DB_TABLES = [
  { name: 'Agenda', primaryKey: '_id' },
  { name: 'Menu', primaryKey: '_id' },
  { name: 'menu_print_config', primaryKey: 'id' },
  { name: 'music_covers', primaryKey: 'id' },
  { name: 'playlist_youtube', primaryKey: 'id' },
  { name: 'Proveedores', primaryKey: '_id' },
  { name: 'Procedimientos', primaryKey: '_id' },
  { name: 'Staff', primaryKey: '_id' },
  { name: 'ItemsAlmacen', primaryKey: '_id' },
  { name: 'ProduccionInterna', primaryKey: '_id' },
  { name: 'Recetas', primaryKey: '_id' },
  { name: 'Model', primaryKey: '_id' }
];

export function createSupabaseAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function makeMediaId(absPath) {
  const normalized = path.resolve(absPath).replace(/\\/g, '/').toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export function isImagePath(filePath, mime = '') {
  if (mime && mime.toLowerCase().startsWith('image/')) return true;
  return IMAGE_EXTS.has(path.extname(filePath || '').toLowerCase());
}

export function getPublicPrefix(bucket) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}

export async function fetchAllRows(supabase, tableName, pageSize = 500) {
  const allRows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) return { rows: null, error: error.message };
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return { rows: allRows, error: null };
}

export function extractSupabaseStorageUrls(value) {
  const found = new Set();
  const base = `${SUPABASE_URL}/storage/v1/object/public/`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${base}[^\\s"'<>\\)\\]\\\\]+`, 'g');

  function walk(node) {
    if (node == null) return;
    if (typeof node === 'string') {
      const matches = node.match(regex);
      if (matches) {
        for (const m of matches) found.add(m.replace(/[),.;]+$/, ''));
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node === 'object') {
      for (const v of Object.values(node)) walk(v);
    }
  }
  walk(value);
  return Array.from(found);
}

export function parseStorageUrl(url) {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/`;
  if (!url || !url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).split('?')[0].split('#')[0];
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) return null;
  const bucket = rest.slice(0, slashIdx);
  let storagePath = rest.slice(slashIdx + 1);
  try {
    storagePath = decodeURIComponent(storagePath);
  } catch {}
  return { bucket, storagePath };
}

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`No se encontró ${MANIFEST_PATH}. Ejecuta primero 1-download-and-match-local.mjs`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

export function writeManifest(manifest) {
  ensureDir(EXPORT_DIR);
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}
