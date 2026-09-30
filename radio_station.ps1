# ==============================================================================
# RADIO BROADCASTER PRO - PROYECTO CAFE (EDICION SUPABASE HIGH-FIDELITY v3.0.0)
# ==============================================================================
# - Multi-Carpeta en Paralelo: Escanea y unifica multiples fuentes locales de audio.
# - Interactivo & Configurable: Permite agregar carpetas dinamicamente o auto-iniciar en 3s.
# - Visualizador DJ en Consola: Ecualizador animado, barra de progreso y estado ON AIR.
# - Sincronizacion Web Realtime: Responde a peticiones instantaneas desde Radio Manager.
# ==============================================================================

$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- CONFIGURACION DE CONEXION SUPABASE ---
$SUPABASE_URL     = "https://gmothqjjqvbxshvvlbrq.supabase.co"
$SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw"
$BUCKET_NAME      = "Radio"
$CONFIG_FILE      = Join-Path $PSScriptRoot "carpetas_musica.txt"
$WEB_REPO_CATALOG = "C:\Users\Alejandro\Documents\GitHub\proyectocafeweb\src\data\localMusicCatalog.json"
$WEB_PUBLIC_CATALOG = "C:\Users\Alejandro\Documents\GitHub\proyectocafeweb\public\catalog.json"
# ------------------------------------------

$headers = @{
    "Authorization" = "Bearer $SUPABASE_API_KEY"
    "apikey"        = "$SUPABASE_API_KEY"
    "Content-Type"  = "application/json; charset=utf-8"
}

# --- GESTION DE MULTIPLES CARPETAS (MULTI-FUENTE EN PARALELO) ---
function Get-ConfiguredFolders {
    $folders = [System.Collections.Generic.List[string]]::new()
    
    # 1. Carpeta por defecto del script
    $defaultMusica = Join-Path $PSScriptRoot "musica"
    if (Test-Path $defaultMusica) { $folders.Add($defaultMusica) }
    $folders.Add($PSScriptRoot)

    # 2. Leer archivo de configuracion carpetas_musica.txt si existe
    if (Test-Path $CONFIG_FILE) {
        $lines = Get-Content $CONFIG_FILE | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith("#") }
        foreach ($line in $lines) {
            if ((Test-Path $line) -and (-not $folders.Contains($line))) {
                $folders.Add($line)
            }
        }
    } else {
        $template = "# CONFIGURACION DE CARPETAS`r`nG:\Mi unidad\Radio\musica`r`nG:\Mi unidad\Radio"
        try { [System.IO.File]::WriteAllText($CONFIG_FILE, $template, [System.Text.Encoding]::UTF8) } catch {}
    }
    return $folders
}

# Obtener duracion exacta de archivo MP3
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

    $fileSize = (Get-Item $filePath).Length
    $est = [int]($fileSize / 16000)
    if ($est -le 0) { return 180 }
    return $est
}

# Subir archivo al bucket de Supabase Storage
function Upload-Track($filePath, $remoteFilename) {
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$remoteFilename"
    $headersUpload = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Content-Type"  = "audio/mpeg"
        "x-upsert"      = "true"
    }

    try {
        Invoke-RestMethod -Uri $url -Method Post -Headers $headersUpload -InFile $filePath | Out-Null
        return $true
    } catch {
        Write-Host " [ERROR] Fallo subida a Storage: $_" -ForegroundColor Red
        return $false
    }
}

# Borrar pista anterior para optimizar espacio en Supabase
function Delete-Track($remoteFilename) {
    if (-not $remoteFilename) { return }
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME"
    $headersDel = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
    }
    $body = @{ prefixes = @($remoteFilename) } | ConvertTo-Json -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    try {
        Invoke-RestMethod -Uri $url -Method Delete -Headers $headersDel -ContentType "application/json; charset=utf-8" -Body $bodyBytes | Out-Null
    } catch {}
}

# Notificar estado en radio_current_play
function Update-CurrentPlay($title, $artist, $cover, $publicUrl, $isPlaying = $true) {
    $isoNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $headersSync = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Prefer"        = "resolution=merge-duplicates"
    }
    $payload = @{
        id             = 1
        tab            = "supabase"
        station_url    = $publicUrl
        station_name   = $title
        station_artist = $artist
        station_cover  = $cover
        is_playing     = $isPlaying
        updated_at     = $isoNow
    } | ConvertTo-Json -Compress
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

    try {
        $urlCurrent = "$SUPABASE_URL/rest/v1/radio_current_play?on_conflict=id"
        Invoke-RestMethod -Uri $urlCurrent -Method Post -Headers $headersSync -ContentType "application/json; charset=utf-8" -Body $payloadBytes | Out-Null
    } catch {
        Write-Host " [AVISO] Error al sincronizar radio_current_play: $_" -ForegroundColor DarkYellow
    }
}

