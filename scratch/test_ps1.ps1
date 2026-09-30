$content = Get-Content -Raw -Path "G:\Mi unidad\Radio\radio_station.ps1"
$sb = [scriptblock]::Create($content)
Write-Output "PARSED_SUCCESSFULLY"
