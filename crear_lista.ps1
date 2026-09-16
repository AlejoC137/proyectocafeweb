# ==============================================================================
# CREADOR Y SINCRONIZADOR DE LISTAS DE RADIO DESDE POWERSHELL
# ==============================================================================
# Proyecto Cafe: Sincroniza álbumes y pistas hacia Supabase (playlist_radio)
# ==============================================================================

param (
    [string]$Carpeta = "G:\Mi unidad\Radio",
    [string]$ArtistaPorDefecto = "Alcolirykoz",
    [switch]$LimpiarListaPrevia
)

$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$SUPABASE_URL     = "https://gmothqjjqvbxshvvlbrq.supabase.co"
$SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw"

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "      CREADOR DE PLAYLISTS DE RADIO (POWERSHELL)          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Escaneando carpeta: $Carpeta`n" -ForegroundColor Cyan

if (-not (Test-Path $Carpeta)) {
    Write-Host "[ERROR] La carpeta '$Carpeta' no existe o no es accesible." -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $SUPABASE_API_KEY"
    "apikey"        = "$SUPABASE_API_KEY"
    "Prefer"        = "resolution=merge-duplicates"
}

# Opción de limpiar lista previa
if ($LimpiarListaPrevia) {
    Write-Host "[LIMPIEZA] Eliminando lista de canciones anterior..." -ForegroundColor DarkYellow
    try {
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/playlist_radio?id=gte.0" -Method Delete -Headers $headers | Out-Null
        Write-Host "[LIMPIEZA] Lista anterior vaciada." -ForegroundColor Gray
    } catch {
        Write-Host "[AVISO] No se pudo vaciar la lista previa: $_" -ForegroundColor DarkYellow
    }
}

# Obtener archivos MP3 recursivamente
$files = Get-ChildItem -Path $Carpeta -Filter *.mp3 -Recurse

if ($files.Count -eq 0) {
    Write-Host "[AVISO] No se encontraron archivos MP3 en '$Carpeta'." -ForegroundColor Red
    exit
}

Write-Host "Encontrados $($files.Count) archivos MP3. Sincronizando con Supabase...`n" -ForegroundColor Green

$shell = New-Object -ComObject Shell.Application
$orderIndex = 1
$agregados = 0

foreach ($file in $files) {
    # 1. Obtener Álbum (nombre de la subcarpeta que lo contiene)
    $parentDir = Split-Path $file.FullName -Parent
    $albumName = Split-Path $parentDir -Leaf
    if ($albumName -eq "Radio") { $albumName = "General" }

    # 2. Obtener Título limpio
    $cleanTitle = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

    # 3. Intentar extraer Artista y Título si vienen separados por ' - '
    $artist = $ArtistaPorDefecto
    $parts = $cleanTitle -split ' - '
    if ($parts.Count -ge 3) {
        $artist = $parts[1].Trim()
    } elseif ($parts.Count -ge 2) {
        $artist = $parts[0].Trim()
    }

    # 4. Obtener duración en segundos
    $duration = 180
    try {
        $fFolder = $shell.Namespace($file.DirectoryName)
        $fItem = $fFolder.ParseName($file.Name)
        $rawDuration = $fFolder.GetDetailsOf($fItem, 27)
        if ($rawDuration -match '(\d{1,2}):(\d{2}):(\d{2})') {
            $ts = [timespan]::Parse($rawDuration)
            $duration = [int]$ts.TotalSeconds
        } elseif ($rawDuration -match '(\d{1,2}):(\d{2})') {
            $sp = $rawDuration.Split(':')
            $duration = ([int]$sp[0] * 60) + [int]$sp[1]
        } else {
            $duration = [int]($file.Length / 16000)
        }
    } catch {
        $duration = [int]($file.Length / 16000)
    }
    if ($duration -le 0) { $duration = 180 }

    # 5. Armar objeto para Supabase playlist_radio
    $songObj = @{
        title       = $cleanTitle
        artist      = $artist
        album       = $albumName
        duration    = $duration
        order_index = $orderIndex
        url         = "" # Se transmite en vivo por radio_station
    }
    $orderIndex++

    $json = $songObj | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

    try {
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/playlist_radio" -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bytes | Out-Null
        Write-Host " [OK] #$($orderIndex - 1) : $cleanTitle [$albumName]" -ForegroundColor Cyan
        $agregados++
    } catch {
        Write-Host " [ERROR] Fallo al registrar $cleanTitle : $_" -ForegroundColor Red
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  ¡LISTA SINCRONIZADA CON ÉXITO! Total: $agregados canciones" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Abre o recarga tu página: http://localhost:5173/ProyectoRadio" -ForegroundColor White
Write-Host "Las canciones ya aparecen en el selector de la emisora." -ForegroundColor White