# Normalizar texto para comparacion flexible
function Normalize-Text($text) {
    if (-not $text) { return "" }
    $clean = $text.ToLower().Trim()
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "[^a-z0-9]", "")
    return $clean
}

# Emparejar canciones de la cola con archivos locales en todas las fuentes
function Match-TracksToLocalFiles($dbList, $localFilesList) {
    $matched = [System.Collections.Generic.List[PSObject]]::new()
    foreach ($dbSong in $dbList) {
        $dbTitle = $dbSong.title
        $dbNorm = Normalize-Text $dbTitle
        $url = $dbSong.url

        $foundFile = $null

        # Coincidencia por protocolo local://
        if ($url -and $url.StartsWith("local://")) {
            $rawName = [System.Uri]::UnescapeDataString($url.Substring(8))
            $foundFile = $localFilesList | Where-Object { $_.Name -eq $rawName } | Select-Object -First 1
        }

        # Coincidencia por nombre normalizado
        if (-not $foundFile) {
            $foundFile = $localFilesList | Where-Object {
                $fileClean = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                $fileNorm = Normalize-Text $fileClean
                ($fileNorm -eq $dbNorm) -or ($fileNorm -like "*$dbNorm*") -or ($dbNorm -like "*$fileNorm*")
            } | Select-Object -First 1
        }

        if ($foundFile) {
            $matched.Add([PSCustomObject]@{
                id          = $dbSong.id
                title       = $dbSong.title
                artist      = if ($dbSong.artist) { $dbSong.artist } else { "Radio Cafe" }
                album       = if ($dbSong.album) { $dbSong.album } else { "Radio Cafe" }
                cover       = if ($dbSong.cover) { $dbSong.cover } else { "" }
                filePath    = $foundFile.FullName
                order_index = $dbSong.order_index
            })
        } elseif ($url -and $url.StartsWith("http")) {
            $matched.Add([PSCustomObject]@{
                id          = $dbSong.id
                title       = $dbSong.title
                artist      = if ($dbSong.artist) { $dbSong.artist } else { "Radio En Vivo" }
                album       = if ($dbSong.album) { $dbSong.album } else { "Radio Cafe" }
                cover       = if ($dbSong.cover) { $dbSong.cover } else { "" }
                filePath    = $null
                remoteUrl   = $url
                order_index = $dbSong.order_index
            })
        }
    }
    return $matched
}

