@echo off
chcp 65001 >nul
title Radio Broadcaster Pro - Proyecto Cafe [v3.0.0]
color 0B
cd /d "%~dp0"
cls
echo ==============================================================================
echo   RADIO BROADCASTER PRO - PROYECTO CAFE [v3.0.0]
echo   Multi-Fuente en Paralelo - Visualizador DJ y Sincronizacion Web Realtime
echo ==============================================================================
powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0radio_station.ps1"
:: No shutdown handling – script manages its own lifecycle
