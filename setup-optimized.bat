@echo off
echo.
echo ========================================
echo   PROYECTO CAFE WEB - VERSION OPTIMIZADA
echo ========================================
echo.

echo 📦 Instalando dependencias...
call npm install

echo.
echo ✅ Dependencias instaladas correctamente!
echo.

echo 🔧 Verificando configuración...
if exist .env (
    echo ✅ Archivo .env encontrado
) else (
    echo ❌ Archivo .env no encontrado
    echo.
    echo 📝 Creando archivo .env de ejemplo...
    echo VITE_SUPABASE_URL=tu_url_de_supabase > .env.example
    echo VITE_SUPABASE_ANON_KEY=tu_clave_anonima >> .env.example
    echo.
    echo ⚠️  Por favor configura tu archivo .env con las credenciales de Supabase
    echo    Puedes usar .env.example como referencia
    echo.
)

echo.
echo 🚀 Para iniciar el proyecto ejecuta:
echo    npm run dev
echo.
echo 📖 Para ver las mejoras aplicadas:
echo    Revisa MEJORAS-APLICADAS.md
echo.

pause
