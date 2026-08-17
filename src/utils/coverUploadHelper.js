import supabase from '../config/supabaseClient';

export async function uploadCoverImageToSupabase(file, title = 'Portada', artist = 'Varios') {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `covers/${fileName}`;

  let targetBuckets = [];
  try {
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    if (existingBuckets && existingBuckets.length > 0) {
      targetBuckets = existingBuckets.map(b => b.name);
    }
  } catch (e) {}

  if (targetBuckets.length === 0) {
    targetBuckets = ['Radio', 'radio', 'musicCovers', 'public'];
  }

  let targetBucket = null;
  let publicUrl = null;

  for (const bName of targetBuckets) {
    try {
      const { error: upErr } = await supabase.storage
        .from(bName)
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (!upErr) {
        const { data: pubData } = supabase.storage.from(bName).getPublicUrl(filePath);
        publicUrl = pubData?.publicUrl;
        targetBucket = bName;
        break;
      }
    } catch (e) {}
  }

  if (!publicUrl) {
    publicUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }

  const coverItem = {
    title: title.trim() || file.name.replace(/\.[^/.]+$/, ""),
    artist: artist.trim() || 'Proyecto Café',
    album: title.trim() || 'Álbum',
    url: publicUrl,
    storage_path: filePath
  };

  try {
    await supabase.from('music_covers').insert([coverItem]);
  } catch (dbErr) {}

  return publicUrl;
}
