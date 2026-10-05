$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$montaz = Get-Content (Join-Path $root 'content\montaz.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $root 'assets\audio\tech'
$manifestPath = Join-Path $root 'content\tech-audio.json'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Get-ChildItem $outDir -Filter '*.wav' -ErrorAction SilentlyContinue | Remove-Item -Force

$voice = New-Object -ComObject SAPI.SpVoice
$polish = @($voice.GetVoices()) | Where-Object { $_.GetDescription() -like '*Paulina*' } | Select-Object -First 1
if (-not $polish) { throw 'Brak polskiego glosu Microsoft Paulina.' }
$voice.Voice = $polish
$voice.Rate = -1

$skip = @('id','icon','en','src','source','sources','status','group','stage','chapters','files','prompts')
function Get-SpokenStrings($node, [string]$key = '') {
  $result = New-Object System.Collections.Generic.List[string]
  if ($null -eq $node) { return $result }
  if ($node -is [string]) {
    if ($node -notmatch '^https?://' -and $node.Length -gt 1) { $result.Add($node.Trim()) }
    return $result
  }
  if ($node -is [System.Collections.IEnumerable] -and -not ($node -is [pscustomobject])) {
    foreach ($item in $node) { foreach ($s in (Get-SpokenStrings $item $key)) { $result.Add($s) } }
    return $result
  }
  if ($node -is [pscustomobject]) {
    foreach ($p in $node.PSObject.Properties) {
      if ($skip -contains $p.Name) { continue }
      foreach ($s in (Get-SpokenStrings $p.Value $p.Name)) { $result.Add($s) }
    }
  }
  return $result
}

$tracks = New-Object System.Collections.Generic.List[object]
foreach ($chapter in $montaz.chapters) {
  if ($chapter.id -in @('etapy','slowka','plany')) { continue }
  $summary = [string]$montaz.summary.($chapter.id)
  if ($summary) {
    $tracks.Add([pscustomobject]@{ id = "$($chapter.id)-summary"; chapter = $chapter.id; title = "$($chapter.title) - skrot"; text = "$($chapter.title). $summary" })
  }
  $section = $montaz.($chapter.id)
  if ($null -eq $section) { continue }
  $spoken = @(Get-SpokenStrings $section | Select-Object -Unique)
  $parts = New-Object System.Collections.Generic.List[string]
  $buffer = ''
  foreach ($sentence in $spoken) {
    $candidate = if ($buffer) { "$buffer. $sentence" } else { $sentence }
    if ($candidate.Length -gt 1350 -and $buffer) { $parts.Add($buffer); $buffer = $sentence } else { $buffer = $candidate }
  }
  if ($buffer) { $parts.Add($buffer) }
  for ($i = 0; $i -lt $parts.Count; $i++) {
    $tracks.Add([pscustomobject]@{ id = "$($chapter.id)-detail-$($i+1)"; chapter = $chapter.id; title = "$($chapter.title) - szczegoly $($i+1) z $($parts.Count)"; text = "$($chapter.title). $($parts[$i])" })
  }
}

foreach ($track in $tracks) {
  $track | Add-Member -NotePropertyName audio -NotePropertyValue "assets/audio/tech/$($track.id).wav"
  $path = Join-Path $outDir ($track.id + '.wav')
  $stream = New-Object -ComObject SAPI.SpFileStream
  # 11 kHz / 8 bit / mono: czytelna mowa i ok. 4x mniejszy pakiet niż domyślny WAV.
  $stream.Format.Type = 8
  $stream.Open($path, 3, $false)
  $voice.AudioOutputStream = $stream
  [void]$voice.Speak($track.text)
  $stream.Close()
}
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($voice) | Out-Null
$manifest = [ordered]@{ title = 'Audio techniczne offline'; generated = (Get-Date).ToString('yyyy-MM-dd'); tracks = $tracks }
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
$files = @(Get-ChildItem $outDir -Filter '*.wav')
if ($files.Count -ne $tracks.Count -or @($files | Where-Object Length -eq 0).Count) { throw 'Niepelny pakiet narracji.' }
Write-Output "TECH_AUDIO=$($files.Count) SIZE_MB=$([math]::Round(($files | Measure-Object Length -Sum).Sum/1MB,1))"
