# ==============================================================================
# RADIO BROADCASTER PRO - PROYECTO CAFE (EDICION SUPABASE HIGH-FIDELITY v3.1.0)
# ==============================================================================
# - Carga Instantanea: Reutiliza catalogo local o re-escanea bajo demanda con [C].
# - Multi-Carpeta en Paralelo: Escanea y unifica multiples fuentes locales de audio.
# - Auto-Rotacion Inteligente: Si la cola web esta vacia, transmite de tu coleccion.
# - Uso Minimo de Supabase: Maximo 1 archivo de audio en Storage (cero acumulacion).
# - Visualizador DJ en Tiempo Real: Barra animada, VU meter y controles por teclado.
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
    
    # Carpeta por defecto
    $defaultMusica = Join-Path $PSScriptRoot "musica"
    if (Test-Path $defaultMusica) { $folders.Add($defaultMusica) }
    $folders.Add($PSScriptRoot)

    # Archivo de configuracion carpetas_musica.txt si existe
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
        $toDel = $res | Where-Object { $_.name -like "live_*.mp3" -or $_.name -like "queue_*.mp3" } | ForEach-Object { $_.name }
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
    } catch {}
}

# Normalizar texto para comparacion
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
                $safeCover = [System.Text.RegularExpressions.Regex]::Replace($foundFile.Directory.Name, "[^a-zA-Z0-9_\-]", "_") + ".jpg"
                $pubCover = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/covers/$safeCover"
                cover       = if ($dbSong.cover -and $dbSong.cover.StartsWith("http")) { $dbSong.cover } else { $pubCover }
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

        # Buscar caratula
        $coverFiles = @(Get-ChildItem -Path $alb.FullName -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|webp)$' })
        $albumCoverUrl = ""
        if ($coverFiles.Count -gt 0) {
            $preferredCover = $coverFiles | Where-Object { $_.BaseName -match '^(cover|folder|front|album|portada)$' } | Select-Object -First 1
            if (-not $preferredCover) { $preferredCover = $coverFiles[0] }
            $safeCoverName = [System.Text.RegularExpressions.Regex]::Replace($alb.Name, "[^a-zA-Z0-9_\-]", "_") + ".jpg"
            $albumCoverUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/covers/$safeCoverName"
            try {
                $uploadCoverUrl = "$SUPABASE_URL/storage/v1/object/$BUCKET_NAME/covers/$safeCoverName"
                $headersCover = @{
                    "Authorization" = "Bearer $SUPABASE_API_KEY"
                    "apikey"        = "$SUPABASE_API_KEY"
                    "Content-Type"  = "image/jpeg"
                }
                Invoke-RestMethod -Uri $uploadCoverUrl -Method Post -Headers $headersCover -InFile $preferredCover.FullName -ErrorAction SilentlyContinue | Out-Null
            } catch {}
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

    # 1. Guardar localmente
    try {
        [System.IO.File]::WriteAllText($LOCAL_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8)
        Write-Host " [OK] Catalogo local guardado: $($catalogList.Count) albumes, $totalSongsCount canciones." -ForegroundColor Green
    } catch {}

    # 2. Copiar al repositorio git
    if (Test-Path (Split-Path $WEB_REPO_CATALOG)) {
        try { [System.IO.File]::WriteAllText($WEB_REPO_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8) } catch {}
    }
    if (Test-Path (Split-Path $WEB_PUBLIC_CATALOG)) {
        try { [System.IO.File]::WriteAllText($WEB_PUBLIC_CATALOG, $jsonCatalog, [System.Text.Encoding]::UTF8) } catch {}
    }

    # 3. Subir a Supabase Storage
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
    Write-Host "  Estado Emisora      : CONECTADO Y TRANSMITIENDO EN VIVO" -ForegroundColor Green
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "  Atajos: [N] Siguiente | [P] Pausar/Reanudar | [R] Refrescar Cola | [C] Re-escanear | [Q] Salir" -ForegroundColor DarkGray
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
}

