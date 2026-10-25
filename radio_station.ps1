# ==============================================================================
# RADIO BROADCASTER PRO - PROYECTO CAFE (EDICION SUPABASE HIGH-FIDELITY v4.0.0)
# ==============================================================================
# - Instancia Unica: Previene multiples procesos .bat simultaneos.
# - Reloj Wall-Clock Exacto (Stopwatch): Cero desfase en celulares y web.
# - Cambio Inmediato de Pista: Soporte total para NEXT, PREV y REQUEST sin trabas.
# - Pre-escucha (CUE) Asincrona: No congela ni interrumpe la emision al aire.
# - Retencion Segura (Grace Period): Evita cortes 404 al final de pista en moviles.
# ==============================================================================

$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- CONTROL DE INSTANCIA UNICA DEL TRANSMISOR (.BAT) ---
$PID_LOCK_FILE = Join-Path $PSScriptRoot "bat_pid.lock"
if (Test-Path $PID_LOCK_FILE) {
    try {
        $oldPid = [int](Get-Content $PID_LOCK_FILE -ErrorAction SilentlyContinue).Trim()
        if ($oldPid -and $oldPid -ne $PID) {
            $oldProc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
            if ($oldProc -and $oldProc.ProcessName -match "powershell|pwsh") {
                Write-Host "[INSTANCIA UNICA] Cerrando instancia previa del transmisor (PID: $oldPid)..." -ForegroundColor Yellow
                Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        }
    } catch {}
}
try { [System.IO.File]::WriteAllText($PID_LOCK_FILE, "$PID", [System.Text.Encoding]::UTF8) } catch {}

# --- CONFIGURACION DE CONEXION SUPABASE ---
$SUPABASE_URL       = "https://gmothqjjqvbxshvvlbrq.supabase.co"
$SUPABASE_API_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtb3RocWpqcXZieHNodnZsYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0NTYzMzgsImV4cCI6MjA0MjAzMjMzOH0.wb9RTHq7Ryyma2TPHnLgL8iqzKT6-rr4rUWD69Jg1gw"
$BUCKET_NAME        = "Radio"
$CONFIG_FILE        = Join-Path $PSScriptRoot "carpetas_musica.txt"
$LOCAL_CATALOG      = Join-Path $PSScriptRoot "catalog.json"
$WEB_REPO_CATALOG   = "G:\Mi unidad\git\proyectocafeweb\src\data\localMusicCatalog.json"
$WEB_PUBLIC_CATALOG = "G:\Mi unidad\git\proyectocafeweb\public\catalog.json"

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

# Cache de duraciones para lectura instantanea y exacta
$global:DurationCache = @{}
$global:ShellApp = $null

function Get-Mp3DurationSeconds($filePath) {
    if (-not $filePath) { return 180 }
    $key = $filePath.ToLower()
    if ($global:DurationCache.ContainsKey($key) -and $global:DurationCache[$key] -gt 5) {
        return [int]$global:DurationCache[$key]
    }

    try {
        if (-not $global:ShellApp) {
            $global:ShellApp = New-Object -ComObject Shell.Application
        }
        $folder = $global:ShellApp.Namespace((Split-Path $filePath))
        if ($folder) {
            $item = $folder.ParseName((Split-Path $filePath -Leaf))
            if ($item) {
                $rawDuration = $folder.GetDetailsOf($item, 27)
                if ($rawDuration -match '(\d{1,2}):(\d{2}):(\d{2})') {
                    $secs = ([int]$matches[1] * 3600) + ([int]$matches[2] * 60) + [int]$matches[3]
                    if ($secs -gt 5) {
                        $global:DurationCache[$key] = $secs
                        return $secs
                    }
                }
                if ($rawDuration -match '(\d{1,2}):(\d{2})') {
                    $secs = ([int]$matches[1] * 60) + [int]$matches[2]
                    if ($secs -gt 5) {
                        $global:DurationCache[$key] = $secs
                        return $secs
                    }
                }
            }
        }
    } catch {}

    try {
        $fileSize = (Get-Item $filePath).Length
        $est = [int]($fileSize / 24000) # Estimado conservador (~192kbps)
        if ($est -gt 10) {
            $global:DurationCache[$key] = $est
            return $est
        }
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
        "x-upsert"      = "true"
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

# Subir pista por adelantado en segundo plano (Zero Delay Pre-Upload)
function Start-AsyncTrackUpload($filePath, $remoteFilename) {
    $ps = [powershell]::Create()
    [void]$ps.AddScript({
        param($filePath, $remoteFilename, $supabaseUrl, $supabaseKey, $bucketName)
        $url = "$supabaseUrl/storage/v1/object/$bucketName/$remoteFilename"
        $headersUpload = @{
            "Authorization" = "Bearer $supabaseKey"
            "apikey"        = "$supabaseKey"
            "Content-Type"  = "audio/mpeg"
            "x-upsert"      = "true"
        }
        try {
            $ProgressPreference = 'SilentlyContinue'
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-RestMethod -Uri $url -Method Post -Headers $headersUpload -InFile $filePath | Out-Null
            return $true
        } catch {
            return $false
        }
    }).AddArgument($filePath).AddArgument($remoteFilename).AddArgument($SUPABASE_URL).AddArgument($SUPABASE_API_KEY).AddArgument($BUCKET_NAME)
    $handle = $ps.BeginInvoke()
    return @{
        PowerShell     = $ps
        Handle         = $handle
        RemoteFilename = $remoteFilename
        FilePath       = $filePath
    }
}

# Descartar y borrar pista pre-subida si el usuario cambia de cancion
function Discard-PreloadedTrack {
    if ($global:PreloadedTrack) {
        if ($global:PreloadedTrack.uploadTask -and $global:PreloadedTrack.uploadTask.PowerShell) {
            try {
                $global:PreloadedTrack.uploadTask.PowerShell.Stop()
                $global:PreloadedTrack.uploadTask.PowerShell.Dispose()
            } catch {}
        }
        if ($global:PreloadedTrack.remoteFilename -and $global:PreloadedTrack.isReady) {
            Write-Host "  [PRE-CARGA DESCARTADA] Borrando pista adelantada no utilizada: $($global:PreloadedTrack.remoteFilename)" -ForegroundColor DarkGray
            Delete-Track -remoteFilename $global:PreloadedTrack.remoteFilename
        }
        $global:PreloadedTrack = $null
    }
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
function Update-CurrentPlay($title, $artist, $cover, $publicUrl, $isPlaying = $true, $preserveTab = $false) {
    $isoNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $headersSync = @{
        "Authorization" = "Bearer $SUPABASE_API_KEY"
        "apikey"        = "$SUPABASE_API_KEY"
        "Content-Type"  = "application/json; charset=utf-8"
    }
    $payloadHash = @{
        station_url    = $publicUrl
        station_name   = $title
        station_artist = $artist
        station_cover  = $cover
        is_playing     = $isPlaying
        updated_at     = $isoNow
    }
    if (-not $preserveTab) {
        $payloadHash["tab"] = "supabase"
    }
    $payload = $payloadHash | ConvertTo-Json -Compress
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

    try {
        $urlCurrent = "$SUPABASE_URL/rest/v1/radio_current_play?id=eq.1"
        Invoke-RestMethod -Uri $urlCurrent -Method Patch -Headers $headersSync -Body $payloadBytes | Out-Null
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
        foreach ($p in ($destPaths | Select-Object -Unique)) {
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
        $reqUrl = "$SUPABASE_URL/rest/v1/playlist_radio?select=*&order=order_index.asc,id.asc"
        $resp = Invoke-WebRequest -Uri $reqUrl -Headers $headers -UseBasicParsing -TimeoutSec 5
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

        # 1. Coincidencia por protocolo local:// o query param ?file=
        if ($url -and $url.StartsWith("local://")) {
            $rawName = [System.Uri]::UnescapeDataString($url.Substring(8))
            $foundFile = $localFilesList | Where-Object { $_.Name -eq $rawName -or $_.FullName -eq $rawName } | Select-Object -First 1
        } elseif ($url -and $url -match "file=([^&]+)") {
            $rawName = [System.Uri]::UnescapeDataString($matches[1])
            $foundFile = $localFilesList | Where-Object { $_.Name -eq $rawName -or $_.FullName -eq $rawName } | Select-Object -First 1
        }

        # 2. Coincidencia por nombre exacto o normalizado
        if (-not $foundFile -and $dbNorm) {
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
                duration    = if ($dbSong.duration -and [int]$dbSong.duration -gt 5) { [int]$dbSong.duration } else { 0 }
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
                duration    = if ($dbSong.duration -and [int]$dbSong.duration -gt 5) { [int]$dbSong.duration } else { 180 }
                filePath    = $null
                remoteUrl   = $url
                order_index = $dbSong.order_index
            })
        }
    }
    return $matched
}

# Localizar el indice de una pista en la lista emparejada
function Find-TrackIndexInQueue($queueList, $track) {
    if (-not $queueList -or $queueList.Count -eq 0 -or -not $track) { return -1 }
    if ($track.id -and $track.id -gt 0 -and $track.id -ne 999) {
        for ($i = 0; $i -lt $queueList.Count; $i++) {
            if ($queueList[$i].id -eq $track.id) { return $i }
        }
    }
    if ($track.filePath) {
        for ($i = 0; $i -lt $queueList.Count; $i++) {
            if ($queueList[$i].filePath -and ($queueList[$i].filePath -eq $track.filePath)) { return $i }
        }
    }
    $tNorm = Normalize-Text $track.title
    if ($tNorm) {
        for ($i = 0; $i -lt $queueList.Count; $i++) {
            if ((Normalize-Text $queueList[$i].title) -eq $tNorm) { return $i }
        }
    }
    return -1
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
    Write-Host "=               Version $version                                   =" -ForegroundColor Cyan
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
$VERSION = "v4.0.0 [Stopwatch Sync & Dual Deck Ready]"
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
    if ($alb.tracks) {
        $totalSongs += [int]$alb.tracks.Count
        foreach ($t in $alb.tracks) {
            if ($t.filePath -and $t.duration -and [int]$t.duration -gt 5) {
                $global:DurationCache[$t.filePath.ToLower()] = [int]$t.duration
            }
        }
    } elseif ($alb.trackCount) {
        $totalSongs += [int]$alb.trackCount
    }
}

$allLocalFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
$seenFilePaths = [System.Collections.Generic.HashSet[string]]::new()
foreach ($f in $folders) {
    if (Test-Path $f) {
        $files = @(Get-ChildItem -Path $f -Filter *.mp3 -Recurse -File)
        foreach ($item in $files) {
            $k = $item.FullName.ToLower()
            if (-not $seenFilePaths.Contains($k)) {
                $seenFilePaths.Add($k) | Out-Null
                $allLocalFiles.Add($item)
            }
        }
    }
}

Cleanup-OrphanLiveFiles

Show-DashboardHeader -version $VERSION -configuredFolders $folders -catalogCount $fullCatalog.Count -songCount $totalSongs

# ==============================================================================
# BUCLE MAESTRO DE EMISION
# ==============================================================================
$previousRemoteFilename = $null
$pendingDeleteFilename = $null
$remoteFilename = $null
$requestedTrack = $null
$currentTrack = $null
$lastQueueIndex = -1
$global:PreloadedTrack = $null
$global:PreviousPreviewFilename = $null
$global:ActivePreviewTask = $null

$vuFrames = @(" ▂▃▅▆▇▆▅▃ ", "▂▃▅▆▇█▇▆▅", "▃▅▆▇██▇▆▅▃", "▅▆▇██▇▆▅▃▂", "▆▇██▇▆▅▃▂ ", "▇██▇▆▅▃▂ ▂", "██▇▆▅▃▂ ▂▃", "▇▆▅▃▂ ▂▃▅")
$vuIndex = 0

try {
    while ($true) {
        # 1. Consultar cola activa en Supabase en cada transicion
        $dbTracks = Get-SupabaseQueue
        $matchedTracks = Match-TracksToLocalFiles -dbList $dbTracks -localFilesList $allLocalFiles
        $isAutoRotation = ($matchedTracks.Count -eq 0)

        $usedPreloaded = $false
        $nextTrackToPlay = $null

        if ($requestedTrack) {
            # Solicitud directa desde Radio Manager o Proyecto Radio
            $nextTrackToPlay = $requestedTrack
            $requestedTrack = $null

            $foundIdx = Find-TrackIndexInQueue -queueList $matchedTracks -track $nextTrackToPlay
            if ($foundIdx -ge 0) {
                $lastQueueIndex = $foundIdx
            }
        } elseif (-not $isAutoRotation) {
            # Determinar siguiente cancion en la cola real actual
            if (-not $currentTrack) {
                $lastQueueIndex = 0
            } else {
                $currIdx = Find-TrackIndexInQueue -queueList $matchedTracks -track $currentTrack
                if ($currIdx -ge 0) {
                    $lastQueueIndex = ($currIdx + 1) % $matchedTracks.Count
                } else {
                    if ($lastQueueIndex -lt 0 -or $lastQueueIndex -ge $matchedTracks.Count) {
                        $lastQueueIndex = 0
                    }
                }
            }
            $nextTrackToPlay = $matchedTracks[$lastQueueIndex]
        } else {
            # Auto-rotacion cuando la cola web esta vacia
            if ($allLocalFiles.Count -eq 0) {
                Write-Host "`r [AVISO] No se encontraron archivos MP3 en las carpetas configuradas." -ForegroundColor Yellow
                Start-Sleep -Seconds 3
                continue
            }
            if ($global:PreloadedTrack -and $global:PreloadedTrack.track) {
                $nextTrackToPlay = $global:PreloadedTrack.track
            } else {
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
                $nextTrackToPlay = [PSCustomObject]@{
                    id          = 0
                    title       = $autoTitle
                    artist      = $autoArtist
                    album       = $randomFile.Directory.Name
                    cover       = ""
                    duration    = (Get-Mp3DurationSeconds $randomFile.FullName)
                    filePath    = $randomFile.FullName
                    order_index = 0
                }
            }
        }

        # Verificar si la pista a reproducir coincide con la pre-cargada en la nube
        if ($global:PreloadedTrack -and $nextTrackToPlay.filePath -and ($global:PreloadedTrack.filePath -eq $nextTrackToPlay.filePath)) {
            if (-not $global:PreloadedTrack.isReady -and $global:PreloadedTrack.uploadTask) {
                Write-Host "`n  [FINALIZANDO SUBIDA ADELANTADA] Esperando confirmacion de subida..." -ForegroundColor DarkCyan
                try {
                    $resWait = $global:PreloadedTrack.uploadTask.PowerShell.EndInvoke($global:PreloadedTrack.uploadTask.Handle)
                    $global:PreloadedTrack.uploadTask.PowerShell.Dispose()
                    $global:PreloadedTrack.uploadTask = $null
                    if ($resWait -contains $true -or $resWait -eq $true) {
                        $global:PreloadedTrack.isReady = $true
                    }
                } catch {}
            }
            if ($global:PreloadedTrack.isReady) {
                $currentTrack = $nextTrackToPlay
                $remoteFilename = $global:PreloadedTrack.remoteFilename
                $publicUrl = $global:PreloadedTrack.publicUrl
                $duration = $global:PreloadedTrack.duration
                $usedPreloaded = $true
                $global:PreloadedTrack = $null
            } else {
                Discard-PreloadedTrack
                $currentTrack = $nextTrackToPlay
            }
        } else {
            Discard-PreloadedTrack
            $currentTrack = $nextTrackToPlay
        }

        # Preparar y subir pista si no estaba pre-cargada
        if ($usedPreloaded) {
            Write-Host "`n-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
            Write-Host " [ON AIR - CAMBIO INSTANTANEO CERO DELAY] Transmitiendo pista pre-subida" -ForegroundColor Green
            Write-Host " Cancion  : $($currentTrack.title)" -ForegroundColor Yellow
            Write-Host " Artista  : $($currentTrack.artist)" -ForegroundColor White
            Write-Host " Album    : $($currentTrack.album)" -ForegroundColor DarkGray
            Write-Host " Duracion : $duration s ($([math]::Round($duration/60, 2)) min)" -ForegroundColor DarkGray

            if ($previousRemoteFilename -and ($previousRemoteFilename -ne $remoteFilename)) {
                $pendingDeleteFilename = $previousRemoteFilename
            }
            $previousRemoteFilename = $remoteFilename
        } elseif ($currentTrack.filePath -and (Test-Path $currentTrack.filePath)) {
            $duration = if ($currentTrack.duration -and $currentTrack.duration -gt 5) { [int]$currentTrack.duration } else { Get-Mp3DurationSeconds $currentTrack.filePath }
            $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            $remoteFilename = "live_$timestamp.mp3"

            Write-Host "`n-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
            if ($isAutoRotation) {
                Write-Host " [ON AIR - AUTO ROTACION] Transmitiendo pista de coleccion local" -ForegroundColor Cyan
            } else {
                Write-Host " [ON AIR - COLA WEB] Pista $($lastQueueIndex + 1) de $($matchedTracks.Count)" -ForegroundColor Green
            }
            Write-Host " Cancion  : $($currentTrack.title)" -ForegroundColor Yellow
            Write-Host " Artista  : $($currentTrack.artist)" -ForegroundColor White
            Write-Host " Album    : $($currentTrack.album)" -ForegroundColor DarkGray
            Write-Host " Duracion : $duration s ($([math]::Round($duration/60, 2)) min)" -ForegroundColor DarkGray

            $uploaded = Upload-Track -filePath $currentTrack.filePath -remoteFilename $remoteFilename
            if (-not $uploaded) {
                Start-Sleep -Seconds 2
                continue
            }

            $publicUrl = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$remoteFilename"

            if ($previousRemoteFilename -and ($previousRemoteFilename -ne $remoteFilename)) {
                $pendingDeleteFilename = $previousRemoteFilename
            }
            $previousRemoteFilename = $remoteFilename
        } else {
            $publicUrl = $currentTrack.remoteUrl
            $duration = if ($currentTrack.duration -and $currentTrack.duration -gt 5) { [int]$currentTrack.duration } else { 180 }
            Write-Host "`n>>> [EMITIENDO REMOTO] $($currentTrack.title)" -ForegroundColor Yellow
        }

        # Notificar nueva pista activa a Supabase
        Update-CurrentPlay -title $currentTrack.title -artist $currentTrack.artist -cover $currentTrack.cover -publicUrl $publicUrl -isPlaying $true
        Write-Host " [TRANSMITIENDO EN VIVO] Sincronizado con pagina web y oyentes.`n" -ForegroundColor Green

        $isPreloadTriggered = $false
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $lastRemoteCheckSec = -1
        $pauseOffsetSeconds = 0

        # Bucle de reproduccion sincronizado con reloj real (Stopwatch)
        while ($true) {
            $sec = [int][math]::Floor($stopwatch.Elapsed.TotalSeconds) + $pauseOffsetSeconds
            if ($sec -ge $duration) {
                break
            }

            # Borrar pista anterior tras 12 segundos de gracia para no cortar el final en celulares
            if ($pendingDeleteFilename -and $sec -ge 12) {
                Delete-Track -remoteFilename $pendingDeleteFilename
                $pendingDeleteFilename = $null
            }

            $pct = [math]::Min(100, [math]::Round(($sec / [math]::Max(1, $duration)) * 100))
            $barsCount = [math]::Min(20, [int]($pct / 5))
            $progressStr = ("#" * $barsCount) + ("-" * (20 - $barsCount))
            $vu = $vuFrames[$vuIndex % $vuFrames.Count]
            $vuIndex++

            $elapsedMin = [int][math]::Floor($sec / 60)
            $elapsedSec = [int]($sec % 60)
            $totalMin = [int][math]::Floor($duration / 60)
            $totalSec = [int]($duration % 60)
            $timeFormatted = "{0:00}:{1:00} / {2:00}:{3:00}" -f $elapsedMin, $elapsedSec, $totalMin, $totalSec

            Write-Host -NoNewline "`r  $vu [ON AIR] [$progressStr] $pct% ($timeFormatted) "

            # Iniciar pre-subida por adelantado de la siguiente cancion a los 4 segundos
            if ($sec -ge 4 -and (-not $isPreloadTriggered) -and (-not $global:PreloadedTrack)) {
                $isPreloadTriggered = $true
                $nextCandidate = $null

                $freshQueue = Get-SupabaseQueue
                if ($freshQueue -and $freshQueue.Count -gt 0) {
                    $freshMatched = Match-TracksToLocalFiles -dbList $freshQueue -localFilesList $allLocalFiles
                    if ($freshMatched.Count -gt 0) {
                        $matchedTracks = $freshMatched
                        $isAutoRotation = $false
                    }
                }

                if ($matchedTracks -and $matchedTracks.Count -gt 0 -and (-not $isAutoRotation)) {
                    $currQIdx = Find-TrackIndexInQueue -queueList $matchedTracks -track $currentTrack
                    if ($currQIdx -ge 0) {
                        $nextIdx = ($currQIdx + 1) % $matchedTracks.Count
                        $nextCandidate = $matchedTracks[$nextIdx]
                    } else {
                        $nextCandidate = $matchedTracks[0]
                    }
                } elseif ($isAutoRotation -and $allLocalFiles.Count -gt 0) {
                    $randomNext = $allLocalFiles | Get-Random
                    $cNameNext = [System.IO.Path]::GetFileNameWithoutExtension($randomNext.Name)
                    $cCleanNext = [System.Text.RegularExpressions.Regex]::Replace($cNameNext, "^\d+[\s\-_.]*", "")
                    $autoArtistNext = "Radio Cafe"
                    $autoTitleNext = $cCleanNext
                    if ($cCleanNext -like "* - *") {
                        $pNext = $cCleanNext -split ' - ', 2
                        $autoArtistNext = $pNext[0].Trim()
                        $autoTitleNext = $pNext[1].Trim()
                    }
                    $nextCandidate = [PSCustomObject]@{
                        id          = 0
                        title       = $autoTitleNext
                        artist      = $autoArtistNext
                        album       = $randomNext.Directory.Name
                        cover       = ""
                        duration    = (Get-Mp3DurationSeconds $randomNext.FullName)
                        filePath    = $randomNext.FullName
                        order_index = 0
                    }
                }

                if ($nextCandidate -and $nextCandidate.filePath -and (Test-Path $nextCandidate.filePath)) {
                    $nextTs = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                    $nextRemoteName = "live_$nextTs.mp3"
                    $nextDur = if ($nextCandidate.duration -and $nextCandidate.duration -gt 5) { [int]$nextCandidate.duration } else { Get-Mp3DurationSeconds $nextCandidate.filePath }
                    $task = Start-AsyncTrackUpload -filePath $nextCandidate.filePath -remoteFilename $nextRemoteName
                    $global:PreloadedTrack = @{
                        track          = $nextCandidate
                        filePath       = $nextCandidate.filePath
                        remoteFilename = $nextRemoteName
                        publicUrl      = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$nextRemoteName"
                        duration       = $nextDur
                        isReady        = $false
                        uploadTask     = $task
                        title          = $nextCandidate.title
                    }
                    Write-Host "`n  [PRE-CARGA] Subiendo por adelantado: '$($nextCandidate.title)'..." -ForegroundColor DarkCyan
                }
            }

            # Chequear si la subida adelantada ya termino
            if ($global:PreloadedTrack -and (-not $global:PreloadedTrack.isReady) -and $global:PreloadedTrack.uploadTask) {
                if ($global:PreloadedTrack.uploadTask.Handle.IsCompleted) {
                    try {
                        $resTask = $global:PreloadedTrack.uploadTask.PowerShell.EndInvoke($global:PreloadedTrack.uploadTask.Handle)
                        $global:PreloadedTrack.uploadTask.PowerShell.Dispose()
                        $global:PreloadedTrack.uploadTask = $null
                        if ($resTask -contains $true -or $resTask -eq $true) {
                            $global:PreloadedTrack.isReady = $true
                            Write-Host "`n  [PRE-CARGA LISTA] '$($global:PreloadedTrack.title)' lista en la nube. ¡Cero delay en transicion!" -ForegroundColor Green
                        } else {
                            $global:PreloadedTrack = $null
                        }
                    } catch {
                        $global:PreloadedTrack = $null
                    }
                }
            }

            # Chequear si una tarea de pre-escucha (CUE) en segundo plano ya termino
            if ($global:ActivePreviewTask -and $global:ActivePreviewTask.UploadTask.Handle.IsCompleted) {
                try {
                    $prevOk = $global:ActivePreviewTask.UploadTask.PowerShell.EndInvoke($global:ActivePreviewTask.UploadTask.Handle)
                    $global:ActivePreviewTask.UploadTask.PowerShell.Dispose()
                    if ($prevOk -contains $true -or $prevOk -eq $true) {
                        if ($global:PreviousPreviewFilename -and $global:PreviousPreviewFilename -ne $global:ActivePreviewTask.PreviewFilename) {
                            Delete-Track -remoteFilename $global:PreviousPreviewFilename
                        }
                        $global:PreviousPreviewFilename = $global:ActivePreviewTask.PreviewFilename
                        $readyPayload = @{
                            tab = "PREVIEW_READY:$($global:ActivePreviewTask.PreviewUrl)||$($global:ActivePreviewTask.ReqTitle)||$($global:ActivePreviewTask.ReqArtist)||$($global:ActivePreviewTask.PreviewDur)"
                        } | ConvertTo-Json -Compress
                        $patchUrl = "$SUPABASE_URL/rest/v1/radio_current_play?id=eq.1"
                        Invoke-RestMethod -Uri $patchUrl -Method Patch -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($readyPayload)) | Out-Null
                        Write-Host "`n  [PRE-ESCUCHA LISTA] '$($global:ActivePreviewTask.ReqTitle)' disponible en Deck Azul." -ForegroundColor Cyan
                    }
                } catch {}
                $global:ActivePreviewTask = $null
            }

            # Control por teclado local
            if ([Console]::KeyAvailable) {
                $key = [Console]::ReadKey($true)
                if ($key.Key -eq [ConsoleKey]::N -or $key.Key -eq [ConsoleKey]::Enter) {
                    Write-Host "`n  [DJ] >> Saltando a la siguiente cancion..." -ForegroundColor Yellow
                    break
                }
                elseif ($key.Key -eq [ConsoleKey]::P -or $key.Key -eq [ConsoleKey]::Spacebar) {
                    $stopwatch.Stop()
                    Write-Host "`n  [PAUSA LOCAL] Emision local en pausa. Presiona cualquier tecla para continuar..." -ForegroundColor Yellow
                    [Console]::ReadKey($true) | Out-Null
                    $stopwatch.Start()
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

            # Chequeo de senales desde la web una vez por segundo real
            if ($sec -ne $lastRemoteCheckSec) {
                $lastRemoteCheckSec = $sec
                Send-BatHeartbeat -sec $sec -duration $duration -currentTitle $currentTrack.title

                try {
                    $checkUrl = "$SUPABASE_URL/rest/v1/radio_current_play?select=station_artist,station_name,station_cover,station_url,tab,updated_at&id=eq.1"
                    $rawResp = Invoke-RestMethod -Uri $checkUrl -Headers $headers -TimeoutSec 3
                    $currentRemote = if ($rawResp -is [System.Array]) { $rawResp[0] } else { $rawResp }

                    $cmdArtist = [string]$currentRemote.station_artist
                    $cmdName   = [string]$currentRemote.station_name
                    $cmdTab    = [string]$currentRemote.tab

                    # 1. Peticion de PRE-ESCUCHA / CUE desde la Biblioteca Web (EN SEGUNDO PLANO ASINCRONO)
                    if ($cmdTab -like "PREVIEW_REQ:*") {
                        $reqPayload = $cmdTab.Substring(12).Trim()
                        try {
                            $ackPayload = @{ tab = "supabase" } | ConvertTo-Json -Compress
                            Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/radio_current_play?id=eq.1" -Method Patch -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($ackPayload)) | Out-Null
                        } catch {}

                        $reqParts = $reqPayload -split '\|\|', 3
                        $reqTitle = $reqParts[0].Trim()
                        $reqArtist = if ($reqParts.Count -gt 1 -and $reqParts[1].Trim()) { $reqParts[1].Trim() } else { "" }
                        $reqFile = if ($reqParts.Count -gt 2 -and $reqParts[2].Trim()) { $reqParts[2].Trim() } else { "" }

                        Write-Host "`n>>> [CUE / PRE-ESCUCHA ASINCRONA] Solicitada de biblioteca: $reqTitle" -ForegroundColor Cyan

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
                            $previewTimestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
                            $previewFilename = "preview_$previewTimestamp.mp3"
                            $previewDur = Get-Mp3DurationSeconds $matchedReq.FullName
                            if (-not $previewDur -or $previewDur -le 0) { $previewDur = 180 }

                            $upTask = Start-AsyncTrackUpload -filePath $matchedReq.FullName -remoteFilename $previewFilename
                            $global:ActivePreviewTask = @{
                                UploadTask      = $upTask
                                PreviewFilename = $previewFilename
                                PreviewUrl      = "$SUPABASE_URL/storage/v1/object/public/$BUCKET_NAME/$previewFilename"
                                ReqTitle        = $reqTitle
                                ReqArtist       = $reqArtist
                                PreviewDur      = $previewDur
                            }
                        } else {
                            Write-Host " [AVISO] Archivo para pre-escucha '$reqTitle' no encontrado en disco." -ForegroundColor Yellow
                        }
                    }
                    # 2. Peticion instantanea de una cancion especifica AL AIRE
                    elseif ($cmdArtist.StartsWith("REQUEST:")) {
                        $reqPayload = $cmdArtist.Substring(8).Trim()
                        $reqParts = $reqPayload -split '\|\|', 3
                        $reqTitle = $reqParts[0].Trim()
                        $reqArtist = if ($reqParts.Count -gt 1 -and $reqParts[1].Trim()) { $reqParts[1].Trim() } else { "Radio Cafe" }
                        $reqFile = if ($reqParts.Count -gt 2 -and $reqParts[2].Trim()) { $reqParts[2].Trim() } else { "" }

                        try {
                            $cleanReq = @{ station_artist = $reqArtist } | ConvertTo-Json -Compress
                            Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/radio_current_play?id=eq.1" -Method Patch -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($cleanReq)) | Out-Null
                        } catch {}

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
                            $requestedTrack = [PSCustomObject]@{
                                id          = 999
                                title       = if ($reqTitle) { $reqTitle } else { [System.IO.Path]::GetFileNameWithoutExtension($matchedReq.Name) }
                                artist      = $reqArtist
                                album       = $matchedReq.Directory.Name
                                cover       = if ($currentRemote.station_cover) { $currentRemote.station_cover } else { "" }
                                duration    = (Get-Mp3DurationSeconds $matchedReq.FullName)
                                filePath    = $matchedReq.FullName
                                order_index = 0
                            }
                            if ($global:PreloadedTrack -and ($matchedReq.FullName -ne $global:PreloadedTrack.filePath)) {
                                Discard-PreloadedTrack
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
                } catch {}
            }

            Start-Sleep -Milliseconds 350
        }
    }
}
finally {
    Write-Host "`n`n>>> [APAGANDO] Limpiando archivos temporales en Supabase Storage..." -ForegroundColor Yellow
    Discard-PreloadedTrack
    if ($pendingDeleteFilename) { Delete-Track -remoteFilename $pendingDeleteFilename }
    if ($previousRemoteFilename) { Delete-Track -remoteFilename $previousRemoteFilename }
    if ($remoteFilename) { Delete-Track -remoteFilename $remoteFilename }
    if ($global:PreviousPreviewFilename) { Delete-Track -remoteFilename $global:PreviousPreviewFilename }
    Cleanup-OrphanLiveFiles
    try {
        if (Test-Path $PID_LOCK_FILE) { Remove-Item $PID_LOCK_FILE -Force -ErrorAction SilentlyContinue }
        $destPaths = @(
            (Join-Path $PSScriptRoot "bat_heartbeat.json"),
            "G:\Mi unidad\Radio\bat_heartbeat.json"
        )
        foreach ($p in ($destPaths | Select-Object -Unique)) {
            if (Test-Path $p) { Remove-Item $p -Force -ErrorAction SilentlyContinue }
        }
    } catch {}
    Update-CurrentPlay -title "Estacion Desconectada" -artist "OFFLINE" -cover "" -publicUrl "" -isPlaying $false
    Write-Host " [OK] Estacion desconectada y estado OFFLINE notificado a la web." -ForegroundColor Green
}
