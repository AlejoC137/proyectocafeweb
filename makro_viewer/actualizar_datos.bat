@echo off
title Actualizar Catalogo Makro
echo ========================================================
echo  Extrayendo productos de Makro (Navidad en Makro...)
echo ========================================================
python "%~dp0export_makro.py"
echo.
echo ========================================================
echo  Completado exitosamente!
echo ========================================================
pause
