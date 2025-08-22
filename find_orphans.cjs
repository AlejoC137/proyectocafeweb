const fs = require('fs');
const path = require('path');

// Lista de archivos utilizados (obtenida del análisis de dependencias completo)
const usedFiles = [
    'body/components/Menu/CardGridAgenda.jsx',
    'body/components/Menu/Encabezado.jsx',
    'body/components/Menu/MenuAgenda.jsx',
    'body/components/Menu/MenuPrint.jsx',
    'body/components/Menu/MenuPrintForm.jsx',
    'body/components/Menu/MenuPrintInfo.jsx',
    'body/components/gastos/Gastos.jsx',
    'body/components/recepieOptions/RecepieOptionsProcedimientos.jsx',
    'body/views/actividades/Actividades.jsx',
    'body/views/actividades/Pagar.jsx',
    'body/views/actividades/ProcedimientosCreator.jsx',
    'body/views/actividades/StaffCreator.jsx',
    'body/views/actividades/StaffInstance.jsx',
    'body/views/actividades/StaffOrdered.jsx',
    'body/views/actividades/WorkIsue.jsx',
    'body/views/actividades/WorkIsueCreator.jsx',
    'body/views/actualizarPrecioUnitario/AccionesRapidas.jsx',
    'body/views/actualizarPrecioUnitario/AccionesRapidasActividades.jsx',
    'body/views/agenda/Agenda.jsx',
    'body/views/buscarPreciosInternet/BuscarPreciosInternet.jsx',
    'body/views/home/Home.jsx',
    'body/views/home/LandingHome.jsx',
    'body/views/inventario/Inventario.jsx',
    'body/views/inventario/Manager.jsx',
    'body/views/inventario/gridInstance/CardGridProcedimientos.jsx',
    'body/views/inventario/gridInstance/CardGridProcedimientos_Instance.jsx',
    'body/views/inventario/gridInstance/CardGridStaff.jsx',
    'body/views/inventario/gridInstance/CardGridStaff_Instance.jsx',
    'body/views/inventario/gridInstance/CardGridWorkIsue.jsx',
    'body/views/inventario/gridInstance/CardGridWorkIsue_Instance.jsx',
    'body/views/lunchByOrder/AlergiasNoComo.jsx',
    'body/views/lunchByOrder/DietaMeGusta.jsx',
    'body/views/lunchByOrder/GeneralInfo.jsx',
    'body/views/lunchByOrder/LunchByOrder.jsx',
    'body/views/lunchByOrder/PicanteNotas.jsx',
    'body/views/menuView/MenuLunch.jsx',
    'body/views/menuView/MenuView.jsx',
    'body/views/proveedores/Proveedores.jsx',
    'body/views/sobreNosotros/SobreNosotros.jsx',
    'body/views/staff/CalculoNomina.jsx',
    'body/views/staff/staffInstance.jsx',
    'body/views/staff/staffPortal.jsx',
    'body/views/staff/staffShift.jsx',
    'body/views/staff/staffWorkIssues.jsx',
    'body/views/staff/staffWorkIssues_Instance.jsx',
    'body/views/ventaCompra/DiaResumen.jsx',
    'body/views/ventaCompra/DiaResumentStats.jsx',
    'body/views/ventaCompra/MenuDelDiaList.jsx',
    'body/views/ventaCompra/MenuDelDiaPrint.jsx',
    'body/views/ventaCompra/MesResumen.jsx',
    'body/views/ventaCompra/MesResumenStats.jsx',
    'body/views/ventaCompra/Mesa.jsx',
    'body/views/ventaCompra/MesaBarra.jsx',
    'body/views/ventaCompra/Pagar.jsx',
    'body/views/ventaCompra/Predict.jsx',
    'body/views/ventaCompra/RecetaModal.jsx',
    'body/views/ventaCompra/VentaCompra.jsx'
];

// Función recursiva para encontrar todos los archivos .jsx
function findAllJsxFiles(directory) {
    const files = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
            files.push(...findAllJsxFiles(fullPath));
        } else if (entry.name.endsWith('.jsx')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Encontrar todos los archivos .jsx en src/body/
const bodyDirectory = path.join(__dirname, 'src', 'body');
const allJsxFiles = findAllJsxFiles(bodyDirectory);

// Convertir rutas absolutas a relativas para comparación
const srcPath = path.join(__dirname, 'src');
const allRelativeFiles = allJsxFiles.map(file => {
    return path.relative(srcPath, file).replace(/\\/g, '/');
});

// Encontrar archivos huérfanos (NO conectados al árbol de App.jsx)
const usedFilesSet = new Set(usedFiles);
const orphanFiles = allRelativeFiles.filter(file => !usedFilesSet.has(file));

console.log('=== ANÁLISIS DE ÁRBOL DE DEPENDENCIAS ===');
console.log(`Total archivos .jsx encontrados en src/body/: ${allRelativeFiles.length}`);
console.log(`Total archivos conectados al árbol de App.jsx: ${usedFiles.length}`);
console.log(`Total archivos HUÉRFANOS (no conectados): ${orphanFiles.length}`);

if (orphanFiles.length > 0) {
    console.log('\n=== ARCHIVOS HUÉRFANOS (CANDIDATOS A ELIMINACIÓN) ===');
    console.log('Estos archivos NO están conectados a App.jsx ni directa ni indirectamente:');
    orphanFiles.sort().forEach((file, index) => {
        const absolutePath = path.join(srcPath, file);
        const stats = fs.statSync(absolutePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`${index + 1}. ${file} (${sizeKB} KB)`);
    });
    
    const totalSizeBytes = orphanFiles.reduce((total, file) => {
        const absolutePath = path.join(srcPath, file);
        const stats = fs.statSync(absolutePath);
        return total + stats.size;
    }, 0);
    
    console.log(`\nEspacio total a liberar: ${(totalSizeBytes / 1024).toFixed(1)} KB`);
} else {
    console.log('\n✅ ¡Excelente! No se encontraron archivos huérfanos.');
    console.log('Todos los archivos .jsx están conectados al árbol de dependencias de App.jsx');
}

// Verificar duplicados por nombre (archivos con mismo nombre en diferentes carpetas)
console.log('\n=== VERIFICACIÓN DE DUPLICADOS POR NOMBRE ===');
const fileNames = {};
allRelativeFiles.forEach(file => {
    const fileName = path.basename(file);
    if (!fileNames[fileName]) {
        fileNames[fileName] = [];
    }
    fileNames[fileName].push(file);
});

const duplicates = Object.entries(fileNames).filter(([name, paths]) => paths.length > 1);
if (duplicates.length > 0) {
    console.log('📋 Archivos con nombres duplicados encontrados:');
    duplicates.forEach(([name, paths]) => {
        console.log(`\n🔍 ${name}:`);
        paths.forEach(filePath => {
            const isUsed = usedFilesSet.has(filePath);
            const status = isUsed ? '✅ USADO' : '❌ NO USADO';
            console.log(`     ${filePath} ${status}`);
        });
    });
} else {
    console.log('✅ No se encontraron nombres duplicados.');
}

// Generar comando de eliminación (para revisión)
if (orphanFiles.length > 0) {
    console.log('\n=== COMANDO DE ELIMINACIÓN SUGERIDO ===');
    console.log('⚠️  REVISAR ANTES DE EJECUTAR:');
    orphanFiles.forEach(file => {
        const absolutePath = path.join(srcPath, file).replace(/\//g, '\\');
        console.log(`Remove-Item "${absolutePath}"`);
    });
}
