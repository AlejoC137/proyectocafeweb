// --- INGREDIENTES BASE PREDETERMINADOS (DUBOVIK FORMULATOR) ---
export const DEFAULT_INGREDIENTS = [
  { id: "leche_entera", nombre: "Leche Entera (3.2% Grasa)", grasa: 3.2, solidos: 11.7, pod: 0.5, pac: 1.0, unidad: "g" },
  { id: "crema_35", nombre: "Crema de Leche 35%", grasa: 35.0, solidos: 40.5, pod: 0.3, pac: 0.6, unidad: "g" },
  { id: "lpd", nombre: "Leche en Polvo Desnatada (LPD)", grasa: 1.0, solidos: 96.0, pod: 5.2, pac: 10.4, unidad: "g" },
  { id: "sacarosa", nombre: "Sacarosa (Azúcar común - Patrón POD 100 / PAC 100)", grasa: 0.0, solidos: 100.0, pod: 100.0, pac: 100.0, unidad: "g" },
  { id: "dextrosa", nombre: "Dextrosa Monohidratada", grasa: 0.0, solidos: 92.0, pod: 70.0, pac: 90.0, unidad: "g" },
  { id: "maltodextrina", nombre: "Maltodextrina DE19", grasa: 0.0, solidos: 95.0, pod: 15.0, pac: 20.0, unidad: "g" },
  { id: "glucosa_38", nombre: "Jarabe de Glucosa 38 DE", grasa: 0.0, solidos: 80.0, pod: 50.0, pac: 90.0, unidad: "g" },
  { id: "glucosa_60", nombre: "Jarabe de Glucosa 60 DE", grasa: 0.0, solidos: 80.0, pod: 70.0, pac: 130.0, unidad: "g" },
  { id: "chocolate_54", nombre: "Chocolate Cobertura 54%", grasa: 35.0, solidos: 98.0, pod: 50.0, pac: 25.0, unidad: "g" },
  { id: "cacao_polvo", nombre: "Cacao en Polvo 20/22", grasa: 21.0, solidos: 95.0, pod: 0.0, pac: 0.0, unidad: "g" },
  { id: "neutro_5", nombre: "Estabilizante Neutro 5g", grasa: 0.0, solidos: 100.0, pod: 0.0, pac: 0.0, unidad: "g" },
  { id: "inulina", nombre: "Inulina (Fibra soluble)", grasa: 0.0, solidos: 95.0, pod: 10.0, pac: 10.0, unidad: "g" },
  { id: "frambuesa", nombre: "Puré de Frambuesa", grasa: 0.0, solidos: 8.8, pod: 7.8, pac: 17.2, unidad: "g" },
  { id: "agua", nombre: "Agua de Chorro / Filtrada", grasa: 0.0, solidos: 0.0, pod: 0.0, pac: 0.0, unidad: "g" },
];

