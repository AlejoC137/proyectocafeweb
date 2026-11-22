#!/usr/bin/env node
/**
 * FASE 1 + 2 (PROYECTO CAFE): Descarga todas las IMÁGENES de Supabase Storage
 * (buckets `Images_eventos` y solo imágenes de `Radio` — sin tocar los MP3s)
 * directamente a `G:\Mi unidad\MEDIA\proyectocafe-galeria` (cero copias redundantes),
 * genera su `.media-ids.json` portable v2, registra la carpeta en Local Server
 * (`folders.json`), escanea las tablas de BD y genera `migration-manifest.json` + `url-map.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  createSupabaseAdminClient,
  IMAGE_BUCKETS,
  DB_TABLES,
  EXPORT_DIR,
  SNAPSHOTS_DIR,
  MEDIA_DEST_DIR,
  LOCAL_SERVER_DIR,
  URL_MAP_PATH,
  isImagePath,
  getPublicPrefix,
  fetchAllRows,
  extractSupabaseStorageUrls,
  parseStorageUrl,
  makeMediaId,
  ensureDir,
  formatBytes,
  writeManifest
} from './config.mjs';

const CONCURRENCY = 6;
const supabase = createSupabaseAdminClient();

async function listImagesInBucket(bucket, prefix = '') {
  const files = [];
  const limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new Error(`Error listando ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (!item.name || item.name === '.emptyFolderPlaceholder') continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      const isFolder = item.id === null && item.metadata === null;
      if (isFolder) {
        files.push(...(await listImagesInBucket(bucket, fullPath)));
      } else if (isImagePath(fullPath, item.metadata?.mimetype || '')) {
        files.push({
          bucket,
          storagePath: fullPath,
          fileName: item.name,
          sizeFromMeta: item.metadata?.size ?? 0,
          mimeFromMeta: item.metadata?.mimetype ?? ''
        });
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function downloadFile(bucket, storagePath, destAbs, retries = 3) {
  ensureDir(path.dirname(destAbs));
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data: blob, error } = await supabase.storage.from(bucket).download(storagePath);
      if (error) throw new Error(error.message);
      const buf = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(destAbs, buf);
      return buf;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
}

function registerFolderInLocalServer(destDir) {
  const foldersJsonPath = path.join(LOCAL_SERVER_DIR, 'folders.json');
  if (!fs.existsSync(foldersJsonPath)) {
    console.warn(`  [AVISO] No se encontró ${foldersJsonPath}`);
    return;
  }
  const raw = JSON.parse(fs.readFileSync(foldersJsonPath, 'utf-8'));
  const images = Array.isArray(raw.images) ? raw.images : [];
  const norm = path.resolve(destDir).toLowerCase();
  if (!images.some((p) => path.resolve(p).toLowerCase() === norm)) {
    images.push(path.resolve(destDir));
    raw.images = images;
    fs.writeFileSync(foldersJsonPath, JSON.stringify(raw, null, 2), 'utf-8');
    console.log(`  [OK] Carpeta registrada en ${foldersJsonPath}`);
  } else {
    console.log(`  [OK] Carpeta ya estaba registrada en ${foldersJsonPath}`);
  }
}

async function main() {
  console.log('==============================================================');
  console.log('  PROYECTO CAFE: DESCARGA + MATCH PORTABLE CON LOCAL SERVER');
  console.log('==============================================================');
  console.log(`Carpeta destino : ${MEDIA_DEST_DIR}`);
  console.log(`Buckets         : ${IMAGE_BUCKETS.join(', ')} (solo imágenes)`);
  console.log('');

  ensureDir(EXPORT_DIR);
  ensureDir(SNAPSHOTS_DIR);
  ensureDir(MEDIA_DEST_DIR);

  // 1. Listar imágenes en Storage
  console.log('[1/4] Listando imágenes en Supabase Storage...');
  const entryMap = new Map(); // key: `${bucket}/${storagePath}`
  for (const bucket of IMAGE_BUCKETS) {
    const found = await listImagesInBucket(bucket);
    console.log(`      - Bucket "${bucket}": ${found.length} imágenes`);
    for (const f of found) {
      const key = `${bucket}/${f.storagePath}`;
      const prefix = getPublicPrefix(bucket);
      const rawUrl = `${prefix}${f.storagePath}`;
      const encUrl = `${prefix}${f.storagePath.split('/').map(encodeURIComponent).join('/')}`;
      const relPath = `${bucket}/${f.storagePath}`.replace(/\\/g, '/');
      const destAbs = path.join(MEDIA_DEST_DIR, ...relPath.split('/'));
      const mediaId = makeMediaId(destAbs);

      entryMap.set(key, {
        bucket,
        storagePath: f.storagePath,
        fileName: f.fileName,
        relativePath: relPath,
        localServerPath: destAbs,
        localServerId: mediaId,
        oldUrl: rawUrl,
        oldUrlVariants: Array.from(new Set([rawUrl, encUrl])),
        newUrl: `media://img/${mediaId}`,
        mimeType: f.mimeFromMeta,
        sizeBytes: f.sizeFromMeta,
        sha256: null,
        inStorage: true,
        downloaded: false,
        downloadError: null,
        references: [],
        referenceCount: 0
      });
    }
  }
  console.log(`      Total imágenes en Storage: ${entryMap.size}\n`);

  // 2. Escanear tablas de BD y guardar snapshots
  console.log('[2/4] Escaneando tablas de BD y guardando snapshots...');
  const tableStats = [];
  for (const table of DB_TABLES) {
    process.stdout.write(`      - ${table.name}... `);
    const { rows, error } = await fetchAllRows(supabase, table.name);
    if (error) {
      console.log(`[OMITIDA: ${error}]`);
      tableStats.push({ table: table.name, status: 'skipped', reason: error, rows: 0, urlMatches: 0 });
      continue;
    }

    fs.writeFileSync(path.join(SNAPSHOTS_DIR, `${table.name}.json`), JSON.stringify(rows, null, 2), 'utf-8');

    let matches = 0;
    for (const row of rows) {
      const rowId = row[table.primaryKey] ?? row.id ?? row._id ?? null;
      for (const [col, val] of Object.entries(row)) {
        const urls = extractSupabaseStorageUrls(val);
        for (const url of urls) {
          const parsed = parseStorageUrl(url);
          if (!parsed || !isImagePath(parsed.storagePath)) continue;
          matches++;
          const key = `${parsed.bucket}/${parsed.storagePath}`;
          const entry = entryMap.get(key);
          if (entry) {
            if (!entry.oldUrlVariants.includes(url)) entry.oldUrlVariants.push(url);
            entry.referenceCount++;
            entry.references.push({ table: table.name, rowId, column: col, matchedUrl: url });
          }
        }
      }
    }
    console.log(`[OK: ${rows.length} filas, ${matches} enlaces de imágenes]`);
    tableStats.push({ table: table.name, status: 'ok', rows: rows.length, urlMatches: matches });
  }
  console.log('');

  // 3. Descargar directamente a MEDIA_DEST_DIR (sin duplicados)
  const items = Array.from(entryMap.values());
  console.log(`[3/4] Descargando ${items.length} imágenes a ${MEDIA_DEST_DIR}...`);
  let done = 0;
  let downloadedNow = 0;
  let skipped = 0;
  let failed = 0;
  let totalBytes = 0;

  await runPool(items, CONCURRENCY, async (item) => {
    try {
      let buf;
      if (fs.existsSync(item.localServerPath) && fs.statSync(item.localServerPath).size > 0) {
        buf = fs.readFileSync(item.localServerPath);
        skipped++;
      } else {
        buf = await downloadFile(item.bucket, item.storagePath, item.localServerPath);
        downloadedNow++;
      }
      item.sizeBytes = buf.length;
      item.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      item.downloaded = true;
      totalBytes += buf.length;
    } catch (err) {
      item.downloadError = err.message;
      failed++;
      console.warn(`      [ERROR] ${item.bucket}/${item.storagePath}: ${err.message}`);
    } finally {
      done++;
      if (done % 20 === 0 || done === items.length) {
        console.log(`      Progreso: ${done}/${items.length} (${formatBytes(totalBytes)})`);
      }
    }
  });

  // 4. Generar .media-ids.json portable v2 + registrar en Local Server + guardar manifiesto y url-map
  console.log('\n[4/4] Generando .media-ids.json portable, registrando carpeta y guardando manifiesto...');
  const nowIso = new Date().toISOString();
  const filesObj = {};
  const registryObj = {};
  const urlMap = {};

  for (const item of items.filter((i) => i.downloaded).sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
    const relKey = item.relativePath.toLowerCase();
    filesObj[relKey] = item.localServerId;
    registryObj[relKey] = {
      id: item.localServerId,
      type: 'images',
      sizeBytes: item.sizeBytes,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      missing: false
    };
    for (const v of item.oldUrlVariants) {
      urlMap[v] = item.newUrl;
    }
  }

  const mediaIdsPath = path.join(MEDIA_DEST_DIR, '.media-ids.json');
  fs.writeFileSync(mediaIdsPath, JSON.stringify({
    version: 2,
    folderName: path.basename(MEDIA_DEST_DIR),
    lastRootPath: MEDIA_DEST_DIR,
    createdAt: nowIso,
    updatedAt: nowIso,
    totalFiles: Object.keys(filesObj).length,
    files: filesObj,
    registry: registryObj
  }, null, 2), 'utf-8');

  registerFolderInLocalServer(MEDIA_DEST_DIR);

  writeManifest({
    version: 1,
    generatedAt: nowIso,
    updatedAt: nowIso,
    project: 'proyectocafeweb',
    target: {
      provider: 'personal-media-server',
      mediaFolder: MEDIA_DEST_DIR
    },
    summary: {
      totalItems: items.length,
      downloadedCount: items.filter((i) => i.downloaded).length,
      failedCount: failed,
      usedInDbCount: items.filter((i) => i.referenceCount > 0).length,
      totalBytes,
      totalSizeHuman: formatBytes(totalBytes)
    },
    tableStats,
    items
  });

  fs.writeFileSync(URL_MAP_PATH, JSON.stringify(urlMap, null, 2), 'utf-8');

  console.log('\n==============================================================');
  console.log('  COMPLETADO (PROYECTO CAFE)');
  console.log('==============================================================');
  console.log(`Descargadas     : ${items.filter((i) => i.downloaded).length}/${items.length} (${formatBytes(totalBytes)}, ${downloadedNow} nuevas, ${skipped} previas, ${failed} errores)`);
  console.log(`Usadas en BD    : ${items.filter((i) => i.referenceCount > 0).length}`);
  console.log(`Mapa portable   : ${mediaIdsPath}`);
  console.log(`URL Map         : ${URL_MAP_PATH} (${Object.keys(urlMap).length} variantes)`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