# ==============================================================================
# INICIO DE LA ESTACION
# ==============================================================================
$VERSION = "v3.1.0 [High-Speed Zero-Waste Stream]"
$folders = Get-ConfiguredFolders

# Cargar catalogo: si existe en disco se carga en milisegundos
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

# Escanear archivos MP3 disponibles para reproduccion
$allLocalFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($f in $folders) {
    if (Test-Path $f) {
        $files = @(Get-ChildItem -Path $f -Filter *.mp3 -Recurse -File)
        foreach ($item in $files) { $allLocalFiles.Add($item) }
    }
}

# Limpiar posibles restos huerfanos en Storage para iniciar limpios
Cleanup-OrphanLiveFiles

Show-DashboardHeader -version $VERSION -configuredFolders $folders -catalogCount $fullCatalog.Count -songCount $totalSongs

# Heartbeat inicial de estacion lista
Update-CurrentPlay -title "Estacion Lista" -artist "BAT_ONLINE" -cover "" -publicUrl "" -isPlaying $false

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

        # 2. Si la cola web esta vacia, usar modo Auto-Rotacion continua con la biblioteca local
        $isAutoRotation = ($matchedTracks.Count -eq 0)
        if ($isAutoRotation) {
            if ($allLocalFiles.Count -eq 0) {
                Write-Host "`r [AVISO] No se encontraron archivos MP3 en las carpetas configuradas." -ForegroundColor Yellow
                Start-Sleep -Seconds 3
                continue
            }
            # Seleccionar archivo aleatorio de la biblioteca
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
                $safeCoverAuto = [System.Text.RegularExpressions.Regex]::Replace($randomFile.Directory.Name, "[^a-zA-Z0-9_\-]", "_") + ".jpg"
                cover       = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/covers/$safeCoverAuto"
                filePath    = $randomFile.FullName
                order_index = 0
            })
        }

        $trackIndex = 0

        while ($trackIndex -lt $matchedTracks.Count) {
            # Peticion instantanea de usuario en Radio Manager
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
                    Write-Host " [ON AIR - AUTO ROTACION] Transmitiendo pista de tu coleccion local" -ForegroundColor Cyan
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

                # Borrar pista anterior para no gastar espacio en Supabase
                if ($previousRemoteFilename -and ($previousRemoteFilename -ne $remoteFilename)) {
                    Delete-Track -remoteFilename $previousRemoteFilename
                }
                $previousRemoteFilename = $remoteFilename
            } else {
                $publicUrl = $currentTrack.remoteUrl
                Write-Host "`n>>> [EMITIENDO REMOTO] $($currentTrack.title)" -ForegroundColor Yellow
            }

            # Notificar inmediatamente a Supabase para que suene en Proyecto Radio y Radio Manager
            Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
            Write-Host " [TRANSMITIENDO EN VIVO] Sincronizado con pagina web y oyentes.`n" -ForegroundColor Green

            # Monitoreo de reproduccion con VU meter DJ
            $checkWebCounter = 0
            for ($sec = 0; $sec -lt $duration; $sec++) {
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

                # Control por teclado local
                if ([Console]::KeyAvailable) {
                    $key = [Console]::ReadKey($true)
                    if ($key.Key -eq [ConsoleKey]::N -or $key.Key -eq [ConsoleKey]::Enter) {
                        Write-Host "`n  [DJ] >> Saltando a la siguiente cancion..." -ForegroundColor Yellow
                        break
                    }
                    elseif ($key.Key -eq [ConsoleKey]::P -or $key.Key -eq [ConsoleKey]::Spacebar) {
                        Write-Host "`n  [PAUSA] Emision pausada. Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
                        Update-CurrentPlay -title $currentTrack.title -artist "PAUSED" -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $false
                        [Console]::ReadKey($true) | Out-Null
                        Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
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

                # Chequeo de senales desde la web cada 2 segundos
                $checkWebCounter++
                if ($checkWebCounter -ge 2) {
                    $checkWebCounter = 0
                    try {
                        $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist,station_name,is_playing&id=eq.1"
                        $currentRemote = Invoke-RestMethod -Uri $checkUrl -Headers $headers

                        # 1. Peticion instantanea de una cancion especifica
                        if ($currentRemote.station_artist -like "REQUEST:*") {
                            $reqTitle = $currentRemote.station_artist.Substring(8).Trim()
                            Write-Host "`n>>> [SOLICITUD WEB] Cambio inmediato: $reqTitle" -ForegroundColor Magenta
                            
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
                                    $safeCoverReq = [System.Text.RegularExpressions.Regex]::Replace($matchedReq.Directory.Name, "[^a-zA-Z0-9_\-]", "_") + ".jpg"
                                    cover       = if ($currentRemote.station_cover -and $currentRemote.station_cover.StartsWith("http")) { $currentRemote.station_cover } else { "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/covers/$safeCoverReq" }
                                    filePath    = $matchedReq.FullName
                                    order_index = 0
                                }
                                break
                            }
                        }
                        # 2. Salto a siguiente cancion desde la web
                        elseif ($currentRemote.station_artist -eq "NEXT_TRACK" -or $currentRemote.station_name -eq "NEXT_TRACK") {
                            Write-Host "`n>>> [RADIO MANAGER] Siguiente pista solicitada." -ForegroundColor Cyan
                            break
                        }
                        # 3. Pausa remota desde la web
                        elseif ($currentRemote.station_artist -eq "PAUSE_BROADCAST" -or $currentRemote.station_artist -eq "ON_AIR:OFF" -or ($currentRemote.is_playing -eq $false -and $currentRemote.station_artist -ne "BAT_ONLINE")) {
                            Write-Host "`n>>> [RADIO MANAGER] Emision pausada desde la web." -ForegroundColor Yellow
                            while ($true) {
                                Start-Sleep -Seconds 1
                                try {
                                    $checkResume = Invoke-RestMethod -Uri $checkUrl -Headers $headers
                                    if ($checkResume.station_artist -eq "START_BROADCAST" -or $checkResume.station_artist -eq "ON_AIR:ON" -or $checkResume.station_artist -eq "RESUME_BROADCAST" -or $checkResume.is_playing -eq $true) {
                                        Write-Host ">>> [RADIO MANAGER] Reanudando emision..." -ForegroundColor Green
                                        Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
                                        break
                                    }
                                } catch {}
                            }
                        }
                        # 4. Modificacion de la cola en la web
                        elseif ($isAutoRotation) {
                            # Si estabamos en auto-rotacion y el usuario agrego canciones a la cola, cambiar a la cola de inmediato
                            $freshQueue = Get-SupabaseQueue
                            if ($freshQueue.Count -gt 0) {
                                $matchedFresh = Match-TracksToLocalFiles -dbList $freshQueue -localFilesList $allLocalFiles
                                if ($matchedFresh.Count -gt 0) {
                                    Write-Host "`n>>> [COLA WEB DETECTADA] Canciones recibidas desde Radio Manager!" -ForegroundColor Green
                                    $matchedTracks = $matchedFresh
                                    $isAutoRotation = $false
                                    $trackIndex = 0
                                    break
                                }
                            }
                        }
                        else {
                            # Heartbeat periodico para mantener encendido el indicador 'En Vivo' en la web
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
    Write-Host "`n`n>>> [APAGANDO] Limpiando archivos temporales en Supabase Storage..." -ForegroundColor Yellow
    if ($previousRemoteFilename) { Delete-Track -remoteFilename $previousRemoteFilename }
    if ($remoteFilename) { Delete-Track -remoteFilename $remoteFilename }
    Cleanup-OrphanLiveFiles
    Update-CurrentPlay -title "Estacion Lista" -artist "BAT_ONLINE" -cover "" -publicUrl "" -isPlaying $false
    Write-Host " [OK] Estacion desconectada y almacenamiento limpio." -ForegroundColor Green
}
