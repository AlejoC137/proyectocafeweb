# ==============================================================================
# RADIO BROADCASTER - SUPABASE (POWERSHELL EDITION)
# ==============================================================================
# Proyecto Cafe: Sincronización Automática con RadioManager y Radio Web
# ==============================================================================

$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- CONFIGURACIÓN ---
$SUPABASE_URL     = "https://gmothqjjqvbxshvvlbrq.supabase.co"
$SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw"
$BUCKET_NAME      = "Radio"
$MUSIC_FOLDER     = "G:\Mi unidad\Radio"
$SHUFFLE_TRACKS   = $true  # $true: aleatorio | $false: orden alfabético
# ---------------------

# Función para obtener duración exacta del MP3
function Get-Mp3DurationSeconds($filePath) {
    try {
        $shell = New-Object -ComObject Shell.Application
        $folder = $shell.Namespace((Split-Path $filePath))
        $item = $folder.ParseName((Split-Path $filePath -Leaf))
        $rawDuration = $folder.GetDetailsOf($item, 27)
        if ($rawDuration -match '(\d{1,2}):(\d{2}):(\d{2})') {
            $ts = [timespan]::Parse($rawDuration)
            return [int]$ts.TotalSeconds
        }
        if ($rawDuration -match '(\d{1,2}):(\d{2})') {
            $parts = $rawDuration.Split(':')
            return ([int]$parts[0] * 60) + [int]$parts[1]
        }
    } catch {}

    # Fallback: Estimación a 128 kbps (16.000 bytes/seg)
    $fileSize = (Get-Item $filePath).Length
    $est = [int]($fileSize / 16000)
    if ($est -le 0) { return 180 }
    return $est
}

# Subir pista temporal al bucket de Storage
function Upload-Track($filePath, $remoteFilename) {
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$remoteFilename"
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Content-Type"  = "audio/mpeg"
        "x-upsert"      = "true"
    }

    try {
        Invoke-RestMethod -Uri $url -Method Post -Headers $headers -InFile $filePath | Out-Null
        Write-Host " [STORAGE] Pista subida con éxito a Supabase" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " [ERROR] Fallo al subir archivo: $_" -ForegroundColor Red
        return $false
    }
}

# Actualizar el estado para los oyentes y el panel RadioManager con codificación UTF-8 garantizada
function Update-Database($title, $remoteFilename, $duration) {
    $publicUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$remoteFilename"
    $isoNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    $headers = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Prefer"        = "resolution=merge-duplicates"
    }

    # 1. Actualizar radio_current_play (sincroniza en vivo /Radio y /RadioManager)
    $currentPlayObj = @{
        id             = 1
        tab            = "supabase"
        station_url    = $publicUrl
        station_name   = $title
        station_artist = "Radio En Vivo"
        station_cover  = ""
        is_playing     = $true
        updated_at     = $isoNow
    }
    $currentPlayJson = $currentPlayObj | ConvertTo-Json -Compress
    $currentPlayBytes = [System.Text.Encoding]::UTF8.GetBytes($currentPlayJson)

    try {
        $urlCurrent = "$SUPABASE_URL/rest/v1/radio_current_play?on_conflict=id"
        Invoke-RestMethod -Uri $urlCurrent -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body $currentPlayBytes | Out-Null
        Write-Host " [DB] Reproductor sincronizado en RadioManager y Radio Web" -ForegroundColor Cyan
    } catch {
        Write-Host " [AVISO] Error al actualizar radio_current_play: $_" -ForegroundColor DarkYellow
    }

    # 2. Actualizar radio_state si existe
    $stateObj = @{
        id               = 1
        title            = $title
        storage_path     = $remoteFilename
        public_url       = $publicUrl
        duration_seconds = $duration
        started_at       = $isoNow
        updated_at       = $isoNow
    }
    $stateJson = $stateObj | ConvertTo-Json -Compress
    $stateBytes = [System.Text.Encoding]::UTF8.GetBytes($stateJson)

    try {
        $urlState = "$SUPABASE_URL/rest/v1/radio_state?on_conflict=id"
        Invoke-RestMethod -Uri $urlState -Method Post -Headers $headers -ContentType "application/json; charset=utf-8" -Body $stateBytes | Out-Null
    } catch {}
}

# Borrar la pista anterior para no gastar espacio en la nube
function Delete-Track($remoteFilename) {
    if (-not $remoteFilename) { return }
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME"
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
    }

    $body = @{
        prefixes = @($remoteFilename)
    } | ConvertTo-Json -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    try {
        Invoke-RestMethod -Uri $url -Method Delete -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bodyBytes | Out-Null
        Write-Host " [STORAGE] Pista anterior eliminada (espacio ahorrado)" -ForegroundColor DarkGray
    } catch {
        Write-Host " [AVISO] No se pudo borrar de Storage: $_" -ForegroundColor DarkYellow
    }
}

# ==============================================================================
# BUCLE DE TRANSMISIÓN PRINCIPAL CON CONTROLES DE DJ EN VIVO
# ==============================================================================

Clear-Host
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host "    RADIO BROADCASTER EN VIVO - PROYECTO CAFE   " -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host "Servidor Supabase : $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "Bucket Storage    : $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "Carpeta Principal : $MUSIC_FOLDER`n" -ForegroundColor Cyan
Write-Host "----------------- CONTROLES DE TECLADO -----------------" -ForegroundColor DarkCyan
Write-Host "  [N] o [Enter] : Saltar a la siguiente canción" -ForegroundColor White
Write-Host "  [P] o [Espacio]: Pausar / Reanudar transmisión" -ForegroundColor White
Write-Host "  [Q]           : Salir limpiando la nube" -ForegroundColor White
Write-Host "--------------------------------------------------------`n" -ForegroundColor DarkCyan

