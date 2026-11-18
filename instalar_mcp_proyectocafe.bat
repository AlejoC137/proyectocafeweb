@echo off
chcp 65001 >nul
setlocal

echo.
echo Iniciando instalador MCP de Proyecto Cafe...
echo.

where node >nul 2>&1
if errorlevel 1 goto :no_node

node "%~dp0scripts\install-mcp.mjs"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" echo Instalacion completada con exito.
if not "%EXIT_CODE%"=="0" echo La instalacion termino con errores ^(codigo %EXIT_CODE%^).

if /I "%~1"=="--no-pause" goto :done
pause
:done
exit /b %EXIT_CODE%

:no_node
echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH.
echo Descargalo desde https://nodejs.org/ e intentalo nuevamente.
if /I not "%~1"=="--no-pause" pause
exit /b 1
