import supabase from '../config/supabaseClient';

/**
 * Servicio de Cliente para interactuar con la Base de Datos y Storage de Modelos 3D
 */
export const models3dService = {
  /**
   * Listar todos los modelos 3D livianos disponibles
   */
  async getModels() {
    const { data, error } = await supabase
      .from('models3d')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Fallback al endpoint API /api/models por error en cliente directo Supabase:', error.message);
      const res = await fetch('/api/models');
      const json = await res.json();
      return json.data || [];
    }

    return data || [];
  },

  /**
   * Obtener un modelo por su ID junto con sus personalizaciones
   */
  async getModelById(id) {
    const { data: model, error: modelError } = await supabase
      .from('models3d')
      .select('*')
      .eq('id', id)
      .single();

    if (modelError) {
      const res = await fetch(`/api/models/${id}`);
      const json = await res.json();
      return json.data;
    }

    const { data: customizations } = await supabase
      .from('user_customizations')
      .select('*')
      .eq('model_id', id)
      .order('updated_at', { ascending: false });

    return {
      ...model,
      customizations: customizations || []
    };
  },

  /**
   * Crear o subir un nuevo modelo 3D (soporta archivo .glb o metadata JSON paramétrica)
   */
  async createModel({ title, description, file, file_url, metadata_json }) {
    let finalFileUrl = file_url;

    // Si viene archivo binario (.glb / .gltf)
    if (file) {
      const fileName = `models/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('models3d-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Error subiendo archivo 3D a Storage: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('models3d-assets')
        .getPublicUrl(fileName);

      finalFileUrl = publicUrlData.publicUrl;
    }

    if (!finalFileUrl) {
      throw new Error('Debe proporcionar un archivo .glb o una URL al modelo 3D');
    }

    const { data, error } = await supabase
      .from('models3d')
      .insert([
        {
          title,
          description: description || '',
          file_url: finalFileUrl,
          metadata_json: metadata_json || {}
        }
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Guardar personalizaciones del usuario (colores, texturas)
   */
  async saveUserCustomization({ model_id, user_id, selected_colors, texture_settings }) {
    const { data: existing } = await supabase
      .from('user_customizations')
      .select('id')
      .eq('model_id', model_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('user_customizations')
        .update({
          selected_colors: selected_colors || {},
          texture_settings: texture_settings || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_customizations')
        .insert([
          {
            model_id,
            user_id: user_id || 'anonymous',
            selected_colors: selected_colors || {},
            texture_settings: texture_settings || {}
          }
        ])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }
  }
};