// --- GLOSARIO TECNICO MATERIALES BASE DUBOVIK ---
export const GLOSSARY_DUBOVIK = [
  {
    nombre: "Leche Entera (3.2% Grasa)",
    icono: "🧪",
    definicion: "Base líquida fundamental en helados de crema. Aporta fase acuosa, grasa láctea libre y sólidos lácteos no grasos (proteínas caseínas y suero).",
    valores: "Grasa: 3.2% | Sólidos: 11.7% | POD: 0.5 | PAC: 1.0",
    condiciones: "Representa del 50% al 70% de la mezcla total. Las proteínas encapsulan los glóbulos de grasa y aire durante el mantecado. Pastorizar a 85°C."
  },
  {
    nombre: "Crema de Leche 35%",
    icono: "🧪",
    definicion: "Fuente primaria de materia grasa láctea concentrada. Proporciona cremosidad, retarda el derretimiento y suaviza los cristales de hielo.",
    valores: "Grasa: 35.0% | Sólidos: 40.5% | POD: 0.3 | PAC: 0.6",
    condiciones: "Dosificar del 5% al 25% del mix según el nivel de grasa deseado (Soft o Gelato). Excesos provocan película grasa en el paladar."
  },
  {
    nombre: "Leche en Polvo Desnatada (LPD / SMP)",
    icono: "🧪",
    definicion: "Concentrado de sólidos lácteos no grasos (MSNF) con alta proteína. Aumenta la estructura y el overrun (incorporación de aire) sin sumar grasa.",
    valores: "Grasa: 1.0% | Sólidos: 96.0% | POD: 5.2 | PAC: 10.4",
    condiciones: "Usar de 3% a 7%. Si supera el 10% de MSNF sobre el agua del mix, existe riesgo de cristalización de la lactosa (sensación arenosa en boca)."
  },
  {
    nombre: "Sacarosa (Azúcar Común - Patrón POD 100 / PAC 100)",
    icono: "🧪",
    definicion: "Disacárido base patrón de comparación (POD = 100 / PAC = 100). Determina el dulzor de referencia y el punto de congelación estándar del agua.",
    valores: "Grasa: 0.0% | Sólidos: 100.0% | POD: 100.0 (Referencia) | PAC: 100.0 (Referencia)",
    condiciones: "Recomendado entre 10% y 16% del mix total. Sirve como estándar contra el cual se miden el resto de azúcares y polioles."
  },
  {
    nombre: "Dextrosa Monohidratada",
    icono: "🧪",
    definicion: "Monosacárido derivado del maíz. Posee un poder anticongelante elevado (PAC 90-190) y menor poder edulcorante que la sacarosa (POD 70).",
    valores: "Grasa: 0.0% | Sólidos: 92.0% | POD: 70.0 | PAC: 90.0",
    condiciones: "Excelente para reducir la dureza del helado en vitrina sin empalagar. Dosificación habitual del 2% al 6% del azúcar total."
  },
  {
    nombre: "Maltodextrina DE 19",
    icono: "🧪",
    definicion: "Polímero de glucosa de bajo DE. Aporta sólidos secos, viscosidad y cuerpo sin alterar el dulzor ni congelar demasiado el agua libre.",
    valores: "Grasa: 0.0% | Sólidos: 95.0% | POD: 15.0 | PAC: 20.0",
    condiciones: "Ideal en sorbetes y helados bajos en grasa para alcanzar entre 30% y 36% de sólidos totales sin endulzar en exceso (2% a 8% del mix)."
  },
  {
    nombre: "Jarabe de Glucosa 38 DE",
    icono: "🧪",
    definicion: "Jarabe deshidratado de mediana conversión. Otorga viscosidad, masticabilidad (chewiness) y evita la recristalización de azúcares.",
    valores: "Grasa: 0.0% | Sólidos: 80.0% | POD: 50.0 | PAC: 90.0",
    condiciones: "Reemplaza parcialmente la sacarosa (15% a 30% de los azúcares) para mejorar la resistencia al choque térmico durante el transporte."
  },
  {
    nombre: "Jarabe de Glucosa 60 DE",
    icono: "🧪",
    definicion: "Jarabe de alta conversión rico en azúcares simples. Alto valor de PAC para ablandar helados servidos a temperaturas muy bajas.",
    valores: "Grasa: 0.0% | Sólidos: 80.0% | POD: 70.0 | PAC: 130.0",
    condiciones: "Muy utilizado en sorbetes de fruta acida para mantener una textura espautlable a -14°C a -18°C."
  },
  {
    nombre: "Chocolate Cobertura 54%",
    icono: "🧪",
    definicion: "Materia prima compuesta rica en manteca de cacao y azúcar. Aporta estructura firme por la solidificación de la grasa vegetal noble.",
    valores: "Grasa: 35.0% | Sólidos: 98.0% | POD: 50.0 | PAC: 25.0",
    condiciones: "Incorporar fundido a 45°C en la fase caliente. Al tener bajo PAC, suele compensarse agregando Dextrosa a la mezcla."
  },
  {
    nombre: "Cacao en Polvo 20/22",
    icono: "🧪",
    definicion: "Cacao desgrasado parcial alcalinizado (20-22% manteca). Otorga sabor intenso, color profundo y absorbe gran cantidad de agua libre.",
    valores: "Grasa: 21.0% | Sólidos: 95.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Usar entre 2% y 4%. Al ser muy higroscópico, requiere ajustar la hidratación hídrica o aumentar ligeramente los azúcares."
  },
  {
    nombre: "Estabilizante Neutro 5g",
    icono: "🧪",
    definicion: "Complejo de hidrocoloides (Garrofín, Guar, CMC) y emulsionantes. Absorbe el agua no ligada y estabiliza las burbujas de aire.",
    valores: "Grasa: 0.0% | Sólidos: 100.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Dosis estricta de 4g a 5g por kg de mezcla (0.4% - 0.5%). Mezclar en seco con el azúcar antes de dispersar a 50°C."
  },
  {
    nombre: "Inulina (Fibra Soluble)",
    icono: "🧪",
    definicion: "Fructano de origen vegetal. Simula la textura y sensación grasosa en la boca (fat-replacer) sin aportar calorías ni apenas dulzor.",
    valores: "Grasa: 0.0% | Sólidos: 95.0% | POD: 10.0 | PAC: 10.0",
    condiciones: "Indispensable en helados veganos y sorbetes de fruta para dar cuerpo, viscosidad y textura uniforme (dosificación 2% a 6%)."
  },
  {
    nombre: "Puré de Frambuesa (Fruta)",
    icono: "🧪",
    definicion: "Pulpa natural de fruta. Aporta la fase acuosa con azúcares naturales propios (fructosa/glucosa), ácidos orgánicos y sólidos secos de fruta.",
    valores: "Grasa: 0.0% | Sólidos: 8.8% | POD: 7.8 | PAC: 17.2",
    condiciones: "En sorbetes constituye del 30% al 50% de la formulación total. Mantener balance hídrico adecuado."
  },
  {
    nombre: "Agua Filtrada",
    icono: "🧪",
    definicion: "Solvente puro para la disolución de azúcares e hidrocoloides en sorbetes y preparaciones sin base láctea.",
    valores: "Grasa: 0.0% | Sólidos: 0.0% | POD: 0.0 | PAC: 0.0",
    condiciones: "Utilizar agua purificada u ósmosis inversa para evitar que minerales/cloro interfieran con el rendimiento de los estabilizantes."
  }
];

