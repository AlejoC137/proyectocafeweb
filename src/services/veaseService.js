import supabase from "../config/supabaseClient";

/**
 * Servicio para gestionar relaciones de la sección "Véase" en Supabase.
 */

/**
 * Obtiene todas las relaciones "Véase" para un objeto origen determinado.
 * @param {string} sourceId - ID del objeto origen
 * @param {string} [sourceType] - Opcional. Tipo del objeto origen ('receta', 'item', 'procedimiento', 'produccion')
 * @returns {Promise<Array>} Lista de relaciones
 */
export async function getVeaseRelations(sourceId, sourceType = null) {
  if (!sourceId) return [];
  try {
    let query = supabase
      .from("Vease")
      .select("*")
      .eq("source_id", String(sourceId));

    if (sourceType) {
      query = query.eq("source_type", String(sourceType));
    }

    const { data, error } = await query.order("orden", { ascending: true }).order("created_at", { ascending: false });

    if (error) {
      console.warn("[VeaseService] Warning fetching relations:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[VeaseService] Error reading Vease table:", err);
    return [];
  }
}

/**
 * Agrega una nueva relación "Véase".
 * @param {Object} relationData
 * @param {string} relationData.source_id - ID objeto origen
 * @param {string} relationData.source_type - Tipo origen ('receta', 'item', 'procedimiento', 'produccion')
 * @param {string} relationData.target_id - ID objeto destino
 * @param {string} relationData.target_type - Tipo destino ('receta', 'item', 'procedimiento', 'produccion')
 * @param {string} [relationData.titulo] - Nombre/Alias a mostrar
 * @param {string} [relationData.grupo] - Categoría/Grupo
 * @param {string} [relationData.notas] - Notas adicionales
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function addVeaseRelation(relationData) {
  try {
    const payload = {
      source_id: String(relationData.source_id),
      source_type: String(relationData.source_type),
      target_id: String(relationData.target_id),
      target_type: String(relationData.target_type),
      titulo: relationData.titulo || null,
      grupo: relationData.grupo || "General",
      notas: relationData.notas || null,
      orden: relationData.orden || 0,
    };

    const { data, error } = await supabase
      .from("Vease")
      .insert([payload])
      .select();

    if (error) {
      console.error("[VeaseService] Error adding relation:", error);
      return { data: null, error };
    }
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    console.error("[VeaseService] Exception adding relation:", err);
    return { data: null, error: err };
  }
}

/**
 * Elimina una relación "Véase" por su ID.
 * @param {string} id - ID de la fila en la tabla Vease
 * @returns {Promise<boolean>} Success status
 */
export async function deleteVeaseRelation(id) {
  if (!id) return false;
  try {
    const { error } = await supabase
      .from("Vease")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[VeaseService] Error deleting relation:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[VeaseService] Exception deleting relation:", err);
    return false;
  }
}
