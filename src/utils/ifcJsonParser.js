/**
 * Utilidad de Parseo y Normalización de Formatos 3D BIM (ifcJSON, Navisworks & Standard BIM JSON)
 * Soporta esquemas oficiales ifcJSON 4.0, IFC4x3 y paquetes de Supabase.
 */

// Paleta de colores BIM por Categoría IFC
const IFC_TYPE_COLORS = {
  IfcWall: '#f8fafc',
  IfcWallStandardCase: '#f1f5f9',
  IfcSlab: '#cbd5e1',
  IfcColumn: '#3b82f6',
  IfcBeam: '#2563eb',
  IfcDoor: '#d97706',
  IfcWindow: '#38bdf8',
  IfcRoof: '#ef4444',
  IfcStair: '#475569',
  IfcRailing: '#64748b',
  IfcSpace: '#a855f7',
  IfcBuildingElementProxy: '#10b981',
  IfcFurnishingElement: '#f59e0b',
  IfcPipeSegment: '#06b6d4',
  IfcDuctSegment: '#475569',
  IfcFlowTerminal: '#0284c7',
  IfcCovering: '#94a3b8'
};

const DEFAULT_COLOR = '#94a3b8';

/**
 * Detecta si el objeto JSON recibido cumple con el estándar ifcJSON
 */
export function isIfcJson(data) {
  if (!data) return false;

  let obj = data;
  if (typeof data === 'string') {
    try {
      obj = JSON.parse(data);
    } catch (e) {
      return false;
    }
  }

  // 1. Verificación por cabecera de esquema
  if (obj.schemaIdentifier?.toLowerCase().includes('ifc') || obj.format?.toLowerCase().includes('ifc')) {
    return true;
  }
  if (typeof obj.type === 'string' && obj.type.startsWith('Ifc')) {
    return true;
  }

  // 2. Verificación en arreglos internos
  const list = Array.isArray(obj)
    ? obj
    : (obj.data || obj.nodes || obj.elements || obj.objects || []);

  if (Array.isArray(list) && list.length > 0) {
    return list.some(item => typeof item?.type === 'string' && item.type.startsWith('Ifc'));
  }

  return false;
}

/**
 * Parsea y normaliza cualquier estructura de datos ifcJSON o BIM JSON
 */
export function parseIfcJson(rawData) {
  if (!rawData) return null;

  let data = rawData;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new Error('El formato proporcionado no es un JSON válido: ' + e.message);
    }
  }

  // Si viene envuelto en interactive_3d_scene de Supabase
  if (data.interactive_3d_scene) {
    data = data.interactive_3d_scene;
  }

  // Extraer lista de entidades
  let rawEntities = [];
  if (Array.isArray(data)) {
    rawEntities = data;
  } else if (Array.isArray(data.nodes)) {
    rawEntities = data.nodes;
  } else if (Array.isArray(data.elements)) {
    rawEntities = data.elements;
  } else if (Array.isArray(data.data)) {
    rawEntities = data.data;
  } else if (Array.isArray(data.objects)) {
    rawEntities = data.objects;
  } else {
    rawEntities = [data];
  }

  const projectTitle = data.title || data.project_name || data.name || 'Modelo 3D BIM (ifcJSON)';
  const projectDesc = data.description || 'Modelo interactivo cargado en /review_ProyectoCafe';

  // Si no es un ifcJSON estricto pero tiene nodos BIM estándar
  const isIfc = isIfcJson(data);

  const nodes = rawEntities
    .filter(e => e && typeof e === 'object')
    .map((entity, index) => {
      const type = entity.type || entity.category || (isIfc ? 'IfcBuildingElementProxy' : 'BIM_Element');
      const globalId = entity.element_id || entity.globalId || entity.id || entity.expressId || `node_${index + 1}`;
      const name = entity.name || entity.ObjectType || entity.title || `${type} #${index + 1}`;

      const layerKey = (entity.layer || entity.category || type).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const color = entity.color_hex || entity.color || IFC_TYPE_COLORS[type] || DEFAULT_COLOR;

      const position = entity.position && Array.isArray(entity.position) && entity.position.length === 3
        ? entity.position
        : deriveIfcPosition(index);

      const dimensions = entity.dimensions && Array.isArray(entity.dimensions) && entity.dimensions.length === 3
        ? entity.dimensions
        : deriveIfcDimensions(type);

      const geometryType = entity.geometry_type || entity.type || (type.includes('Column') || type.includes('Pipe') ? 'cylinder' : 'box');

      return {
        id: globalId,
        element_id: globalId,
        name: name,
        category: type,
        layer: layerKey,
        type: geometryType,
        geometry_type: geometryType,
        position: position,
        dimensions: dimensions,
        rotation: entity.rotation || [0, 0, 0],
        color: color,
        color_hex: color,
        price: entity.price || deriveIfcPrice(type),
        detail: entity.detail || entity.description || entity.ObjectType || `Entidad ${type} (${isIfc ? 'ifcJSON' : 'BIM'})`,
        quick_params: {
          Family: entity.quick_params?.Family || type,
          Type: entity.quick_params?.Type || name,
          GlobalId: globalId,
          Tag: entity.Tag || String(index + 1),
          Description: entity.description || entity.detail || '',
          Schema: isIfc ? 'ifcJSON 4.0' : 'Web 3D BIM'
        },
        hasCallout: entity.hasCallout || false,
        calloutLabel: entity.calloutLabel || name,
        calloutSub: entity.calloutSub || type,
        mesh_data: entity.mesh_data || null
      };
    });

  // Generar la lista de capas dinámicas
  const layerMap = {};
  nodes.forEach(n => {
    if (!layerMap[n.layer]) {
      layerMap[n.layer] = {
        id: n.layer,
        name: n.category,
        color_hex: n.color_hex,
        type: n.category
      };
    }
  });

  return {
    project_name: projectTitle,
    description: projectDesc,
    version: isIfc ? 'ifcJSON-4.0' : '2.0-web3d',
    metadata: {
      format_version: isIfc ? 'ifcJSON-4.0' : '2.0-web3d-navisworks',
      total_nodes: nodes.length,
      is_ifc_json: isIfc,
      created_at: new Date().toISOString()
    },
    nodes: nodes,
    elements: nodes,
    layers: Object.values(layerMap)
  };
}

function deriveIfcPosition(index) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  return [(col - 1.5) * 2.2, 0.5, (row - 1.5) * 2.2];
}

function deriveIfcDimensions(type) {
  if (type.includes('Wall')) return [3.0, 2.5, 0.2];
  if (type.includes('Slab') || type.includes('Roof')) return [6.0, 0.2, 5.0];
  if (type.includes('Column')) return [0.4, 3.0, 0.4];
  if (type.includes('Beam')) return [3.0, 0.4, 0.3];
  if (type.includes('Door')) return [0.9, 2.1, 0.1];
  if (type.includes('Window')) return [1.2, 1.2, 0.1];
  return [1.2, 1.0, 1.2];
}

function deriveIfcPrice(type) {
  if (type.includes('Wall')) return '$2.500.000';
  if (type.includes('Slab')) return '$4.000.000';
  if (type.includes('Column')) return '$1.200.000';
  if (type.includes('Door')) return '$450.000';
  if (type.includes('Window')) return '$600.000';
  return '$750.000';
}
