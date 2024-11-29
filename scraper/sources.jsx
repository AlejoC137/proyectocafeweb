const sources = [
    {
      name: 'EXITO',
      sites: [
        {
          cat: 'LACTO_CARNICO',
          url: 'https://www.exito.com/mercado/lacteos-huevos-y-refrigerados',
        },
        {
          cat: 'FRUTAS_VERDURAS',
          url: 'https://www.exito.com/mercado/frutas-y-verduras/frutas',
        },
        {
          cat: 'ALMACEN',
          url: 'https://www.exito.com/mercado/despensa',
        },
      ],
      target: 'productCard_productInfo__yn2lK',
      pointers: [
        { tittle: 'styles_name__qQJiK' },
        { $ByUnits: 'product-unit_price-unit__text__qeheS' },
        { $1: 'ProductPrice_container__price__XmMWA' },
        { $2: 'price_fs-price__4GZ9F' },
      ],
    },
  ];
  
  const sourcer = (name, cat) => {
    // Si no se pasan parámetros, devolver el objeto sources completo
    if (!name || !cat) {
      return sources;
    }
  
    // Buscar la fuente por nombre
    const source = sources.find((source) => source.name === name);
  
    if (!source) {
      throw new Error(`Source with name "${name}" not found.`);
    }
  
    // Buscar la categoría dentro de la fuente
    const site = source.sites.find((site) => site.cat === cat);
  
    if (!site) {
      throw new Error(`Category "${cat}" not found in source "${name}".`);
    }
  
    // Retornar un objeto con la URL, target y pointers
    return {
      url: site.url,
      target: source.target,
      pointers: source.pointers,
    };
  };
  
  export default sourcer;
  