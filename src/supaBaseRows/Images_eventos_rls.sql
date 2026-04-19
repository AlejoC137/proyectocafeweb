-- Ejecutar este script en el editor SQL de Supabase para permitir la subida/borrado de imágenes

-- Permite a cualquier persona ver las imágenes (si el bucket no estaba configurado como público)
CREATE POLICY "Public Access to Images_eventos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'Images_eventos');

-- Permite insertar (subir) imágenes nuevas
CREATE POLICY "Allow Uploads to Images_eventos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'Images_eventos');

-- Permite actualizar información de la imagen
CREATE POLICY "Allow Updates to Images_eventos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'Images_eventos');

-- Permite borrar imágenes antiguas o canceladas
CREATE POLICY "Allow Deletions to Images_eventos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'Images_eventos');
