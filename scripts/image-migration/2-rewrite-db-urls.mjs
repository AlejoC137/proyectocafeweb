#!/usr/bin/env node
/**
 * FASE 3 (PROYECTO CAFE): Reemplazo seguro de URLs de imágenes en Supabase BD
 * (por defecto corre en --dry-run sin modificar nada; con --apply hace backup previo
 * y soporta --rollback=<carpeta_backup>).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  createSupabaseAdminClient,
  SUPABASE_URL,
  DB_TABLES,
  EXPORT_DIR,
  fetchAllRows,
  readManifest,
  ensureDir
} from './config.mjs';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const BUCKET_FILTER = (args.find((a) => a.startsWith('--bucket=')) || '').split('=')[1] || null;
const ROLLBACK_ARG = (args.find((a) => a.startsWith('--rollback=')) || '').split('=')[1] || null;
const STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const supabase = createSupabaseAdminClient();

function replaceInValue(value, replacementPairs) {
  if (value == null) return { value, replacements: 0 };
  if (typeof value === 'string') {
    if (!value.includes(STORAGE_PREFIX)) return { value, replacements: 0 };
    let updated = value;
    let count = 0;
    for (const [oldUrl, newUrl] of replacementPairs) {
      if (!updated.includes(oldUrl)) continue;
      const parts = updated.split(oldUrl);
      count += parts.length - 1;
      updated = parts.join(newUrl);
    }
    return { value: updated, replacements: count };
  }
  if (Array.isArray(value)) {
    let total = 0;
    const next = value.map((item) => {
      const r = replaceInValue(item, replacementPairs);
      total += r.replacements;
      return r.value;
    });
    return { value: total > 0 ? next : value, replacements: total };
  }
  if (typeof value === 'object') {
    let total = 0;
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      const r = replaceInValue(v, replacementPairs);
      total += r.replacements;
      next[k] = r.value;
    }
    return { value: total > 0 ? next : value, replacements: total };
  }
  return { value, replacements: 0 };
}

async function runRollback(backupDirInput) {
  const absDir = path.isAbsolute(backupDirInput) ? backupDirInput : path.resolve(process.cwd(), backupDirInput);
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.json') && !f.startsWith('rewrite-log'));
  for (const file of files) {
    const tableName = path.basename(file, '.json');
    const tableDef = DB_TABLES.find((t) => t.name === tableName);
    const pk = tableDef?.primaryKey || 'id';
    const records = JSON.parse(fs.readFileSync(path.join(absDir, file), 'utf-8'));
    let ok = 0;
    for (const rec of records) {
      const { error } = await supabase.from(tableName).update(rec.originalColumns).eq(pk, rec[pk]);
      if (!error) ok++;
    }
    console.log(`Restaurado ${tableName}: ${ok}/${records.length}`);
  }
}

async function main() {
  if (ROLLBACK_ARG) return runRollback(ROLLBACK_ARG);

  console.log('==============================================================');
  console.log(APPLY
    ? '  PROYECTO CAFE: REEMPLAZO EN BD [MODO APPLY - ESCRITURA]'
    : '  PROYECTO CAFE: SIMULACION DE REEMPLAZO [MODO DRY-RUN]');
  console.log('==============================================================');

  const manifest = readManifest();
  const mapEntries = new Map();
  for (const item of manifest.items || []) {
    if (!item.newUrl || !item.downloaded) continue;
    if (BUCKET_FILTER && item.bucket !== BUCKET_FILTER) continue;
    for (const v of item.oldUrlVariants || []) mapEntries.set(v, item.newUrl);
  }
  const replacementPairs = Array.from(mapEntries.entries()).sort((a, b) => b[0].length - a[0].length);
  console.log(`Pares oldUrl -> newUrl cargados: ${replacementPairs.length}\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(EXPORT_DIR, `pre-rewrite-backup-${timestamp}`);
  if (APPLY) ensureDir(backupDir);

  let totalRows = 0;
  let totalReplacements = 0;

  for (const table of DB_TABLES) {
    process.stdout.write(`Analizando ${table.name}... `);
    const { rows, error } = await fetchAllRows(supabase, table.name);
    if (error) {
      console.log(`[OMITIDA: ${error}]`);
      continue;
    }

    const pending = [];
    let tableCount = 0;
    for (const row of rows) {
      const pkVal = row[table.primaryKey];
      if (pkVal == null) continue;
      const changedColumns = {};
      const originalColumns = {};
      let rowCount = 0;

      for (const [col, val] of Object.entries(row)) {
        if (col === table.primaryKey) continue;
        const r = replaceInValue(val, replacementPairs);
        if (r.replacements > 0) {
          changedColumns[col] = r.value;
          originalColumns[col] = val;
          rowCount += r.replacements;
        }
      }
      if (rowCount > 0) {
        pending.push({ [table.primaryKey]: pkVal, changedColumns, originalColumns, replacements: rowCount });
        tableCount += rowCount;
      }
    }

    totalRows += pending.length;
    totalReplacements += tableCount;

    if (!APPLY) {
      console.log(`[${pending.length} filas / ${tableCount} enlaces]`);
      continue;
    }

    if (pending.length === 0) {
      console.log('[0 cambios]');
      continue;
    }

    fs.writeFileSync(path.join(backupDir, `${table.name}.json`), JSON.stringify(pending, null, 2), 'utf-8');
    let ok = 0;
    let errs = 0;
    for (const upd of pending) {
      const { error: uErr } = await supabase.from(table.name).update(upd.changedColumns).eq(table.primaryKey, upd[table.primaryKey]);
      if (uErr) {
        errs++;
        console.warn(`\n  [ERROR] ${table.name} ${table.primaryKey}=${upd[table.primaryKey]}: ${uErr.message}`);
      } else {
        ok++;
      }
    }
    console.log(`[ACTUALIZADAS: ${ok}/${pending.length} filas, ${tableCount} enlaces, errores: ${errs}]`);
  }

  console.log('\n==============================================================');
  console.log(`Filas afectadas  : ${totalRows}`);
  console.log(`Enlaces a migrar : ${totalReplacements}`);
  if (APPLY) console.log(`Backup rollback  : ${backupDir}`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
