# ==============================================================================
# RADIO BROADCASTER PRO - PROYECTO CAFE (EDICION SUPABASE HIGH-FIDELITY v3.3.0)
# ==============================================================================
# - Deteccion Instantanea de Estado: Conectado/Desconectado en tiempo real.
# - Cambio Inmediato de Pista: Soporte total para NEXT, PREV y REQUEST sin trabas.
# - Emision Ininterrumpida 24/7: Sincronizado con Supabase Storage y Proyecto Radio.
# - Multi-Carpeta en Paralelo: Escanea y unifica multiples fuentes locales de audio.
# - Cero Archivos Basura: Maximo 1 archivo en Storage (reemplazo y borrado automatico).
# ==============================================================================

$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- CONFIGURACION DE CONEXION SUPABASE ---
$SUPABASE_URL     = "https://gmothqjjqvbxshvvlbrq.supabase.co"
$SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw"
$BUCKET_NAME      = "Radio"
$CONFIG_FILE      = Join-Path $PSScriptRoot "carpetas_musica.txt"
$LOCAL_CATALOG    = Join-Path $PSScriptRoot "catalog.json"
$WEB_REPO_CATALOG = "C:\Users\Alejandro\Documents\GitHub\proyectocafeweb\src\data\localMusicCatalog.json"
$WEB_PUBLIC_CATALOG = "C:\Users\Alejandro\Documents\GitHub\proyectocafeweb\public\catalog.json"

$headers = @{
    "Authorization" = "Bearer $SUPABASE_API_KEY"
    "apikey"        = "$SUPABASE_API_KEY"
    "Content-Type"  = "application/json; charset=utf-8"
}

# --- GESTION DE MULTIPLES CARPETAS ---
function Get-ConfiguredFolders {
    $folders = [System.Collections.Generic.List[string]]::new()
    
    $defaultMusica = Join-Path $PSScriptRoot "musica"
    if (Test-Path $defaultMusica) { $folders.Add($defaultMusica) }
    $folders.Add($PSScriptRoot)

    if (Test-Path $CONFIG_FILE) {
        $lines = Get-Content $CONFIG_FILE | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith("#") }
        foreach ($line in $lines) {
            if ((Test-Path $line) -and (-not $folders.Contains($line))) {
                $folders.Add($line)
            }
        }
    } else {
        $template = "# CONFIGURACION DE CARPETAS DE MUSICA`r`nG:\Mi unidad\Radio\musica`r`nG:\Mi unidad\Radio"
        try { [System.IO.File]::WriteAllText($CONFIG_FILE, $template, [System.Text.Encoding]::UTF8) } catch {}
    }
    return $folders
}

# Obtener duracion exacta de archivo MP3
$global:ShellApp = $null
function Get-Mp3DurationSeconds($filePath) {
    try {
        if (-not $global:ShellApp) {
            $global:ShellApp = New-Object -ComObject Shell.Application
        }
        $folder = $global:ShellApp.Namespace((Split-Path $filePath))
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

    try {
        $fileSize = (Get-Item $filePath).Length
        $est = [int]($fileSize / 16000)
        if ($est -gt 0) { return $est }
    } catch {}
    return 180
}

# Subir pista a Supabase Storage
function Upload-Track($filePath, $remoteFilename) {
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$remoteFilename"
    $headersUpload = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Content-Type"  = "audio/mpeg"
    }

    try {
        Invoke-RestMethod -Uri $url -Method Post -Headers $headersUpload -InFile $filePath | Out-Null
        return $true
    } catch {
        Write-Host "`n [ERROR SUBIDA] Fallo subida a Storage: $_" -ForegroundColor Red
        return $false
    }
}

# Borrar pista de Supabase Storage para no acumular archivos
function Delete-Track($remoteFilename) {
    if (-not $remoteFilename) { return }
    $url = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME"
    $headersDel = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Content-Type"  = "application/json"
    }
    $body = @{ prefixes = @($remoteFilename) } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri $url -Method Delete -Headers $headersDel -Body $body | Out-Null
    } catch {}
}

