const fs = require('fs');

let code = fs.readFileSync('src/body/views/planta/PlantaCadEditor.jsx', 'utf8');

// Find where inspector starts
const inspectorStartMarker = `{/* Panel Inspector de Propiedades y Yields */}`;
const inspectorStartIndex = code.indexOf(inspectorStartMarker);

// Find where inspector ends: before `{/* Modal para Agregar Nuevos Equipos */}`
const modalStartMarker = `{/* Modal para Agregar Nuevos Equipos */}`;
const modalStartIndex = code.indexOf(modalStartMarker);

console.log('Inspector start:', inspectorStartIndex, 'Modal start:', modalStartIndex);

const beforeInspector = code.substring(0, inspectorStartIndex);
const inspectorAndAfter = code.substring(inspectorStartIndex);

// Inside inspector, find where Nombre del Activo finishes (before Orientation)
const orientMarker = `{/* Control de Orientación / Rotación */}`;
const orientIndex = code.indexOf(orientMarker);

console.log('Orientation marker index:', orientIndex);

// Let's inspect lines 2000 to 2050 to see exact code
console.log(code.substring(inspectorStartIndex, orientIndex));
