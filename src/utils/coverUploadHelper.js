import supabase from '../config/supabaseClient';
import { uploadImageToMediaServer } from '../services/mediaServerService';

export async function uploadCoverImageToSupabase(file, title = 'Portada', artist = 'Varios') {
  if (!file) return null;

  let mediaUri = null;
  let storagePath = '';

  try {
    const uploaded = await uploadImageToMediaServer(file, { folder: 'proyectocafe-galeria' });
    mediaUri = uploaded.mediaUri; // media://img/<id>
    storagePath = uploaded.item?.relativePath || `media://img/${uploaded.id}`;
  } catch (err) {
    console.warn('[coverUploadHelper] Personal Media Server no disponible, usando DataURL local:', err.message);
    mediaUri = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }

  const coverItem = {
    title: title.trim() || file.name.replace(/\.[^/.]+$/, ''),
    artist: artist.trim() || 'Proyecto Café',
    album: title.trim() || 'Álbum',
    url: mediaUri,
    storage_path: storagePath,
  };

  try {
    await supabase.from('music_covers').insert([coverItem]);
  } catch (dbErr) {}

  return mediaUri;
}
