@echo off
title Importar HTMLs de Exito
echo ========================================================
echo  Procesando paginas HTML guardadas en html_guardados\...
echo ========================================================
python "%~dp0import_exito_html.py"
echo.
echo ========================================================
echo  Proceso terminado!
echo ========================================================
pause