# Limpiar pistas temporales huerfanas en el bucket
function Cleanup-OrphanLiveFiles {
    try {
        $listUrl = "$SUPABASE_URL/storage/v1/object/list/$BUCKET_NAME"
        $body = @{ prefix = ""; limit = 500 } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri $listUrl -Method Post -Headers $headers -Body $body
        $toDel = $res | Where-Object { $_.name -like "live_*.mp3" -or $_.name -like "queue_*.mp3" -or $_.name -like "preview_*.mp3" } | ForEach-Object { $_.name }
        if ($toDel.Count -gt 0) {
            for ($i = 0; $i -lt $toDel.Count; $i += 50) {
                $batch = $toDel | Select-Object -Skip $i -First 50
                $delBody = @{ prefixes = @($batch) } | ConvertTo-Json
                $delUrl = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME"
                Invoke-RestMethod -Uri $delUrl -Method Delete -Headers $headers -Body $delBody | Out-Null
            }
        }
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
    } catch {}
}

# Enviar latido de vida localmente sin alterar la estampa de inicio de cancion en Supabase
function Send-BatHeartbeat($sec = 0, $duration = 180, $currentTitle = "") {
    try {
        $hbData = @{
            online    = $true
            sec       = $sec
            duration  = $duration
            title     = $currentTitle
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        } | ConvertTo-Json -Compress

        $destPaths = @(
            (Join-Path $PSScriptRoot "bat_heartbeat.json"),
            "G:\Mi unidad\Radio\bat_heartbeat.json"
        )
        foreach ($p in $destPaths) {
            try { [System.IO.File]::WriteAllText($p, $hbData, [System.Text.Encoding]::UTF8) } catch {}
        }
    } catch {}
}

# Normalizar texto para comparacion flexible
function Normalize-Text($text) {
    if (-not $text) { return "" }
    $clean = $text.ToLower().Trim()
    $clean = [System.Text.RegularExpressions.Regex]::Replace($clean, "[^a-z0-9]", "")
    return $clean
}

# Consultar cola activa de Supabase garantizando un array plano
function Get-SupabaseQueue {
    try {
        $reqUrl = "$SUPABASE_URL/rest/v1/playlist_radio?select=*&order=order_index.asc"
        $resp = Invoke-WebRequest -Uri $reqUrl -Headers $headers -UseBasicParsing
        if (-not $resp.Content) { return @() }
        $parsed = $resp.Content | ConvertFrom-Json
        $list = [System.Collections.Generic.List[PSObject]]::new()
        foreach ($item in $parsed) {
            if ($item -is [System.Array]) {
                foreach ($subItem in $item) { $list.Add($subItem) }
            } else {
                $list.Add($item)
            }
        }
        return $list
    } catch {
        return @()
    }
}