# ==============================================================================
# ESCANEO COMPLETO MULTI-CARPETA Y GENERACION DE CATALOGO UNIFICADO
# ==============================================================================
function Build-And-Upload-MultiCatalog($folderList, $reqHeaders, $supabaseEndpoint) {
    Write-Host ">>> Escaneando biblioteca multi-carpeta en paralelo..." -ForegroundColor Cyan
    $seenFolders = [System.Collections.Generic.HashSet[string]]::new()
    $albumsDirs = [System.Collections.Generic.List[System.IO.DirectoryInfo]]::new()

    foreach ($folder in $folderList) {
        if (-not (Test-Path $folder)) { continue }
        Write-Host "    [Fuente] $folder" -ForegroundColor DarkGray
        $subDirs = @(Get-ChildItem -Path $folder -Directory)
        foreach ($d in $subDirs) {
            if (-not $seenFolders.Contains($d.Name.ToLower())) {
                $seenFolders.Add($d.Name.ToLower()) | Out-Null
                $albumsDirs.Add($d)
            }
        }
    }

    $catalogList = [System.Collections.Generic.List[PSObject]]::new()
    $albumId = 1
    $totalSongsCount = 0

    foreach ($alb in ($albumsDirs | Sort-Object Name)) {
        $mp3Files = @(Get-ChildItem -Path $alb.FullName -Filter *.mp3 | Sort-Object Name)
        if ($mp3Files.Count -eq 0) { continue }

        $albumParts = $alb.Name -split ' - ', 2
        $albumArtist = if ($albumParts.Count -ge 1) { $albumParts[0].Trim() } else { "Varios Artistas" }
        $albumTitle  = if ($albumParts.Count -ge 2) { $albumParts[1].Trim() } else { $alb.Name }

        # Buscar imagen de caratula local
        $coverFiles = @(Get-ChildItem -Path $alb.FullName -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' })
        $albumCoverUrl = ""
        if ($coverFiles.Count -gt 0) {
            $preferredCover = $coverFiles | Where-Object { $_.BaseName -match '^(cover|folder|front|album|portada)$' } | Select-Object -First 1
            if (-not $preferredCover) { $preferredCover = $coverFiles[0] }
            $albumCoverUrl = "/api/local-audio?path=" + [System.Uri]::EscapeDataString($preferredCover.FullName)
        }

        $trackList = [System.Collections.Generic.List[PSObject]]::new()
        $idx = 0

        foreach ($f in $mp3Files) {
            $cName = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
            $clean = [System.Text.RegularExpressions.Regex]::Replace($cName, "^\d+[\s\-_.]*", "")
            $songArtist = $albumArtist
            $songTitle  = $clean
            if ($clean -like "* - *") {
                $p = $clean -split ' - ', 2
                $songArtist = $p[0].Trim()
                $songTitle  = $p[1].Trim()
            }

            $dur = Get-Mp3DurationSeconds $f.FullName
            $trackList.Add(@{
                id          = ($albumId * 100) + $idx + 1
                fileName    = $f.Name
                title       = $songTitle
                artist      = $songArtist
                album       = $albumTitle
                duration    = $dur
                cover       = $albumCoverUrl
                order_index = $idx
                filePath    = $f.FullName
            })
            $idx++
            $totalSongsCount++
        }

        $catalogList.Add(@{
            id         = $albumId
            folderName = $alb.Name
            albumName  = $albumTitle
            artist     = $albumArtist
            cover      = $albumCoverUrl
            trackCount = $trackList.Count
            tracks     = $trackList
        })
        $albumId++
    }

    $jsonCatalog = $catalogList | ConvertTo-Json -Depth 5 -Compress
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonCatalog)

    # 1. Guardar localmente en el script root
    try {
        $localCatalog = Join-Path $PSScriptRoot "catalog.json"
        [System.IO.File]::WriteAllText($localCatalog, $jsonCatalog, [System.Text.Encoding]::UTF8)
        Write-Host " [OK] Catalogo local actualizado: $($catalogList.Count) albumes, $totalSongsCount canciones." -ForegroundColor Green
    } catch {}

    # 2. Copiar automaticamente al repositorio git de Proyecto Cafe
    if (Test-Path (Split-Path $WEB_REPO_CATALOG)) {
        try {
            [System.IO.File]::WriteAllText($WEB_REPO_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8)
            Write-Host " [OK] Sincronizado con proyecto web: src\data\localMusicCatalog.json" -ForegroundColor Green
        } catch {}
    }
    if (Test-Path (Split-Path $WEB_PUBLIC_CATALOG)) {
        try {
            [System.IO.File]::WriteAllText($WEB_PUBLIC_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8)
            Write-Host " [OK] Sincronizado con proyecto web: public\catalog.json" -ForegroundColor Green
        } catch {}
    }

    # 3. Subir a Supabase Storage como respaldo en la nube
    try {
        $urlStorage = "$supabaseEndpoint/storage/v1/object/Radio/catalog.json"
        $headersUpload = @{
            "Authorization" = $reqHeaders["Authorization"]
            "apikey"        = $reqHeaders["apikey"]
            "Content-Type"  = "application/json"
            "x-upsert"      = "true"
        }
        Invoke-RestMethod -Uri $urlStorage -Method Post -Headers $headersUpload -Body $jsonBytes | Out-Null
        Write-Host " [OK] Catalogo sincronizado en Supabase Storage (Nube)." -ForegroundColor Green
    } catch {
        Write-Host " [INFO] Fallback local activo." -ForegroundColor DarkCyan
    }

    return $catalogList
}

