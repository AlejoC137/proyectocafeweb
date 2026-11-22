/**
 * Estudio de mercado: Precios promedio en Rappi Medellín (Conquistadores / Laureles / El Poblado).
 * Referentes consultados: Al Alma Café, Pergamino Café, Libertario Coffee Roasters,
 * The Breakfast Club, Brunch & Munch, Bagatelle, La Parcería, Pasta Lab, El Calentao,
 * Repostería Santa Elena, Masa, Aura Bakery, Valentina Bakery, Café Quindío y Café en Calma.
 * Fecha de levantamiento: Noviembre 2026.
 */

export const BENCHMARK_METADATA = {
  fecha: "22 de noviembre de 2026",
  ciudad: "Medellín (Conquistadores, Laureles y El Poblado)",
  competidores: [
    "Al Alma Café",
    "Pergamino Café",
    "Libertario Coffee Roasters",
    "The Breakfast Club",
    "Brunch & Munch",
    "Bagatelle",
    "La Parcería",
    "Pasta Lab",
    "El Calentao",
    "Repostería Santa Elena",
    "Masa",
    "Aura Bakery",
    "Café Quindío",
    "Café en Calma",
  ],
};

const normalizeName = (str = "") =>
  String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Mapa exacto (normalizado sin tildes y en minúsculas) -> { min, max, avg, sugerido, nota }
 */