// RANGOS RECOMENDADOS SEGÚN TIPO DE HELADO
export const TARGET_RANGES = {
  GELATO: {
    grasa: { min: 6.0, max: 12.0, opt: "6% - 12%" },
    solidos: { min: 36.0, max: 42.0, opt: "36% - 42%" },
    pod: { min: 16.0, max: 22.0, opt: "16 - 22" },
    pac: { min: 24.0, max: 32.0, opt: "24 - 32" },
  },
  SOFT: {
    grasa: { min: 4.0, max: 10.0, opt: "4% - 10%" },
    solidos: { min: 32.0, max: 39.0, opt: "32% - 39%" },
    pod: { min: 14.0, max: 18.0, opt: "14 - 18" },
    pac: { min: 15.0, max: 22.0, opt: "15 - 22" },
  },
  SORBETE: {
    grasa: { min: 0.0, max: 1.5, opt: "0% - 1.5%" },
    solidos: { min: 26.0, max: 32.0, opt: "26% - 32%" },
    pod: { min: 15.0, max: 20.0, opt: "15 - 20" },
    pac: { min: 18.0, max: 25.0, opt: "18 - 25" },
  }
};

// PRESET TEST RECIPES FROM DUBOVIK EXCEL & CATALOG
export const PRESET_RECIPES = {
  chocolate_soft: {
    nombre: "Chocolate Soft (Dubovik)",
    tipo: "SOFT",
    items: [
      { ingId: "leche_entera", cantidad: 655, inventarioItemId: "" },
      { ingId: "crema_35", cantidad: 60, inventarioItemId: "" },
      { ingId: "lpd", cantidad: 30, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 70, inventarioItemId: "" },
      { ingId: "dextrosa", cantidad: 60, inventarioItemId: "" },
      { ingId: "chocolate_54", cantidad: 90, inventarioItemId: "" },
      { ingId: "cacao_polvo", cantidad: 30, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  },
  vainilla_soft: {
    nombre: "Vainilla Soft Cremoso (Dubovik)",
    tipo: "SOFT",
    items: [
      { ingId: "leche_entera", cantidad: 670, inventarioItemId: "" },
      { ingId: "crema_35", cantidad: 110, inventarioItemId: "" },
      { ingId: "lpd", cantidad: 45, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 105, inventarioItemId: "" },
      { ingId: "dextrosa", cantidad: 40, inventarioItemId: "" },
      { ingId: "glucosa_38", cantidad: 25, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  },
  fior_di_latte_gelato: {
    nombre: "Gelato Fior di Latte (Dubovik)",
    tipo: "GELATO",
    items: [
      { ingId: "leche_entera", cantidad: 540, inventarioItemId: "" },
      { ingId: "crema_35", cantidad: 185, inventarioItemId: "" },
      { ingId: "lpd", cantidad: 40, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 90, inventarioItemId: "" },
      { ingId: "dextrosa", cantidad: 80, inventarioItemId: "" },
      { ingId: "glucosa_60", cantidad: 60, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  },
  cacao_gelato: {
    nombre: "Gelato Cacao Intenso (Dubovik)",
    tipo: "GELATO",
    items: [
      { ingId: "leche_entera", cantidad: 615, inventarioItemId: "" },
      { ingId: "crema_35", cantidad: 90, inventarioItemId: "" },
      { ingId: "lpd", cantidad: 25, inventarioItemId: "" },
      { ingId: "chocolate_54", cantidad: 60, inventarioItemId: "" },
      { ingId: "cacao_polvo", cantidad: 20, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 85, inventarioItemId: "" },
      { ingId: "dextrosa", cantidad: 70, inventarioItemId: "" },
      { ingId: "glucosa_60", cantidad: 30, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  },
  frambuesa_sorbete: {
    nombre: "Frambuesa Soft Sorbete (Dubovik)",
    tipo: "SORBETE",
    items: [
      { ingId: "agua", cantidad: 365, inventarioItemId: "" },
      { ingId: "sacarosa", cantidad: 110, inventarioItemId: "" },
      { ingId: "inulina", cantidad: 70, inventarioItemId: "" },
      { ingId: "maltodextrina", cantidad: 70, inventarioItemId: "" },
      { ingId: "frambuesa", cantidad: 380, inventarioItemId: "" },
      { ingId: "neutro_5", cantidad: 5, inventarioItemId: "" },
    ]
  }
};