# ==============================================================================
# DASHBOARD VISUAL Y MENU INTERACTIVO
# ==============================================================================
function Show-DashboardHeader($version, $configuredFolders, $catalogCount, $songCount) {
    Clear-Host
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "=              [*] RADIO BROADCASTER PRO - PROYECTO CAFE                        =" -ForegroundColor Cyan
    Write-Host "=              Version $version                                            =" -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "  📡 Servidor Supabase   : $SUPABASE_URL" -ForegroundColor DarkGray
    Write-Host "  📁 Fuentes de Musica   : $($configuredFolders.Count) carpetas configuradas" -ForegroundColor DarkGray
    Write-Host "  💿 Biblioteca Indexada : $catalogCount albumes ($songCount canciones)" -ForegroundColor DarkGray
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
}

# ==============================================================================
# INICIO Y DETECCION
# ==============================================================================
$VERSION = "v3.0.0 [Multi-Folder Parallel & Dynamic Visualizer]"
$folders = Get-ConfiguredFolders

# Cargar o generar catalogo
$fullCatalog = Build-And-Upload-MultiCatalog -folderList $folders -reqHeaders $headers -supabaseEndpoint $SUPABASE_URL
$totalSongs = ($fullCatalog | Measure-Object -Property trackCount -Sum).Sum

# Escanear todos los archivos MP3 de todas las fuentes
$allLocalFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($f in $folders) {
    if (Test-Path $f) {
        $files = @(Get-ChildItem -Path $f -Filter *.mp3 -Recurse -File)
        foreach ($item in $files) { $allLocalFiles.Add($item) }
    }
}

Show-DashboardHeader -version $VERSION -configuredFolders $folders -catalogCount $fullCatalog.Count -songCount $totalSongs

# Notificar que la estacion esta conectada y lista (Heartbeat inicial)
Update-CurrentPlay -title "Estacion Lista" -artist "BAT_ONLINE" -cover "" -publicUrl "" -isPlaying $false

# ==============================================================================
# BUCLE MAESTRO DE EMISION AL AIRE
# ==============================================================================
$previousRemoteFilename = $null
$remoteFilename = $null
$requestedTrack = $null

$vuFrames = @(" ▂▃▅▆▇▆▅▃ ", "▂▃▅▆▇#▇▆▅", "▃▅▆▇#▇▆▅▃", "▅▆▇#▇▆▅▃▂", "▆▇#▇▆▅▃▂ ", "▇#▇▆▅▃▂ ▂", "#▇▆▅▃▂ ▂▃", "▇▆▅▃▂ ▂▃▅")
$vuIndex = 0