const EXACT_BENCHMARKS = {
  // === CAFE_ESPRESSO ===
  "espresso": { min: 7000, max: 9000, avg: 8000, sugerido: 8200, nota: "Alineado al mercado" },
  "espresso doble": { min: 7000, max: 9500, avg: 8200, sugerido: 8500, nota: "Alineado al mercado" },
  "americano": { min: 7500, max: 9500, avg: 8500, sugerido: 8500, nota: "Al Alma $8.300–$9.500" },
  "americano frio": { min: 8000, max: 10000, avg: 9000, sugerido: 9000, nota: "Alineado al mercado" },
  "bombom": { min: 9000, max: 11500, avg: 10200, sugerido: 10000, nota: "Espacio leve para subir" },
  "capuchino": { min: 9500, max: 12500, avg: 10800, sugerido: 10500, nota: "Al Alma $10.300; cafés MDE $10k–$12k" },
  "latte": { min: 9500, max: 12500, avg: 10800, sugerido: 10900, nota: "En el punto exacto" },
  "macchiato": { min: 9500, max: 12500, avg: 10800, sugerido: 10700, nota: "En el punto exacto" },
  "latte en hielo de espresso": { min: 10500, max: 13500, avg: 12000, sugerido: 11900, nota: "Espacio leve para subir" },
  "moca-chino": { min: 11000, max: 13800, avg: 12200, sugerido: 12200, nota: "Alineado al mercado" },
  "chai-chino": { min: 12000, max: 14500, avg: 13200, sugerido: 13200, nota: "Dirty Chai MDE $12k–$13.5k" },

  // === CAFE_METODOS ===
  "prensa francesa": { min: 9500, max: 16000, avg: 12500, sugerido: 11500, nota: "Muy barato vs. especialidad MDE" },
  "v60": { min: 9500, max: 16000, avg: 12500, sugerido: 11500, nota: "Muy barato vs. especialidad MDE" },
  "aeropress": { min: 9500, max: 16000, avg: 12500, sugerido: 11500, nota: "Muy barato vs. especialidad MDE" },
  "cold brew clasico": { min: 10800, max: 15000, avg: 12800, sugerido: 12500, nota: "Competitivo en Rappi MDE" },
  "latte espuma de cafe": { min: 12000, max: 15000, avg: 13500, sugerido: 13800, nota: "Alineado al mercado" },
  "frappe": { min: 16000, max: 21800, avg: 18000, sugerido: 16900, nota: "Gran margen para subir sin perder demanda" },
  "cold brew leche": { min: 13000, max: 17000, avg: 15000, sugerido: 15500, nota: "Algo alto vs. promedio" },
  "cold brew te verde": { min: 13000, max: 17000, avg: 15000, sugerido: 15500, nota: "Algo alto vs. promedio" },
  "cold brew naranja & panela": { min: 13000, max: 17000, avg: 15000, sugerido: 15500, nota: "Algo alto vs. promedio" },
  "malteada de cafe": { min: 16500, max: 22000, avg: 19000, sugerido: 21900, nota: "Muy por encima del promedio MDE" },

  // === BEBIDAS_CALIENTES ===
  "infusiones": { min: 7500, max: 10500, avg: 9000, sugerido: 8900, nota: "Espacio leve para subir" },
  "te negro limon & miel": { min: 7500, max: 10500, avg: 9000, sugerido: 8900, nota: "Espacio leve para subir" },
  "guandolo flor de jamaica": { min: 8500, max: 12000, avg: 10000, sugerido: 9900, nota: "Competitivo" },
  "chocolate caliente": { min: 9500, max: 14000, avg: 12000, sugerido: 11900, nota: "En el promedio exacto" },
  "milo": { min: 12000, max: 15500, avg: 13800, sugerido: 13500, nota: "Espacio para subir $1.000" },
  "latte dorado": { min: 13500, max: 18500, avg: 15500, sugerido: 14900, nota: "Golden Milk MDE hasta $18k–$19k" },
  "te matcha latte": { min: 12000, max: 17500, avg: 15000, sugerido: 14900, nota: "Matcha MDE $13k–$17.5k" },
  "te chai latte": { min: 10500, max: 13500, avg: 12200, sugerido: 12900, nota: "Al Alma $11.600–$13.000" },

  // === BEBIDAS_FRIAS ===
  "soda clasica": { min: 6500, max: 9500, avg: 8000, sugerido: 7500, nota: "Debajo del promedio de cafetería" },
  "agua en botella sin gas": { min: 5500, max: 8000, avg: 6800, sugerido: 6900, nota: "Alineado" },
  "te negro arandanos & miel": { min: 9500, max: 13000, avg: 11000, sugerido: 10500, nota: "Margen disponible (+25%)" },
  "jugos de frutas": { min: 9500, max: 14000, avg: 11500, sugerido: 10900, nota: "Muy barato vs. Rappi MDE" },
  "jugo de naranja": { min: 10000, max: 14000, avg: 11800, sugerido: 11500, nota: "Muy barato vs. Rappi MDE" },
  "soda limon & romero": { min: 12000, max: 16500, avg: 14000, sugerido: 12500, nota: "Sodas artesanales MDE $12k–$17k" },
  "soda naranja & panela": { min: 12000, max: 16500, avg: 14000, sugerido: 12500, nota: "Sodas artesanales MDE $12k–$17k" },
  "soda frutos rojos": { min: 12000, max: 16500, avg: 14000, sugerido: 12500, nota: "Sodas artesanales MDE $12k–$17k" },
  "guandolo clasico": { min: 9500, max: 13000, avg: 11200, sugerido: 10900, nota: "Espacio para subir" },
  "guandolo jengibre": { min: 9500, max: 13000, avg: 11200, sugerido: 10900, nota: "Espacio para subir" },
  "limonada": { min: 12000, max: 16500, avg: 14000, sugerido: 12500, nota: "Limonadas en cafetería MDE $12k–$17k" },
  "te hatsu": { min: 9500, max: 13900, avg: 11500, sugerido: 11500, nota: "Cafeterías MDE $10k–$13.9k" },
  "gaseosa 1.5 lt": { min: 10000, max: 14000, avg: 12000, sugerido: 12000, nota: "Alineado" },
  "kombucha per te": { min: 12600, max: 17000, avg: 14800, sugerido: 15500, nota: "Rango medio-alto" },
  "madre monte": { min: 16000, max: 22000, avg: 19000, sugerido: 19900, nota: "Bebida especial rango alto" },

  // === DESAYUNO_DULCE ===
  "pancakes frutos rojos": { min: 26000, max: 30500, avg: 28500, sugerido: 28800, nota: "The Breakfast Club $28.900" },
  "pancakes chocolate": { min: 26000, max: 30500, avg: 28500, sugerido: 28800, nota: "En el punto exacto" },
  "yogurt griego, granola y frutas": { min: 22500, max: 31900, avg: 27500, sugerido: 28500, nota: "Rango medio-alto (Bacu/Smash $31.9k)" },
  "bowl de yogurt & frutos rojos": { min: 22500, max: 31900, avg: 27500, sugerido: 28500, nota: "Rango medio-alto" },
  "tostadas francesas": { min: 23000, max: 31900, avg: 28000, sugerido: 29900, nota: "En el techo del rango (Bagatelle $23k, Smash $31.9k)" },
  "waffle con helado y frutas": { min: 26000, max: 36500, avg: 31000, sugerido: 32500, nota: "Alineado a brunch premium" },

  // === DESAYUNO_SALADO ===
  "chorizo y mote": { min: 22000, max: 29000, avg: 25500, sugerido: 25500, nota: "Alineado" },
  "calentao": { min: 20000, max: 30000, avg: 25000, sugerido: 25900, nota: "El Calentao $18k–$30k" },
  "huevos revueltos pericos": { min: 18000, max: 28000, avg: 24000, sugerido: 24900, nota: "Alineado a brunch; alto vs. típico" },
  "desayuno americano": { min: 28000, max: 34500, avg: 31000, sugerido: 30500, nota: "Brunch & Munch $28k; TBC $34.5k" },
  "tostadas de aguacate y huevo": { min: 30000, max: 35000, avg: 32500, sugerido: 31500, nota: "Al Alma $30.8k–$34.1k; espacio para subir" },
  "huevos shakshukas": { min: 26000, max: 38000, avg: 33000, sugerido: 31900, nota: "La Parcería $35k; Cambria $26k" },
  "sanduche de huevo": { min: 26900, max: 34400, avg: 30500, sugerido: 29900, nota: "Al Alma Brioche $34.4k; TBC $26.9k" },
  "huevos con jamon y arepa de chocolo": { min: 28000, max: 35000, avg: 31500, sugerido: 31300, nota: "En el punto exacto" },
  "pancakes huevo & tocino": { min: 29000, max: 35000, avg: 32000, sugerido: 31500, nota: "En el punto exacto" },

  // === TARDEO_ALMUERZO ===
  "sanduche capresse": { min: 30000, max: 34000, avg: 31500, sugerido: 30900, nota: "Pasta Lab $30.9k; Food Tables $32.8k" },
  "sanduche de pollo": { min: 31500, max: 36000, avg: 33000, sugerido: 32500, nota: "Pasta Lab $32.5k; Alba $31.9k" },

  // === PANADERIA_REPOSTERIA_DULCE ===
  "galleta de avena": { min: 8500, max: 13000, avg: 10000, sugerido: 9500, nota: "Debajo del promedio artesanal MDE" },
  "rollo de canela": { min: 9900, max: 12400, avg: 11200, sugerido: 11300, nota: "En el punto exacto" },
  "torta de banano, mani y caramelo": { min: 13500, max: 17500, avg: 15500, sugerido: 15900, nota: "Alineado" },
  "torta de zanahoria": { min: 13700, max: 18000, avg: 16500, sugerido: 18500, nota: "Santa Elena/Aura $13.7k–$18k" },
  "tiramisu clasico": { min: 16000, max: 18500, avg: 18000, sugerido: 18900, nota: "Masa/Aura ~$18.000 porción" },
  "tarta basca": { min: 16500, max: 18500, avg: 18000, sugerido: 18900, nota: "Masa/Aura ~$18.000 porción" },
  "pie de manzana": { min: 15000, max: 20000, avg: 17500, sugerido: 19500, nota: "Arriba del promedio (+22%)" },
  "torta chocolate": { min: 13700, max: 18800, avg: 17000, sugerido: 18900, nota: "Arriba del promedio (+25%)" },

  // === PANADERIA_REPOSTERIA_SALADA ===
  "brioche 100g": { min: 7500, max: 10500, avg: 9000, sugerido: 9400, nota: "Alineado" },
  "croissant de queso": { min: 8500, max: 11500, avg: 10000, sugerido: 10500, nota: "Alineado" },
  "palito de queso": { min: 9600, max: 12000, avg: 10800, sugerido: 10700, nota: "Santa Elena/Farolitos $9.6k–$12k" },
  "croisant jamon y queso": { min: 9500, max: 13500, avg: 11500, sugerido: 13900, nota: "OJO: +42% sobre promedio MDE ($11.5k)" },
  "brioche 600g": { min: 26000, max: 35000, avg: 30000, sugerido: 32500, nota: "Pieza familiar artesanal" },

  // === CAFE_GRANO ===
  "cafe jardin 250gr": { min: 45000, max: 52000, avg: 48500, sugerido: 46500, nota: "Pergamino Lomaverde $45.9k / Alto Letras $49.9k" },
  "cafe jose omar 250gr": { min: 48000, max: 62000, avg: 55000, sugerido: 58000, nota: "Rango medio-alto especialidad" },
  "cafe natural vinoso 250gr": { min: 55000, max: 70000, avg: 62000, sugerido: 68500, nota: "Proceso natural; +25% lo lleva arriba" },
  "cafe bourbon rosado 250gr": { min: 58000, max: 72000, avg: 65000, sugerido: 72000, nota: "Varietal especial; +25% lo lleva arriba" },
  "cafe jardin 500gr": { min: 75000, max: 90000, avg: 82000, sugerido: 80000, nota: "Muy competitivo" },
  "cafe jose omar 500gr": { min: 85000, max: 105000, avg: 95000, sugerido: 93800, nota: "Alineado" },
  "cafe gesha 250gr": { min: 80000, max: 115000, avg: 95000, sugerido: 99000, nota: "Microlote exótico (banda alta)" },
  "cafe sl28 250gr": { min: 80000, max: 115000, avg: 95000, sugerido: 102000, nota: "Microlote exótico (banda alta)" },

  // === ADICIONES_BEBIDAS ===
  "adicion de vainilla": { min: 2500, max: 4000, avg: 3200, sugerido: 3000, nota: "Alineado" },
  "adicion leche almendras": { min: 3000, max: 4500, avg: 3800, sugerido: 3800, nota: "En el promedio" },
  "adicion michelado": { min: 3000, max: 4500, avg: 3800, sugerido: 4000, nota: "Alineado" },
  "adicion de caramelo": { min: 3000, max: 4500, avg: 3800, sugerido: 4500, nota: "Algo alto vs. jarabes MDE" },
  "adicion baileys": { min: 6000, max: 8500, avg: 7200, sugerido: 6900, nota: "Alineado" },
  "adicion cafe especialidad de temporada": { min: 5000, max: 8000, avg: 6500, sugerido: 6900, nota: "Alineado" },

  // === ADICIONES_COMIDAS ===
  "adicion hogao": { min: 3000, max: 4500, avg: 3800, sugerido: 4000, nota: "Alineado" },
  "pan de masa madre": { min: 3500, max: 5000, avg: 4200, sugerido: 4400, nota: "Alineado" },
  "adicion queso mozzarella": { min: 4000, max: 6000, avg: 5000, sugerido: 5200, nota: "Alineado" },
  "adicion de chorizo": { min: 4500, max: 6500, avg: 5500, sugerido: 5400, nota: "Alineado (revisar duplicado)" },
  "adicion de helado ( comercial )": { min: 4500, max: 6500, avg: 5500, sugerido: 5700, nota: "Alineado" },
  "adicion arepa": { min: 4000, max: 6000, avg: 5000, sugerido: 5200, nota: "Alineado" },
  "adicion de fruta": { min: 5000, max: 7500, avg: 6200, sugerido: 6500, nota: "Alineado" },
  "adicion de arroz": { min: 4500, max: 6500, avg: 5500, sugerido: 6000, nota: "Algo alto" },
  "adicion aguacate": { min: 4900, max: 6500, avg: 5500, sugerido: 6500, nota: "Alto vs. $4.900–$6.500 MDE" },
  "adicion sopa": { min: 6500, max: 9500, avg: 8000, sugerido: 8200, nota: "Alineado" },
  "adicion tocino": { min: 4900, max: 7500, avg: 6000, sugerido: 7500, nota: "Alto vs. $4.900–$7.500 MDE" },
  "adicion de huevos": { min: 4500, max: 6500, avg: 5500, sugerido: 6900, nota: "Muy alto vs. adición huevo MDE" },
  "adicion de jamon": { min: 5500, max: 8000, avg: 6800, sugerido: 8500, nota: "Muy alto vs. adición jamón MDE" },
  "adicion pollo": { min: 9000, max: 12000, avg: 10500, sugerido: 11900, nota: "Alto vs. proteína extra MDE" },
  "arepa chocolo doble queso": { min: 13000, max: 16000, avg: 14500, sugerido: 15500, nota: "Rango alto" },

  // === SIN_GRUPO ===
  "adicion de salsa de chocolate": { min: 2000, max: 3500, avg: 2800, sugerido: 2000, nota: "Sin categoría (SIN_GRUPO)" },
  "coca cola 400 ml": { min: 5500, max: 7000, avg: 6500, sugerido: 7000, nota: "Sin categoría (SIN_GRUPO)" },
  "huevos revueltos 2 quesos": { min: 24000, max: 28000, avg: 26000, sugerido: 26300, nota: "Sin categoría (SIN_GRUPO)" },
  "cafe 500gr": { min: 75000, max: 85000, avg: 80000, sugerido: 75000, nota: "Sin categoría (SIN_GRUPO)" },
};