# Emparejar canciones de la cola con archivos locales
function Match-TracksToLocalFiles($dbList, $localFilesList) {
    $matched = [System.Collections.Generic.List[PSObject]]::new()
    foreach ($dbSong in $dbList) {
        $dbTitle = $dbSong.title
        $dbNorm = Normalize-Text $dbTitle
        $url = $dbSong.url

        $foundFile = $null

        # 1. Coincidencia por protocolo local://
        if ($url -and $url.StartsWith("local://")) {
            $rawName = [System.Uri]::UnescapeDataString($url.Substring(8))
            $foundFile = $localFilesList | Where-Object { $_.Name -eq $rawName } | Select-Object -First 1
        }

        # 2. Coincidencia por nombre exacto o normalizado
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
# ESCANEO Y GENERACION DE CATALOGO UNIFICADO
# ==============================================================================
function Build-And-Upload-MultiCatalog($folderList) {
    Write-Host "`n>>> Escaneando biblioteca multi-carpeta..." -ForegroundColor Cyan
    $seenFolders = [System.Collections.Generic.HashSet[string]]::new()
    $albumsDirs = [System.Collections.Generic.List[System.IO.DirectoryInfo]]::new()

    foreach ($folder in $folderList) {
        if (-not (Test-Path $folder)) { continue }
        Write-Host "    [Carpeta] $folder" -ForegroundColor DarkGray
        $allMp3sInFolder = @(Get-ChildItem -Path $folder -Filter *.mp3 -Recurse -File)
        foreach ($mp3Item in $allMp3sInFolder) {
            $parentDir = $mp3Item.Directory
            $key = $parentDir.FullName.ToLower()
            if (-not $seenFolders.Contains($key)) {
                $seenFolders.Add($key) | Out-Null
                $albumsDirs.Add($parentDir)
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

        $catalogList.Add([PSCustomObject]@{
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

    try {
        [System.IO.File]::WriteAllText($LOCAL_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8)
        Write-Host " [OK] Catalogo local guardado: $($catalogList.Count) albumes, $totalSongsCount canciones." -ForegroundColor Green
    } catch {}

    if (Test-Path (Split-Path $WEB_REPO_CATALOG)) {
        try { [System.IO.File]::WriteAllText($WEB_REPO_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8) } catch {}
    }
    if (Test-Path (Split-Path $WEB_PUBLIC_CATALOG)) {
        try { [System.IO.File]::WriteAllText($WEB_PUBLIC_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8) } catch {}
    }

    try {
        $urlStorage = "$SUPABASE_URL/storage/v1/object/Radio/catalog.json"
        $headersUpload = @{
            "Authorization" = "Bearer $SUPABASE_API_KEY"
            "apikey"        = "$SUPABASE_API_KEY"
            "Content-Type"  = "application/json"
            "x-upsert"      = "true"
        }
        Invoke-RestMethod -Uri $urlStorage -Method Post -Headers $headersUpload -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonCatalog)) | Out-Null
        Write-Host " [OK] Catalogo sincronizado en la nube." -ForegroundColor Green
    } catch {}

    return $catalogList
}

# ==============================================================================
# DASHBOARD VISUAL DE CABINA
# ==============================================================================
function Show-DashboardHeader($version, $configuredFolders, $catalogCount, $songCount) {
    Clear-Host
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "=               RADIO BROADCASTER PRO - PROYECTO CAFE                         =" -ForegroundColor Cyan
    Write-Host "=               Version $version                                          =" -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "  Servidor Supabase   : $SUPABASE_URL" -ForegroundColor DarkGray
    Write-Host "  Fuentes Configuradas: $($configuredFolders.Count) carpetas" -ForegroundColor DarkGray
    Write-Host "  Biblioteca Indexada : $catalogCount albumes ($songCount canciones)" -ForegroundColor Green
    Write-Host "  Estado Emisora      : CONECTADO Y TRANSMITIENDO EN VIVO (24/7)" -ForegroundColor Green
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "  Atajos: [N] Siguiente | [P] Pausar/Reanudar | [R] Refrescar Cola | [C] Re-escanear | [Q] Salir" -ForegroundColor DarkGray
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
}

# ==============================================================================
# INICIO DE LA ESTACION
# ==============================================================================
$VERSION = "v3.3.0 [Instant Sync & Real-Time Skip]"
$folders = Get-ConfiguredFolders

$fullCatalog = $null
if (Test-Path $LOCAL_CATALOG) {
    try {
        $rawJson = [System.IO.File]::ReadAllText($LOCAL_CATALOG, [System.Text.Encoding]::UTF8)
        $fullCatalog = $rawJson | ConvertFrom-Json
        Write-Host "[INICIO RAPIDO] Catalogo local cargado al instante." -ForegroundColor Green
    } catch {}
}

if (-not $fullCatalog -or $fullCatalog.Count -eq 0) {
    $fullCatalog = Build-And-Upload-MultiCatalog -folderList $folders
}

$totalSongs = 0
foreach ($alb in $fullCatalog) {
    if ($alb.trackCount) { $totalSongs += [int]$alb.trackCount }
    elseif ($alb.tracks) { $totalSongs += [int]$alb.tracks.Count }
}

$allLocalFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($f in $folders) {
    if (Test-Path $f) {
        $files = @(Get-ChildItem -Path $f -Filter *.mp3 -Recurse -File)
        foreach ($item in $files) { $allLocalFiles.Add($item) }
    }
}

Cleanup-OrphanLiveFiles

Show-DashboardHeader -version $VERSION -configuredFolders $folders -catalogCount $fullCatalog.Count -songCount $totalSongs

# ==============================================================================
# BUCLE MAESTRO DE EMISION
# ==============================================================================
$previousRemoteFilename = $null
$remoteFilename = $null
$requestedTrack = $null

$vuFrames = @(" ▂▃▅▆▇▆▅▃ ", "▂▃▅▆▇█▇▆▅", "▃▅▆▇██▇▆▅▃", "▅▆▇██▇▆▅▃▂", "▆▇██▇▆▅▃▂ ", "▇██▇▆▅▃▂ ▂", "██▇▆▅▃▂ ▂▃", "▇▆▅▃▂ ▂▃▅")
$vuIndex = 0

try {
    while ($true) {
        # 1. Consultar cola de Supabase
        $dbTracks = Get-SupabaseQueue
        $matchedTracks = Match-TracksToLocalFiles -dbList $dbTracks -localFilesList $allLocalFiles

        $isAutoRotation = ($matchedTracks.Count -eq 0)
        if ($isAutoRotation) {
            if ($allLocalFiles.Count -eq 0) {
                Write-Host "`r [AVISO] No se encontraron archivos MP3 en las carpetas configuradas." -ForegroundColor Yellow
                Start-Sleep -Seconds 3
                continue
            }
            $randomFile = $allLocalFiles | Get-Random
            $cName = [System.IO.Path]::GetFileNameWithoutExtension($randomFile.Name)
            $cClean = [System.Text.RegularExpressions.Regex]::Replace($cName, "^\d+[\s\-_.]*", "")
            $autoArtist = "Radio Cafe"
            $autoTitle = $cClean
            if ($cClean -like "* - *") {
                $p = $cClean -split ' - ', 2
                $autoArtist = $p[0].Trim()
                $autoTitle = $p[1].Trim()
            }
            $matchedTracks = @([PSCustomObject]@{
                id          = 0
                title       = $autoTitle
                artist      = $autoArtist
                album       = $randomFile.Directory.Name
                cover       = ""
                filePath    = $randomFile.FullName
                order_index = 0
            })
        }

        $trackIndex = 0

        while ($trackIndex -lt $matchedTracks.Count) {
            if ($requestedTrack) {
                $currentTrack = $requestedTrack
                $requestedTrack = $null
            } else {
                $currentTrack = $matchedTracks[$trackIndex]
                $trackIndex++
            }

            $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            $remoteFilename = "live_$timestamp.mp3"
            $duration = 180

            if ($currentTrack.filePath -and (Test-Path $currentTrack.filePath)) {
                $duration = Get-Mp3DurationSeconds $currentTrack.filePath

                Write-Host "`n-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
                if ($isAutoRotation) {
                    Write-Host " [ON AIR - AUTO ROTACION] Transmitiendo pista de coleccion local" -ForegroundColor Cyan
                } else {
                    Write-Host " [ON AIR - COLA WEB] Pista $trackIndex de $($matchedTracks.Count)" -ForegroundColor Green
                }
                Write-Host " Cancion  : $($currentTrack.title)" -ForegroundColor Yellow
                Write-Host " Artista  : $($currentTrack.artist)" -ForegroundColor White
                Write-Host " Album    : $($currentTrack.album)" -ForegroundColor DarkGray
                Write-Host " Duracion : $duration s ($([math]::Round($duration/60, 2)) min)" -ForegroundColor DarkGray

                # Subir pista actual
                $uploaded = Upload-Track -filePath $currentTrack.filePath -remoteFilename $remoteFilename
                if (-not $uploaded) {
                    Start-Sleep -Seconds 2
                    continue
                }

                $publicUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$remoteFilename"

                # Borrar pista anterior inmediatamente
                if ($previousRemoteFilename -and ($previousRemoteFilename -ne $remoteFilename)) {
                    Delete-Track -remoteFilename $previousRemoteFilename
                }
                $previousRemoteFilename = $remoteFilename
            } else {
                $publicUrl = $currentTrack.remoteUrl
                Write-Host "`n>>> [EMITIENDO REMOTO] $($currentTrack.title)" -ForegroundColor Yellow
            }

            # Notificar nueva pista activa a Supabase
            Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
            Write-Host " [TRANSMITIENDO EN VIVO] Sincronizado con pagina web y oyentes.`n" -ForegroundColor Green

            # Monitoreo de reproduccion con VU meter DJ
            for ($sec = 0; $sec -lt $duration; $sec++) {
                $pct = [math]::Round(($sec / $duration) * 100)
                $barsCount = [int]($pct / 5)
                $progressStr = ("#" * $barsCount) + ("-" * (20 - $barsCount))
                $vu = $vuFrames[$vuIndex % $vuFrames.Count]
                $vuIndex++

                $elapsedMin = [int][math]::Floor($sec / 60)
                $elapsedSec = [int]($sec % 60)
                $totalMin = [int][math]::Floor($duration / 60)
                $totalSec = [int]($duration % 60)
                $timeFormatted = "{0:00}:{1:00} / {2:00}:{3:00}" -f $elapsedMin, $elapsedSec, $totalMin, $totalSec

                Write-Host -NoNewline "`r  $vu [ON AIR] [$progressStr] $pct% ($timeFormatted) "

                # Control por teclado local
                if ([Console]::KeyAvailable) {
                    $key = [Console]::ReadKey($true)
                    if ($key.Key -eq [ConsoleKey]::N -or $key.Key -eq [ConsoleKey]::Enter) {
                        Write-Host "`n  [DJ] >> Saltando a la siguiente cancion..." -ForegroundColor Yellow
                        break
                    }
                    elseif ($key.Key -eq [ConsoleKey]::P -or $key.Key -eq [ConsoleKey]::Spacebar) {
                        Write-Host "`n  [PAUSA LOCAL] Emision local en pausa. Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
                        [Console]::ReadKey($true) | Out-Null
                        Write-Host "  [REANUDADO] Continuando emision al aire..." -ForegroundColor Green
                    }
                    elseif ($key.Key -eq [ConsoleKey]::R) {
                        Write-Host "`n  [DJ] Recargando cola desde Radio Manager..." -ForegroundColor Cyan
                        $refreshed = Get-SupabaseQueue
                        if ($refreshed.Count -gt 0) {
                            $matchedTracks = Match-TracksToLocalFiles -dbList $refreshed -localFilesList $allLocalFiles
                            $isAutoRotation = $false
                            Write-Host "  [OK] Cola actualizada: $($matchedTracks.Count) pistas listas." -ForegroundColor Green
                        }
                    }
                    elseif ($key.Key -eq [ConsoleKey]::C) {
                        Write-Host "`n  [RE-ESCANEO] Actualizando catalogo completo de carpetas..." -ForegroundColor Cyan
                        $fullCatalog = Build-And-Upload-MultiCatalog -folderList $folders
                        Write-Host "  [OK] Re-escaneo completado exitosamente." -ForegroundColor Green
                    }
                    elseif ($key.Key -eq [ConsoleKey]::Q) {
                        Write-Host "`n  [SALIENDO] Apagando emisora..." -ForegroundColor Red
                        exit
                    }
                }

                # Chequeo de senales desde la web cada 1 segundo
                try {
                    $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist,station_name,station_cover,station_url,tab&id=eq.1"
                    $rawResp = Invoke-RestMethod -Uri $checkUrl -Headers $headers
                    $currentRemote = if ($rawResp -is [System.Array]) { $rawResp[0] } else { $rawResp }

                    $cmdArtist = [string]$currentRemote.station_artist
                    $cmdName   = [string]$currentRemote.station_name
                    $cmdTab    = [string]$currentRemote.tab

                    # 1. Peticion de PRE-ESCUCHA / CUE desde la Biblioteca Web (EN PARALELO, SIN TOCAR EL AIRE)
                    if ($cmdTab -like "PREVIEW_REQ:*") {
                        $reqPayload = $cmdTab.Substring(12).Trim()
                        $reqParts = $reqPayload -split '\|\|', 3
                        $reqTitle = $reqParts[0].Trim()
                        $reqArtist = if ($reqParts.Count -gt 1 -and $reqParts[1].Trim()) { $reqParts[1].Trim() } else { "" }
                        $reqFile = if ($reqParts.Count -gt 2 -and $reqParts[2].Trim()) { $reqParts[2].Trim() } else { "" }

                        Write-Host "`n>>> [CUE / PRE-ESCUCHA PARALELA] Pista solicitada de biblioteca: $reqTitle" -ForegroundColor Cyan

                        $matchedReq = $null
                        if ($reqFile) {
                            $matchedReq = $allLocalFiles | Where-Object {
                                $_.FullName -eq $reqFile -or 
                                $_.Name -eq $reqFile -or
                                ($_.FullName.IndexOf($reqFile, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or
                                ($_.Name.IndexOf($reqFile, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
                            } | Select-Object -First 1
                        }

                        if (-not $matchedReq) {
                            $reqNorm = Normalize-Text $reqTitle
                            $matchedReq = $allLocalFiles | Where-Object {
                                $fClean = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                $fNorm = Normalize-Text $fClean
                                ($fClean.IndexOf($reqTitle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or 
                                ($reqTitle.IndexOf($fClean, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or 
                                ($reqNorm -and $fNorm -eq $reqNorm) -or
                                ($reqNorm -and $fNorm.Contains($reqNorm)) -or
                                ($reqNorm -and $reqNorm.Contains($fNorm))
                            } | Select-Object -First 1
                        }

                        if ($matchedReq) {
                            Write-Host " [SUBIENDO PRE-ESCUCHA] $($matchedReq.Name)..." -ForegroundColor Cyan
                            $previewTimestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                            $previewFilename = "preview_$previewTimestamp.mp3"

                            $headersUpload = @{
                                "Authorization" = "Bearer $SUPABASE_API_KEY"
                                "apikey"        = "$SUPABASE_API_KEY"
                                "Content-Type"  = "audio/mpeg"
                                "x-upsert"      = "true"
                            }
                            $urlUp = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/$previewFilename"
                            try {
                                Invoke-RestMethod -Uri $urlUp -Method Post -Headers $headersUpload -InFile $matchedReq.FullName | Out-Null
                                $previewUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$previewFilename"
                                $previewDur = Get-Mp3DurationSeconds $matchedReq.FullName
                                if (-not $previewDur -or $previewDur -le 0) { $previewDur = 180 }

                                # Borrar archivo de pre-escucha anterior si existia
                                if ($global:PreviousPreviewFilename) {
                                    Delete-Track -remoteFilename $global:PreviousPreviewFilename
                                }
                                $global:PreviousPreviewFilename = $previewFilename

                                # Notificar que la pre-escucha esta lista para la web (SIN alterar datos al aire)
                                $readyPayload = @{
                                    tab = "PREVIEW_READY:$previewUrl||$reqTitle||$reqArtist||$previewDur"
                                } | ConvertTo-Json -Compress
                                $patchUrl = "$SUPABASE_URL/rest/v1/radio_current_play?id=eq.1"
                                $headersPatch = @{
                                    "Authorization" = "Bearer $SUPABASE_API_KEY"
                                    "apikey"        = "$SUPABASE_API_KEY"
                                    "Content-Type"  = "application/json; charset=utf-8"
                                }
                                Invoke-RestMethod -Uri $patchUrl -Method Patch -Headers $headersPatch -Body ([System.Text.Encoding]::UTF8.GetBytes($readyPayload)) | Out-Null
                                Write-Host " [PRE-ESCUCHA LISTA] Transmitida en paralelo. Emision al aire sigue activa.`n" -ForegroundColor Green
                            } catch {
                                Write-Host " [ERROR SUBIENDO PRE-ESCUCHA] $_" -ForegroundColor Red
                            }
                        } else {
                            Write-Host " [AVISO] Archivo para pre-escucha '$reqTitle' no encontrado en disco." -ForegroundColor Yellow
                        }
                    }
                    # 2. Peticion instantanea de una cancion especifica AL AIRE (clic en cola de emision)
                    elseif ($cmdArtist.StartsWith("REQUEST:")) {
                        $reqPayload = $cmdArtist.Substring(8).Trim()
                        $reqParts = $reqPayload -split '\|\|', 3
                        $reqTitle = $reqParts[0].Trim()
                        $reqArtist = if ($reqParts.Count -gt 1 -and $reqParts[1].Trim()) { $reqParts[1].Trim() } else { "" }
                        $reqFile = if ($reqParts.Count -gt 2 -and $reqParts[2].Trim()) { $reqParts[2].Trim() } else { "" }

                        Write-Host "`n>>> [SOLICITUD AL AIRE] Pista solicitada para emision: $reqTitle" -ForegroundColor Magenta

                        $matchedReq = $null
                        if ($reqFile) {
                            $matchedReq = $allLocalFiles | Where-Object {
                                $_.FullName -eq $reqFile -or 
                                $_.Name -eq $reqFile -or
                                ($_.FullName.IndexOf($reqFile, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or
                                ($_.Name.IndexOf($reqFile, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
                            } | Select-Object -First 1
                        }

                        if (-not $matchedReq) {
                            $reqNorm = Normalize-Text $reqTitle
                            $matchedReq = $allLocalFiles | Where-Object {
                                $fClean = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                $fNorm = Normalize-Text $fClean
                                ($fClean.IndexOf($reqTitle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or 
                                ($reqTitle.IndexOf($fClean, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or 
                                ($reqNorm -and $fNorm -eq $reqNorm) -or
                                ($reqNorm -and $fNorm.Contains($reqNorm)) -or
                                ($reqNorm -and $reqNorm.Contains($fNorm))
                            } | Select-Object -First 1
                        }

                        if ($matchedReq) {
                            Write-Host " [ENCONTRADO AL AIRE] $($matchedReq.FullName)" -ForegroundColor Green
                            if (-not $reqArtist) {
                                $cName = [System.IO.Path]::GetFileNameWithoutExtension($matchedReq.Name)
                                $cClean = [System.Text.RegularExpressions.Regex]::Replace($cName, "^\d+[\s\-_.]*", "")
                                if ($cClean -like "* - *") {
                                    $p = $cClean -split ' - ', 2
                                    $reqArtist = $p[0].Trim()
                                } else {
                                    $reqArtist = $matchedReq.Directory.Name
                                }
                            }

                            $requestedTrack = [PSCustomObject]@{
                                id          = 999
                                title       = if ($reqTitle) { $reqTitle } else { [System.IO.Path]::GetFileNameWithoutExtension($matchedReq.Name) }
                                artist      = $reqArtist
                                album       = $matchedReq.Directory.Name
                                cover       = if ($currentRemote.station_cover) { $currentRemote.station_cover } else { "" }
                                filePath    = $matchedReq.FullName
                                order_index = 0
                            }
                            break
                        } else {
                            Write-Host " [AVISO] Archivo para emision '$reqTitle' no encontrado en disco." -ForegroundColor Yellow
                        }
                    }
                    # 3. Salto a siguiente cancion al aire solicitado desde la web
                    elseif ($cmdArtist -eq "NEXT_TRACK" -or $cmdName -eq "NEXT_TRACK") {
                        Write-Host "`n>>> [RADIO MANAGER] Siguiente pista solicitada al aire." -ForegroundColor Cyan
                        break
                    }
                    else {
                        # Latido de vida liviano en bat_heartbeat.json
                        Send-BatHeartbeat -sec $sec -duration $duration -currentTitle $currentTrack.title
                    }
                } catch {}

                Start-Sleep -Seconds 1
            }
        }
    }
}
finally {
    Write-Host "`n`n>>> [APAGANDO] Limpiando archivos temporales en Supabase Storage..." -ForegroundColor Yellow
    if ($previousRemoteFilename) { Delete-Track -remoteFilename $previousRemoteFilename }
    if ($remoteFilename) { Delete-Track -remoteFilename $remoteFilename }
    if ($global:PreviousPreviewFilename) { Delete-Track -remoteFilename $global:PreviousPreviewFilename }
    Cleanup-OrphanLiveFiles
    # Limpiar latido local
    try {
        $destPaths = @(
            (Join-Path $PSScriptRoot "bat_heartbeat.json"),
            "G:\Mi unidad\Radio\bat_heartbeat.json"
        )
        foreach ($p in $destPaths) {
            if (Test-Path $p) { Remove-Item $p -Force -ErrorAction SilentlyContinue }
        }
    } catch {}
    # Notificar que el BAT se cerro de inmediato
    Update-CurrentPlay -title "Estacion Desconectada" -artist "OFFLINE" -cover "" -publicUrl "" -isPlaying $false
    Write-Host " [OK] Estacion desconectada y estado OFFLINE notificado a la web." -ForegroundColor Green
}