try {
    while ($true) {
        # Consultar cola activa de Supabase
        $dbTracks = @()
        try {
            $dbTracks = @(Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/playlist_radio?select=*&order=order_index.asc" -Method Get -Headers $headers)
        } catch {}

        $matchedTracks = Match-TracksToLocalFiles -dbList $dbTracks -localFilesList $allLocalFiles

        if ($matchedTracks.Count -eq 0) {
            Write-Host "`r [ESPERANDO COLA] Esperando canciones desde Radio Manager (Web)... " -NoNewline -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            Update-CurrentPlay -title "Estacion Lista" -artist "BAT_ONLINE" -cover "" -publicUrl "" -isPlaying $false

            # Comprobar comandos remotos
            try {
                $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist,station_name&id=eq.1"
                $currentRemote = Invoke-RestMethod -Uri $checkUrl -Headers $headers
                if ($currentRemote.station_artist -like "REQUEST:*") {
                    $reqTitle = $currentRemote.station_artist.Substring(8).Trim()
                    $matchedReq = $allLocalFiles | Where-Object {
                        $fClean = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                        $fClean -like "*$reqTitle*" -or (Normalize-Text $fClean) -eq (Normalize-Text $reqTitle)
                    } | Select-Object -First 1

                    if ($matchedReq) {
                        $requestedTrack = [PSCustomObject]@{
                            id          = 999
                            title       = $reqTitle
                            artist      = "Radio Cafe"
                            album       = "Sencillo"
                            cover       = ""
                            filePath    = $matchedReq.FullName
                            order_index = 0
                        }
                    }
                }
            } catch {}
            continue
        }

        $trackIndex = 0

        while ($trackIndex -lt $matchedTracks.Count) {
            # Si hubo una peticion instantanea (Rocola DJ / Clic en Radio Manager)
            if ($requestedTrack) {
                $currentTrack = $requestedTrack
                $requestedTrack = $null
            } else {
                $currentTrack = $matchedTracks[$trackIndex]
                $trackIndex++
            }

            $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            $remoteFilename = "live_stream.mp3"
            $duration = 180

            if ($currentTrack.filePath -and (Test-Path $currentTrack.filePath)) {
                $duration = Get-Mp3DurationSeconds $currentTrack.filePath

                Write-Host "`n===============================================================================" -ForegroundColor Cyan
                Write-Host "= [ON AIR] TRANSMITIENDO AL AIRE [Pista $trackIndex/$($matchedTracks.Count)]" -ForegroundColor Red
                Write-Host "= Cancion  : $($currentTrack.title)" -ForegroundColor Yellow
                Write-Host "= Artista  : $($currentTrack.artist)" -ForegroundColor White
                Write-Host "= Album    : $($currentTrack.album)" -ForegroundColor DarkCyan
                Write-Host "= Duracion : $duration s ($([math]::Round($duration/60, 2)) min)" -ForegroundColor DarkGray
                Write-Host "===============================================================================" -ForegroundColor Cyan

                # 1. Subir a Supabase Storage sobreescribiendo live_stream.mp3 (Uso minimo de almacenamiento)
                $uploaded = Upload-Track -filePath $currentTrack.filePath -remoteFilename $remoteFilename
                if (-not $uploaded) {
                    Start-Sleep -Seconds 2
                    continue
                }
                $publicUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$remoteFilename?t=$timestamp"
            } else {
                $publicUrl = $currentTrack.remoteUrl
                Write-Host "`n>>> [EMITIENDO REMOTO] $($currentTrack.title)" -ForegroundColor Yellow
            }

            # 2. Notificar a Supabase radio_current_play
            Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true

            Write-Host "  Controles: [N] Siguiente | [P] Pausar | [R] Refrescar Cola | [Q] Salir`n" -ForegroundColor DarkGray

            # 4. Monitoreo segundo a segundo con Visualizador DJ
            $checkWebCounter = 0
            for ($sec = 0; $sec -lt $duration; $sec++) {
                # Visualizador DJ y Barra de Progreso
                $pct = [math]::Round(($sec / $duration) * 100)
                $barsCount = [int]($pct / 5)
                $progressStr = ("#" * $barsCount) + ("-" * (20 - $barsCount))
                $vu = $vuFrames[$vuIndex % $vuFrames.Count]
                $vuIndex++

                $elapsedMin = [math]::Floor($sec / 60)
                $elapsedSec = $sec % 60
                $totalMin = [math]::Floor($duration / 60)
                $totalSec = $duration % 60
                $timeFormatted = "{0:D2}:{1:D2} / {2:D2}:{3:D2}" -f $elapsedMin, $elapsedSec, $totalMin, $totalSec

                Write-Host -NoNewline "`r  $vu [ON AIR] [$progressStr] $pct% ($timeFormatted) "

                # Teclado local
                if ([Console]::KeyAvailable) {
                    $key = [Console]::ReadKey($true)
                    if ($key.Key -eq [ConsoleKey]::N -or $key.Key -eq [ConsoleKey]::Enter) {
                        Write-Host "`n  [DJ] >> Saltando a siguiente cancion..." -ForegroundColor Yellow
                        break
                    }
                    elseif ($key.Key -eq [ConsoleKey]::P -or $key.Key -eq [ConsoleKey]::Spacebar) {
                        Write-Host "`n  [PAUSA] Transmision en pausa. Pulsa cualquier tecla para reanudar..." -ForegroundColor Yellow
                        [Console]::ReadKey($true) | Out-Null
                        Write-Host "  [REANUDADO] Continuando emision..." -ForegroundColor Green
                    }
                    elseif ($key.Key -eq [ConsoleKey]::R) {
                        Write-Host "`n  [DJ] Refrescando cola desde Radio Manager..." -ForegroundColor Cyan
                        try {
                            $refreshed = @(Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/playlist_radio?select=*&order=order_index.asc" -Method Get -Headers $headers)
                            if ($refreshed.Count -gt 0) {
                                $matchedTracks = Match-TracksToLocalFiles -dbList $refreshed -localFilesList $allLocalFiles
                                Write-Host "  [OK] Cola actualizada con $($matchedTracks.Count) pistas." -ForegroundColor Green
                            }
                        } catch {}
                    }
                    elseif ($key.Key -eq [ConsoleKey]::Q) {
                        Write-Host "`n  [SALIENDO] Cerrando transmision de radio..." -ForegroundColor Red
                        exit
                    }
                }

                # Monitorear senales desde Radio Manager cada 2 segundos
                $checkWebCounter++
                if ($checkWebCounter -ge 2) {
                    $checkWebCounter = 0
                    try {
                        $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist,station_name,is_playing&id=eq.1"
                        $currentRemote = Invoke-RestMethod -Uri $checkUrl -Headers $headers

                        # 1. Peticion instantanea desde Radio Manager (clic en cualquier cancion)
                        if ($currentRemote.station_artist -like "REQUEST:*") {
                            $reqTitle = $currentRemote.station_artist.Substring(8).Trim()
                            Write-Host "`n>>> [PETICION WEB] Cambio solicitado: $reqTitle" -ForegroundColor Magenta
                            
                            $matchedReq = $allLocalFiles | Where-Object {
                                $fClean = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                $fClean -like "*$reqTitle*" -or (Normalize-Text $fClean) -eq (Normalize-Text $reqTitle)
                            } | Select-Object -First 1

                            if ($matchedReq) {
                                $requestedTrack = [PSCustomObject]@{
                                    id          = 999
                                    title       = $reqTitle
                                    artist      = $currentRemote.station_name
                                    album       = "Sencillo"
                                    cover       = ""
                                    filePath    = $matchedReq.FullName
                                    order_index = 0
                                }
                                break
                            }
                        }
                        # 2. Siguiente cancion (NEXT)
                        elseif ($currentRemote.station_artist -eq "NEXT_TRACK" -or $currentRemote.station_name -eq "NEXT_TRACK") {
                            Write-Host "`n>>> [RADIO MANAGER] Salto a siguiente pista recibido!" -ForegroundColor Cyan
                            break
                        }
                        # 3. Pausa remota
                        elseif ($currentRemote.station_artist -eq "PAUSE_BROADCAST" -or $currentRemote.station_artist -eq "ON_AIR:OFF" -or ($currentRemote.is_playing -eq $false -and $currentRemote.station_artist -ne "BAT_ONLINE")) {
                            Write-Host "`n>>> [RADIO MANAGER] Switch ON AIR apagado o en pausa..." -ForegroundColor Yellow
                            Update-CurrentPlay -title $currentTrack.title -artist "PAUSED" -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $false
                            while ($true) {
                                Start-Sleep -Seconds 1
                                try {
                                    $checkResume = Invoke-RestMethod -Uri $checkUrl -Headers $headers
                                    if ($checkResume.station_artist -eq "START_BROADCAST" -or $checkResume.station_artist -eq "ON_AIR:ON" -or $checkResume.station_artist -eq "RESUME_BROADCAST" -or $checkResume.is_playing -eq $true) {
                                        Write-Host ">>> [RADIO MANAGER] Reanudando emision al aire..." -ForegroundColor Green
                                        Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
                                        break
                                    }
                                } catch {}
                            }
                        }
                        # 4. Actualizacion de Cola
                        elseif ($currentRemote.station_artist -like "ALBUM:*" -or $currentRemote.station_artist -eq "START_BROADCAST" -or $currentRemote.station_artist -eq "SHUFFLE" -or $currentRemote.station_artist -eq "SYNC") {
                            $refreshed = @(Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/playlist_radio?select=*&order=order_index.asc" -Method Get -Headers $headers)
                            if ($refreshed.Count -gt 0) {
                                $matchedTracks = Match-TracksToLocalFiles -dbList $refreshed -localFilesList $allLocalFiles
                                if ($currentRemote.station_artist -like "ALBUM:*" -or $currentRemote.station_artist -eq "START_BROADCAST") {
                                    $trackIndex = 0
                                    break
                                }
                            }
                        }
                        else {
                            # Heartbeat continuo para mantener el indicador en verde en la web
                            Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
                        }
                    } catch {}
                }

                Start-Sleep -Seconds 1
            }
        }
    }
}
finally {
    Write-Host "`n`n>>> [FINALIZANDO] Limpiando emision y desconectando estacion..." -ForegroundColor Yellow
    if ($previousRemoteFilename) { Delete-Track -remoteFilename $previousRemoteFilename }
    if ($remoteFilename) { Delete-Track -remoteFilename $remoteFilename }
    Update-CurrentPlay -title "Estacion Desconectada" -artist "OFFLINE" -cover "" -publicUrl "" -isPlaying $false
    Write-Host " [OK] Estacion apagada correctamente." -ForegroundColor Green
}
