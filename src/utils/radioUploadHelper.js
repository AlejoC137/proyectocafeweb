import supabase from '../config/supabaseClient';

export async function uploadFileWithProgress(bucketName, filePath, file, onProgress = () => {}) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { 
        upsert: true, 
        cacheControl: '3600',
        contentType: file.type || 'audio/mpeg'
      });

    if (!error && data) {
      onProgress(100);
      return { success: true, bucket: bucketName };
    }
  } catch (sdkErr) {
    console.warn(`SDK upload falló en bucket ${bucketName}, intentando XHR:`, sdkErr.message);
  }

  return new Promise((resolve, reject) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmothqjjqvbxshvvlbrq.supabase.co';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (supabaseKey) {
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
      xhr.setRequestHeader('apikey', supabaseKey);
    }
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('cache-control', '3600');
    xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true, bucket: bucketName });
      } else {
        let errMessage = `Error HTTP ${xhr.status}`;
        try {
          const res = JSON.parse(xhr.responseText);
          errMessage = res.message || res.error || errMessage;
        } catch (e) {}
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => reject(new Error("Error de conexión durante la subida."));
    xhr.send(file);
  });
}

let cachedWorkingBucket = null;

export async function uploadAudioFileToSupabase(file, onProgress = () => {}) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  let targetBucket = null;

  // 1. Probar primero el bucket guardado en caché si ya sabemos cuál funciona
  if (cachedWorkingBucket) {
    try {
      const { success, bucket } = await uploadFileWithProgress(cachedWorkingBucket, filePath, file, onProgress);
      if (success) {
        targetBucket = bucket;
      }
    } catch (e) {
      cachedWorkingBucket = null; // Si falló, invalidar caché
    }
  }

  // 2. Si no hay caché o falló, buscar buckets válidos
  if (!targetBucket) {
    let targetBuckets = [];
    try {
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      if (existingBuckets && existingBuckets.length > 0) {
        targetBuckets = existingBuckets.map(b => b.name);
      }
    } catch (e) {}

    if (targetBuckets.length === 0) {
      targetBuckets = ['Radio', 'radio', 'radio_mp3', 'media', 'audio', 'public', 'music'];
    }

    for (const bName of targetBuckets) {
      try {
        const { success, bucket } = await uploadFileWithProgress(bName, filePath, file, onProgress);
        if (success) {
          targetBucket = bucket;
          cachedWorkingBucket = bucket; // Guardar en caché para llamadas futuras
          break;
        }
      } catch (err) {}
    }
  }

  let publicUrl = null;
  if (targetBucket) {
    const { data: publicUrlData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(filePath);
    publicUrl = publicUrlData?.publicUrl;
  }

  if (!publicUrl) {
    publicUrl = URL.createObjectURL(file);
  }

  return publicUrl;
}

/**
 * Sube múltiples archivos de audio en paralelo con un límite de concurrencia.
 */
export async function uploadAudioFilesBatchInParallel(items, concurrency = 3, onProgressUpdate = () => {}) {
  const results = new Array(items.length);
  const progressMap = new Array(items.length).fill(0);

  const updateOverallProgress = () => {
    const sum = progressMap.reduce((a, b) => a + b, 0);
    const overallPct = Math.round(sum / items.length);
    onProgressUpdate(overallPct, progressMap);
  };

  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      const item = items[idx];
      try {
        const publicUrl = await uploadAudioFileToSupabase(item.file, (pct) => {
          progressMap[idx] = pct;
          updateOverallProgress();
        });
        progressMap[idx] = 100;
        updateOverallProgress();
        results[idx] = { ...item, publicUrl };
      } catch (err) {
        console.error(`Error al subir ${item.file?.name}:`, err);
        results[idx] = { ...item, publicUrl: URL.createObjectURL(item.file) };
      }
    }
  }

  const workers = [];
  const activeWorkersCount = Math.min(concurrency, items.length);
  for (let w = 0; w < activeWorkersCount; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

