const fs = require('fs');
const path = require('path');

// Lista de archivos importados directamente por App.jsx
const directImports = [
    './body/views/home/Home.jsx',
    './body/views/menuView/MenuView.jsx',
    './body/views/menuView/MenuLunch.jsx',
    './body/views/lunchByOrder/LunchByOrder.jsx',
    './body/views/actualizarPrecioUnitario/AccionesRapidas.jsx',
    './body/views/buscarPreciosInternet/BuscarPreciosInternet.jsx',
    './body/views/home/LandingHome.jsx',
    './body/views/agenda/Agenda.jsx',
    './body/views/sobreNosotros/SobreNosotros.jsx',
    './body/views/inventario/Inventario.jsx',
    './body/views/inventario/Manager.jsx',
    './body/views/ventaCompra/VentaCompra.jsx',
    './body/views/actividades/Actividades.jsx',
    './body/views/ventaCompra/MesResumen.jsx',
    './body/views/ventaCompra/DiaResumen.jsx',
    './body/views/ventaCompra/RecetaModal.jsx',
    './body/views/ventaCompra/Predict.jsx',
    './body/components/gastos/Gastos.jsx',
    './body/views/proveedores/Proveedores.jsx',
    './body/components/Menu/MenuPrint.jsx',
    './body/views/staff/staffPortal.jsx',
    './body/views/staff/CalculoNomina.jsx'
];

// Función para extraer imports de un archivo
function extractImports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            // Solo nos interesan los imports relativos que apuntan a archivos en body/
            if (importPath.includes('./') || importPath.includes('../')) {
                imports.push(importPath);
            }
        }
        return imports;
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return [];
    }
}

// Función para resolver rutas relativas
function resolvePath(basePath, relativePath) {
    const baseDir = path.dirname(basePath);
    const resolved = path.resolve(baseDir, relativePath);
    
    // Intentar con diferentes extensiones si no existe
    const extensions = ['.jsx', '.js', '.ts', '.tsx'];
    
    for (const ext of extensions) {
        const withExt = resolved.endsWith(ext) ? resolved : resolved + ext;
        if (fs.existsSync(withExt)) {
            return withExt;
        }
    }
    
    // Si es un directorio, buscar index
    for (const ext of extensions) {
        const indexFile = path.join(resolved, `index${ext}`);
        if (fs.existsSync(indexFile)) {
            return indexFile;
        }
    }
    
    return null;
}

// Función recursiva para encontrar todas las dependencias
function findAllDependencies(filePath, visited = new Set(), depth = 0) {
    if (depth > 10) return []; // Prevenir recursión infinita
    if (visited.has(filePath)) return [];
    
    visited.add(filePath);
    const dependencies = [];
    
    const imports = extractImports(filePath);
    
    for (const importPath of imports) {
        const resolvedPath = resolvePath(filePath, importPath);
        if (resolvedPath && resolvedPath.includes('src\\body')) {
            dependencies.push(resolvedPath);
            // Recursivamente encontrar dependencias de este archivo
            const nestedDeps = findAllDependencies(resolvedPath, visited, depth + 1);
            dependencies.push(...nestedDeps);
        }
    }
    
    return dependencies;
}

// Convertir paths relativos a absolutos
const srcPath = path.join(__dirname, 'src');
const absoluteImports = directImports.map(imp => {
    const cleanPath = imp.replace('./', '');
    return path.join(srcPath, cleanPath);
});

// Encontrar todas las dependencias
const allUsedFiles = new Set();

// Agregar imports directos
absoluteImports.forEach(file => {
    if (fs.existsSync(file)) {
        allUsedFiles.add(file);
        console.log(`Processing: ${file}`);
        
        // Encontrar dependencias transitivas
        const deps = findAllDependencies(file);
        deps.forEach(dep => allUsedFiles.add(dep));
    } else {
        console.log(`File not found: ${file}`);
    }
});

console.log('\n=== ARCHIVOS UTILIZADOS ===');
const sortedUsedFiles = Array.from(allUsedFiles).sort();
sortedUsedFiles.forEach(file => {
    const relativePath = path.relative(srcPath, file).replace(/\\/g, '/');
    console.log(relativePath);
});

console.log(`\nTotal archivos utilizados: ${allUsedFiles.size}`);
