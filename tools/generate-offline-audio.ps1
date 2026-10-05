$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$audioDir = Join-Path $projectRoot 'assets\audio\phrases'
$phrasesPath = Join-Path $projectRoot 'content\phrases.json'

New-Item -ItemType Directory -Force -Path $audioDir | Out-Null
Get-ChildItem -LiteralPath $audioDir -Filter '*.wav' | Remove-Item -Force

$voice = New-Object -ComObject SAPI.SpVoice
$zira = @($voice.GetVoices()) | Where-Object { $_.GetDescription() -like '*Zira*' } | Select-Object -First 1
if (-not $zira) { throw 'Brak angielskiego glosu Microsoft Zira.' }
$voice.Voice = $zira
$voice.Rate = -2
$data = Get-Content -LiteralPath $phrasesPath -Raw | ConvertFrom-Json

foreach ($stage in $data.stages) {
  foreach ($item in $stage.items) {
    $path = Join-Path $audioDir ($item.id + '.wav')
    $stream = New-Object -ComObject SAPI.SpFileStream
    $stream.Open($path, 3, $false)
    $voice.AudioOutputStream = $stream
    [void]$voice.Speak($item.en)
    $stream.Close()
  }
}

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($voice) | Out-Null
$files = Get-ChildItem -LiteralPath $audioDir -Filter '*.wav'
if ($files.Count -ne 66 -or ($files | Where-Object Length -eq 0)) {
  throw "Niepelny pakiet audio: $($files.Count) plikow."
}

Write-Output "Wygenerowano $($files.Count) plikow WAV ($([math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 1)) MB)."
