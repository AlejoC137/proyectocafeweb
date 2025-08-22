const fs = require('fs');
const path = require('path');

// Lista de archivos huérfanos identificados
const orphanFiles = [
    'body/components/card/Card.jsx',
    'body/components/card/CardPrint.jsx',
    'body/components/card/GearIcon.jsx',
    'body/components/card/RecetaCard.jsx',
    'body/components/card/SwitchToggle.jsx',
    'body/components/cards/Cards.jsx',
    'body/components/checkList/CardCheckList.jsx',
    'body/components/checkList/CardsCheckList.jsx',
    'body/components/checkList/MenuCheckListByProps.jsx',
    'body/components/checkList/NavBar.jsx',
    'body/components/checkList/TagsInput.jsx',
    'body/components/displayProjects/DisplayProjects.jsx',
    'body/components/formWifi/FormWifi.jsx',
    'body/components/lengOptions/LengOptions.jsx',
    'body/components/manageStaff/CalculoNomina_ref.jsx',
    'body/components/manageStaff/ManageStaff.jsx',
    'body/components/menuButtons/MenuButtons.jsx',
    'body/components/menuPCSelect/MenuPCSelect.jsx',
    'body/components/menuSelect/MenuSelect.jsx',
    'body/components/percheroComp/PercheroComp.jsx',
    'body/components/projectForm/AddField.jsx',
    'body/components/projectForm/ProjectForm.jsx',
    'body/components/proveedorOptions/ProveedorOptions.jsx',
    'body/components/proyectistas/Propinas.jsx',
    'body/components/proyectistas/Proyectistas.jsx',
    'body/components/recepieOptions/RecepieOptions.jsx',
    'body/components/recepieOptions/RecepieOptionsMenu.jsx',
    'body/components/recetaOptions/RecetaOptions.jsx',
    'body/components/sideComp/SideComp.jsx',
    'body/views/actividades/DiaResumen.jsx',
    'body/views/actividades/Manager.jsx',
    'body/views/actividades/RecetaModal.jsx',
    'body/views/actualizarPrecioUnitario/AccionesRapidasMenuLunch.jsx',
    'body/views/actualizarPrecioUnitario/FormularioMenuAlmuerzo.jsx',
    'body/views/actualizarPrecioUnitario/Template.jsx',
    'body/views/buscarPreciosInternet/Template.jsx',
    'body/views/calculatorMenuPrice/CalculatorMenuPrice.jsx',
    'body/views/carrito/Carrito.jsx',
    'body/views/eventos/Eventos.jsx',
    'body/views/home/Template.jsx',
    'body/views/lenguajeSelect/LenguajeSelect.jsx',
    'body/views/lunchByOrder/PickDiet.jsx',
    'body/views/lunchByOrder/UserData.jsx',
    'body/views/menuCheckList/MenuCheckListCafe.jsx',
    'body/views/menuCheckList/MenuCheckListCocina.jsx',
    'body/views/menuCheckList/MenuCheckListDes.jsx',
    'body/views/menuPC/MenuPC.jsx',
    'body/views/menuProjectoCafe/MenuProjectoCafe.jsx',
    'body/views/newProjectPortal/NewProjectPortal.jsx',
    'body/views/panDomi/PanDomi.jsx',
    'body/views/portalEmpleados/PortalEmpleados.jsx',
    'body/views/staff/staffIngresarPropina.jsx',
    'body/views/staff/staffNomina.jsx',
    'body/views/wifiPortal/WifiPortal.jsx'
];

const srcPath = path.join(__dirname, 'src');
const logFile = path.join(__dirname, 'archivos_renombrados.log');

console.log('🔄 INICIANDO PROCESO DE RENOMBRADO SEGURO');
console.log(`📁 Total de archivos a procesar: ${orphanFiles.length}`);
console.log(`📝 Log se guardará en: ${logFile}\n`);

const logEntries = [];
let successCount = 0;
let errorCount = 0;

// Función para registrar acciones
function log(message) {
    console.log(message);
    logEntries.push(`${new Date().toISOString()}: ${message}`);
}

// Procesar cada archivo
orphanFiles.forEach((file, index) => {
    const originalPath = path.join(srcPath, file);
    const newPath = originalPath.replace(/\.jsx$/, '.archuerf');
    
    log(`\n📄 ${index + 1}/${orphanFiles.length}: ${file}`);
    
    try {
        // Verificar que el archivo existe
        if (!fs.existsSync(originalPath)) {
            log(`   ⚠️  ADVERTENCIA: Archivo no encontrado`);
            errorCount++;
            return;
        }
        
        // Verificar que el archivo destino no existe ya
        if (fs.existsSync(newPath)) {
            log(`   ⚠️  ADVERTENCIA: Ya existe ${newPath}`);
            errorCount++;
            return;
        }
        
        // Obtener información del archivo
        const stats = fs.statSync(originalPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        
        // Renombrar archivo
        fs.renameSync(originalPath, newPath);
        
        log(`   ✅ RENOMBRADO: ${path.basename(originalPath)} → ${path.basename(newPath)} (${sizeKB} KB)`);
        successCount++;
        
    } catch (error) {
        log(`   ❌ ERROR: ${error.message}`);
        errorCount++;
    }
});

// Resumen final
log(`\n=== RESUMEN FINAL ===`);
log(`✅ Archivos renombrados exitosamente: ${successCount}`);
log(`❌ Errores encontrados: ${errorCount}`);
log(`📊 Total procesados: ${successCount + errorCount}/${orphanFiles.length}`);

// Calcular espacio total procesado
const totalSize = orphanFiles.reduce((total, file) => {
    const newPath = path.join(srcPath, file).replace(/\.jsx$/, '.archuerf');
    try {
        if (fs.existsSync(newPath)) {
            const stats = fs.statSync(newPath);
            return total + stats.size;
        }
    } catch (error) {
        // Archivo no procesado
    }
    return total;
}, 0);

log(`💾 Espacio total procesado: ${(totalSize / 1024).toFixed(1)} KB`);

// Guardar log
fs.writeFileSync(logFile, logEntries.join('\n'), 'utf8');
log(`\n📝 Log completo guardado en: ${logFile}`);

// Generar comando para revertir si es necesario
if (successCount > 0) {
    const revertFile = path.join(__dirname, 'revert_renaming.bat');
    const revertCommands = [];
    
    orphanFiles.forEach(file => {
        const originalPath = path.join(srcPath, file);
        const newPath = originalPath.replace(/\.jsx$/, '.archuerf');
        
        if (fs.existsSync(newPath)) {
            revertCommands.push(`Rename-Item "${newPath}" "${path.basename(originalPath)}"`);
        }
    });
    
    if (revertCommands.length > 0) {
        const batchContent = `@echo off
echo Revirtiendo renombrado de archivos...
${revertCommands.join('\n')}
echo Proceso completado.
pause`;
        
        fs.writeFileSync(revertFile, batchContent, 'utf8');
        log(`\n🔄 Comando de reversión creado: ${revertFile}`);
        log(`   Para revertir cambios, ejecuta: .\\revert_renaming.bat`);
    }
}

log(`\n🎉 ¡Proceso completado!`);
log(`⚡ Los archivos ahora tienen extensión .archuerf y no serán importables`);
log(`🔒 Los archivos están seguros y pueden restaurarse si es necesario`);