/**
 * Busca el benchmark de mercado para un producto del menú.
 */
export function getMarketBenchmark(nombreES = "") {
  const key = normalizeName(nombreES);
  if (EXACT_BENCHMARKS[key]) return EXACT_BENCHMARKS[key];

  // Fallback por coincidencia parcial si se renombra levemente un ítem
  for (const [k, val] of Object.entries(EXACT_BENCHMARKS)) {
    if (key.includes(k) || k.includes(key)) {
      return val;
    }
  }
  return null;
}

/**
 * Clasifica la posición de precio de un producto vs. el promedio de mercado Rappi MDE.
 * - BARATO: <= -10% (oportunidad de subir precio para recuperar comisión)
 * - CARO:   >= +10% (revisar conversión / considerar bajar)
 * - ALINEADO: entre -10% y +10%
 */
export function clasificarPosicionMercado(precioRappi, benchmark) {
  if (!benchmark || !benchmark.avg || !precioRappi) {
    return { status: "SIN_DATA", diffPct: null, label: "Sin referencia" };
  }
  const diffPct = ((precioRappi - benchmark.avg) / benchmark.avg) * 100;
  if (diffPct <= -10) {
    return { status: "BARATO", diffPct, label: "Por debajo (Subir)" };
  }
  if (diffPct >= 10) {
    return { status: "CARO", diffPct, label: "Por encima (Revisar)" };
  }
  return { status: "ALINEADO", diffPct, label: "Alineado" };
}
