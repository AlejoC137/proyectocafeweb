/**
 * Servicio para Ingerir, Validar y Parsear archivos en estándar ifcJSON-4
 */
export const ifcJsonService = {
  /**
   * Parsea un string o JsonObject e indexa las entidades por globalId y tipo.
   */
  parseIfcJson(rawInput) {
    let payload = rawInput;
    if (typeof rawInput === 'string') {
      try {
        payload = JSON.parse(rawInput);
      } catch (err) {
        throw new Error('El archivo proporcionado no contiene un JSON válido: ' + err.message);
      }
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Formato de datos no válido para ifcJSON');
    }

    const isIfcJsonHeader = payload.type === 'ifcJSON' || Array.isArray(payload.data);
    const dataList = isIfcJsonHeader ? payload.data : (Array.isArray(payload) ? payload : [payload]);

    const byId = {};
    const byType = {};

    (dataList || []).forEach(item => {
      if (!item || !item.type) return;
      const id = item.globalId || Math.random().toString(36).substring(2);
      byId[id] = item;

      if (!byType[item.type]) {
        byType[item.type] = [];
      }
      byType[item.type].push(item);
    });

    return {
      header: {
        type: payload.type || 'ifcJSON',
        version: payload.version || '4.0.0',
        originatingSystem: payload.originatingSystem || 'Desconocido',
        timeStamp: payload.timeStamp || new Date().toISOString()
      },
      dataList,
      byId,
      byType
    };
  },

  /**
   * Extrae la información general del proyecto (IfcProject, IfcBuilding, IfcSite)
   */
  extractProjectMetadata(parsed) {
    const project = (parsed.byType['IfcProject'] || [])[0] || {};
    const building = (parsed.byType['IfcBuilding'] || [])[0] || {};
    const site = (parsed.byType['IfcSite'] || [])[0] || {};

    return {
      projectName: project.name || building.name || 'Proyecto BIM',
      projectDescription: project.description || '',
      buildingName: building.name || 'Edificio Principal',
      siteName: site.name || 'Ubicación Georreferenciada',
      latitude: site.refLatitude ? site.refLatitude[0] : null,
      longitude: site.refLongitude ? site.refLongitude[0] : null,
      elevation: site.elevation || 0
    };
  },

  /**
   * Genera el resumen por categorías (conteo de elementos BIM)
   */
  extractCategorySummary(parsed) {
    const summary = {};
    Object.keys(parsed.byType).forEach(type => {
      // Ignorar metadatos base
      if (['IfcProject', 'IfcBuilding', 'IfcSite'].includes(type)) return;
      summary[type] = parsed.byType[type].length;
    });
    return summary;
  },

  /**
   * Extrae la jerarquía de Niveles (IfcBuildingStorey) y los elementos pertenecientes a cada nivel
   */
  extractLevelsAndSpaces(parsed) {
    const storeys = parsed.byType['IfcBuildingStorey'] || [];
    const spaces = parsed.byType['IfcSpace'] || [];

    const levelsMap = storeys.map(st => {
      const levelName = st.name || 'Sin Nivel';
      const levelSpaces = spaces.filter(sp => sp.level === levelName);
      const levelElements = (parsed.dataList || []).filter(el => 
        el.level === levelName && !['IfcBuildingStorey', 'IfcProject', 'IfcBuilding', 'IfcSite'].includes(el.type)
      );

      return {
        globalId: st.globalId,
        name: levelName,
        elevation: st.elevation || 0,
        spaces: levelSpaces.map(sp => ({
          globalId: sp.globalId,
          name: sp.name,
          description: sp.description,
          area: sp.area,
          volume: sp.volume,
          properties: this.extractProperties(sp)
        })),
        elementCount: levelElements.length
      };
    });

    return levelsMap;
  },

  /**
   * Extrae las propiedades de un objeto ifcJSON (IfcPropertySet)
   */
  extractProperties(ifcObject) {
    const props = {};
    if (!ifcObject || !ifcObject.hasProperties) return props;

    ifcObject.hasProperties.forEach(pset => {
      if (pset.hasProperties && Array.isArray(pset.hasProperties)) {
        pset.hasProperties.forEach(p => {
          if (p.name) {
            props[p.name] = p.nominalValue !== undefined ? p.nominalValue : true;
          }
        });
      }
    });

    return props;
  },

  /**
   * Convierte los objetos geométricos de ifcJSON en nodos 3D navegables
   */
  extract3DSceneNodes(parsed) {
    const nodes = [];
    (parsed.dataList || []).forEach(item => {
      if (item.geometry && item.geometry.vertices) {
        nodes.push({
          globalId: item.globalId,
          name: item.name || item.type,
          type: item.type,
          category: item.category || item.type,
          level: item.level || '',
          geometry: {
            vertices: item.geometry.vertices,
            indices: item.geometry.indices || [],
            normals: item.geometry.normals || [],
            colorHex: item.geometry.colorHex || '#888888'
          },
          properties: this.extractProperties(item)
        });
      }
    });

    return nodes;
  }
};
