import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// 1. Configuración de Multer para manejo de archivos en memoria (útil para subir a Supabase/S3)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Límite de 25MB para modelos .glb livianos
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.glb', '.gltf', '.json'];
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Solo se permiten archivos .glb, .gltf o .json.'));
    }
  }
});

// Helper para obtener cliente Supabase en backend Node.js
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables de entorno de Supabase no configuradas en el servidor Node.js');
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * @route   POST /api/models/upload
 * @desc    Subir un modelo 3D (.glb/.json) y registrar metadata
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { title, description, metadata } = req.body;
    let fileUrl = req.body.file_url; // En caso de que se pase una URL externa directa

    if (!title) {
      return res.status(400).json({ error: 'El título del modelo es obligatorio' });
    }

    // Si viene un archivo subido por Multer
    if (req.file) {
      const fileName = `models/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Subir buffer al Bucket 'models3d-assets' en Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('models3d-assets')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype || 'model/gltf-binary',
          upsert: true
        });

      if (uploadError) {
        console.error('Error al subir archivo a Storage:', uploadError);
        return res.status(500).json({ error: 'Error al subir el archivo al almacenamiento', details: uploadError.message });
      }

      // Obtener URL Pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('models3d-assets')
        .getPublicUrl(fileName);

      fileUrl = publicUrlData.publicUrl;
    }

    if (!fileUrl) {
      return res.status(400).json({ error: 'Debes proporcionar un archivo .glb/.json o una URL válida (file_url).' });
    }

    // Parsear metadata_json
    let metadataJson = {};
    if (metadata) {
      try {
        metadataJson = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch (e) {
        metadataJson = { raw: metadata };
      }
    }

    // Insertar registro en la tabla `models3d`
    const { data: newModel, error: dbError } = await supabase
      .from('models3d')
      .insert([
        {
          title,
          description: description || '',
          file_url: fileUrl,
          metadata_json: metadataJson
        }
      ])
      .select('*')
      .single();

    if (dbError) {
      console.error('Error al guardar en BD:', dbError);
      return res.status(500).json({ error: 'Error al registrar el modelo en la base de datos', details: dbError.message });
    }

    return res.status(201).json({
      message: 'Modelo 3D registrado exitosamente',
      data: newModel
    });

  } catch (error) {
    console.error('Error en POST /api/models/upload:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/models
 * @desc    Listar todos los modelos 3D livianos disponibles
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: models, error } = await supabase
      .from('models3d')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Error al obtener la lista de modelos 3D', details: error.message });
    }

    return res.status(200).json({
      count: models ? models.length : 0,
      data: models || []
    });
  } catch (error) {
    console.error('Error en GET /api/models:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/models/:id
 * @desc    Obtener metadata, URL y personalizaciones asociadas de un modelo 3D
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    // Consultar modelo principal
    const { data: model, error: modelError } = await supabase
      .from('models3d')
      .select('*')
      .eq('id', id)
      .single();

    if (modelError || !model) {
      return res.status(404).json({ error: 'Modelo 3D no encontrado' });
    }

    // Consultar personalizaciones previas asociadas
    const { data: customizations } = await supabase
      .from('user_customizations')
      .select('*')
      .eq('model_id', id)
      .order('updated_at', { ascending: false });

    return res.status(200).json({
      data: {
        ...model,
        customizations: customizations || []
      }
    });
  } catch (error) {
    console.error('Error en GET /api/models/:id:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

/**
 * @route   PUT /api/models/:id/customize
 * @desc    Guardar o actualizar variaciones de colores/texturas para un modelo
 */
router.put('/:id/customize', async (req, res) => {
  try {
    const { id: model_id } = req.params;
    const { user_id, selected_colors, texture_settings } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'El parámetro user_id es requerido para guardar personalizaciones.' });
    }

    const supabase = getSupabaseClient();

    // Verificar existencia del modelo
    const { data: existingModel } = await supabase
      .from('models3d')
      .select('id')
      .eq('id', model_id)
      .single();

    if (!existingModel) {
      return res.status(404).json({ error: 'El modelo 3D especificado no existe.' });
    }

    // Buscar si ya existe personalización del usuario para este modelo
    const { data: existingCustom } = await supabase
      .from('user_customizations')
      .select('id')
      .eq('model_id', model_id)
      .eq('user_id', user_id)
      .maybeSingle();

    let resultData;
    if (existingCustom) {
      // Actualizar registro existente
      const { data: updated, error: updateErr } = await supabase
        .from('user_customizations')
        .update({
          selected_colors: selected_colors || {},
          texture_settings: texture_settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCustom.id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;
      resultData = updated;
    } else {
      // Crear nueva personalización
      const { data: inserted, error: insertErr } = await supabase
        .from('user_customizations')
        .insert([
          {
            model_id,
            user_id,
            selected_colors: selected_colors || {},
            texture_settings: texture_settings || {}
          }
        ])
        .select('*')
        .single();

      if (insertErr) throw insertErr;
      resultData = inserted;
    }

    return res.status(200).json({
      message: 'Personalización guardada con éxito',
      data: resultData
    });

  } catch (error) {
    console.error('Error en PUT /api/models/:id/customize:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

export default router;