$previousRemoteFilename = $null
$requestedFile = $null

while ($true) {
    if (-not (Test-Path $MUSIC_FOLDER)) {
        Write-Host "[ERROR] La ruta '$MUSIC_FOLDER' no está accesible. Esperando 10s..." -ForegroundColor Red
        Start-Sleep -Seconds 10
        continue
    }

    $files = Get-ChildItem -Path $MUSIC_FOLDER -Filter *.mp3 -Recurse

    if ($files.Count -eq 0) {
        Write-Host "[ESPERA] No se encontraron archivos MP3 en '$MUSIC_FOLDER'. Esperando 10s..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 10
        continue
    }

    if ($SHUFFLE_TRACKS) {
        $files = $files | Sort-Object { Get-Random }
    }

    Write-Host "[OK] Encontradas $($files.Count) canciones. Rotación continua activa...`n" -ForegroundColor Green

    $fileIndex = 0
    while ($fileIndex -lt $files.Count) {
        # Si hubo una petición desde la web, poner esa primero
        if ($requestedFile) {
            $file = $requestedFile
            $requestedFile = $null
        } else {
            $file = $files[$fileIndex]
            $fileIndex++
        }

        $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $remoteFilename = "live_$timestamp.mp3"
        $duration = Get-Mp3DurationSeconds $file.FullName

        $albumName = Split-Path (Split-Path $file.FullName) -Leaf
        $cleanTitle = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

        Write-Host "`n>>> [TRANSMITIENDO EN VIVO]" -ForegroundColor Magenta
        Write-Host "    Pista    : $cleanTitle" -ForegroundColor White
        Write-Host "    Álbum    : $albumName" -ForegroundColor Gray
        Write-Host "    Duración : $duration seg ($([math]::Round($duration/60, 2)) min)" -ForegroundColor Gray

        # 1. Subir la NUEVA pista primero (para que nunca haya corte de audio)
        $uploaded = Upload-Track -filePath $file.FullName -remoteFilename $remoteFilename
        if (-not $uploaded) {
            Start-Sleep -Seconds 3
            continue
        }

        # 2. Notificar a Supabase con la nueva URL
        Update-Database -title $cleanTitle -remoteFilename $remoteFilename -duration $duration

        # 3. Borrar la pista ANTERIOR (así el oyente no escucha silencio entre pistas)
        if ($previousRemoteFilename) {
            Delete-Track -remoteFilename $previousRemoteFilename
        }
        $previousRemoteFilename = $remoteFilename

        # 4. Transmisión continua con monitoreo de teclado y de peticiones web
        Write-Host "    [AIRE] Sonando continuo... [N] siguiente | [P] pausa | [Q] salir" -ForegroundColor Green
        
        $checkWebCounter = 0
        for ($sec = 0; $sec -lt $duration; $sec++) {
            # Comprobar teclado local
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true)
                if ($key.Key -eq [ConsoleKey]::N -or $key.Key -eq [ConsoleKey]::Enter) {
                    Write-Host "`n    [DJ] >> Saltando a la siguiente pista inmediatamente..." -ForegroundColor Yellow
                    break
                }
                elseif ($key.Key -eq [ConsoleKey]::P -or $key.Key -eq [ConsoleKey]::Spacebar) {
                    Write-Host "`n    [PAUSA] Transmisión en pausa. Pulsa cualquier tecla para reanudar..." -ForegroundColor Yellow
                    [Console]::ReadKey($true) | Out-Null
                    Write-Host "    [REANUDADO] Continuando transmisión..." -ForegroundColor Green
                }
                elseif ($key.Key -eq [ConsoleKey]::Q) {
                    Write-Host "`n    [SALIENDO] Cerrando estación de radio..." -ForegroundColor Red
                    Delete-Track -remoteFilename $remoteFilename
                    exit
                }
            }

            # Comprobar si desde la web pidieron una canción cada 3 segundos
            $checkWebCounter++
            if ($checkWebCounter -ge 3) {
                $checkWebCounter = 0
                try {
                    $headersCheck = @{ "Authorization" = "Bearer $SUPABASE_API_KEY"; "apikey" = "$SUPABASE_API_KEY" }
                    $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist&id=eq.1"
                    $currentRemote = Invoke-RestMethod -Uri $checkUrl -Headers $headersCheck
                    if ($currentRemote.station_artist -like "REQUEST:*") {
                        $reqTitle = $currentRemote.station_artist.Substring(8).Trim()
                        Write-Host "`n>>> [PETICIÓN DESDE LA WEB] Petición recibida: $reqTitle" -ForegroundColor Yellow
                        $matched = $files | Where-Object { 
                            $cName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                            $cName -like "*$reqTitle*" -or $reqTitle -like "*$cName*"
                        } | Select-Object -First 1
                        if ($matched) {
                            Write-Host "    [DJ] Cambiando a pista pedida: $($matched.Name)" -ForegroundColor Cyan
                            $requestedFile = $matched
                            break
                        }
                    }
                } catch {}
            }

            Start-Sleep -Seconds 1
        }
    }
}
