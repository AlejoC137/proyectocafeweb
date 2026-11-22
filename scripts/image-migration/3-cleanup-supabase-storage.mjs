#!/usr/bin/env node
/**
 * FASE 4 (PROYECTO CAFE): Limpieza segura de Supabase Storage + carpeta local Radio/covers.
 * Por defecto corre en --dry-run (NO borra nada).
 * Solo ejecuta borrado real cuando se pasa --confirm-delete.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  createSupabaseAdminClient,
  MEDIA_DEST_DIR,
  isImagePath,
  formatBytes,
  readManifest
} from './config.mjs';

const args = process.argv.slice(2);
const CONFIRM_DELETE = args.includes('--confirm-delete');
const DELETE_RADIO_MP3 = !args.includes('--skip-radio-mp3');
const DELETE_RADIO_COVERS = !args.includes('--skip-radio-covers');
const DELETE_EVENTOS_IMAGES = !args.includes('--skip-eventos');
const CLEAN_LOCAL_RADIO_COVERS = !args.includes('--skip-local-radio');

const supabase = createSupabaseAdminClient();

async function listAllObjects(bucket, prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 1000;
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
        files.push(...(await listAllObjects(bucket, fullPath)));
      } else {
        files.push({
          path: fullPath,
          size: item.metadata?.size || 0,
          mime: item.metadata?.mimetype || ''
        });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function removeInBatches(bucket, paths, batchSize = 100) {
  let deleted = 0;
  let errors = [];
  for (let i = 0; i < paths.length; i += batchSize) {
    const chunk = paths.slice(i, i + batchSize);
    const { data, error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) {
      errors.push({ batch: i / batchSize + 1, message: error.message });
    } else {
      deleted += Array.isArray(data) ? data.length : chunk.length;
    }
    if ((i + batchSize) % 500 === 0 || i + batchSize >= paths.length) {
      console.log(`      [${bucket}] Progreso borrado: ${Math.min(i + batchSize, paths.length)}/${paths.length} (eliminados: ${deleted}, errores: ${errors.length})`);
    }
  }
  return { deleted, errors };
}

async function main() {
  console.log('==============================================================');
  console.log(CONFIRM_DELETE
    ? '  PROYECTO CAFE: LIMPIEZA DE STORAGE [MODO BORRADO REAL]'
    : '  PROYECTO CAFE: SIMULACION DE LIMPIEZA [MODO DRY-RUN]');
  console.log('==============================================================\n');

  const manifest = readManifest();
  const verifiedEventosSet = new Set(
    (manifest.items || [])
      .filter((i) => i.bucket === 'Images_eventos' && i.downloaded && fs.existsSync(i.localServerPath))
      .map((i) => i.storagePath)
  );

  // 1. Auditar bucket Radio
  const radioAll = await listAllObjects('Radio');
  const radioMp3s = radioAll.filter((f) => path.extname(f.path).toLowerCase() === '.mp3');
  const radioCovers = radioAll.filter((f) => f.path.startsWith('covers/') && isImagePath(f.path, f.mime));
  const radioOthers = radioAll.filter((f) => !radioMp3s.includes(f) && !radioCovers.includes(f));

  // 2. Auditar bucket Images_eventos
  const eventosAll = await listAllObjects('Images_eventos');
  const eventosToDelete = eventosAll.filter((f) => isImagePath(f.path, f.mime) && verifiedEventosSet.has(f.path));
  const eventosUnverified = eventosAll.filter((f) => !eventosToDelete.includes(f));

  const mp3Bytes = radioMp3s.reduce((a, b) => a + b.size, 0);
  const coversBytes = radioCovers.reduce((a, b) => a + b.size, 0);
  const eventosBytes = eventosToDelete.reduce((a, b) => a + b.size, 0);

  console.log('Resumen de objetos detectados en Supabase Storage:');
  console.log(`  - Radio (*.mp3)                : ${radioMp3s.length} archivos (${formatBytes(mp3Bytes)})`);
  console.log(`  - Radio (covers/* imágenes)    : ${radioCovers.length} archivos (${formatBytes(coversBytes)})`);
  console.log(`  - Radio (otros: .json/.txt)    : ${radioOthers.length} archivos (SE CONSERVAN)`);
  console.log(`  - Images_eventos (verificadas) : ${eventosToDelete.length} archivos (${formatBytes(eventosBytes)})`);
  console.log(`  - Images_eventos (no verif.)   : ${eventosUnverified.length} archivos (SE CONSERVAN)`);
  console.log('');

  if (!CONFIRM_DELETE) {
    console.log('[DRY-RUN] Ningún archivo fue eliminado. Para ejecutar el borrado real usa --confirm-delete.');
    return;
  }

  if (DELETE_RADIO_MP3 && radioMp3s.length > 0) {
    console.log(`\n[1/4] Eliminando ${radioMp3s.length} MP3s de bucket "Radio"...`);
    const res = await removeInBatches('Radio', radioMp3s.map((f) => f.path));
    console.log(`      Resultado MP3s: ${res.deleted}/${radioMp3s.length} eliminados, ${res.errors.length} errores.`);
    if (res.errors.length) console.log('      Primer error:', res.errors[0]);
  }

  if (DELETE_RADIO_COVERS && radioCovers.length > 0) {
    console.log(`\n[2/4] Eliminando ${radioCovers.length} imágenes asociadas (covers/*) de bucket "Radio"...`);
    const res = await removeInBatches('Radio', radioCovers.map((f) => f.path));
    console.log(`      Resultado Radio/covers: ${res.deleted}/${radioCovers.length} eliminados, ${res.errors.length} errores.`);
    if (res.errors.length) console.log('      Primer error:', res.errors[0]);
  }

  if (DELETE_EVENTOS_IMAGES && eventosToDelete.length > 0) {
    console.log(`\n[3/4] Eliminando ${eventosToDelete.length} imágenes verificadas de bucket "Images_eventos"...`);
    const res = await removeInBatches('Images_eventos', eventosToDelete.map((f) => f.path));
    console.log(`      Resultado Images_eventos: ${res.deleted}/${eventosToDelete.length} eliminados, ${res.errors.length} errores.`);
    if (res.errors.length) console.log('      Primer error:', res.errors[0]);
  }

  if (CLEAN_LOCAL_RADIO_COVERS) {
    const localRadioDir = path.join(MEDIA_DEST_DIR, 'Radio');
    const mediaIdsPath = path.join(MEDIA_DEST_DIR, '.media-ids.json');
    console.log(`\n[4/4] Limpiando carpeta local de covers MP3 (${localRadioDir}) y actualizando .media-ids.json...`);
    if (fs.existsSync(localRadioDir)) {
      fs.rmSync(localRadioDir, { recursive: true, force: true });
      console.log('      [OK] Carpeta local Radio/ eliminada de proyectocafe-galeria.');
    }
    if (fs.existsSync(mediaIdsPath)) {
      const data = JSON.parse(fs.readFileSync(mediaIdsPath, 'utf8'));
      const nextFiles = {};
      const nextRegistry = {};
      for (const [k, v] of Object.entries(data.files || {})) {
        if (!k.startsWith('radio/')) nextFiles[k] = v;
      }
      for (const [k, v] of Object.entries(data.registry || {})) {
        if (!k.startsWith('radio/')) nextRegistry[k] = v;
      }
      data.files = nextFiles;
      data.registry = nextRegistry;
      data.totalFiles = Object.keys(nextFiles).length;
      data.updatedAt = new Date().toISOString();
      fs.writeFileSync(mediaIdsPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`      [OK] .media-ids.json actualizado (${data.totalFiles} imágenes no-MP3).`);
    }
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
