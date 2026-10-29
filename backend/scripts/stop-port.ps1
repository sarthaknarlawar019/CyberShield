param(
  [int]$Port = 5000
)

$portPattern = "[:.]$Port\s+.*\s+LISTENING\s+(\d+)$"
$connections = netstat -ano | Select-String -Pattern $portPattern

if (-not $connections) {
  Write-Host "No process is listening on port $Port."
  exit 0
}

$pids = $connections | ForEach-Object {
  $_.Matches[0].Groups[1].Value
} | Select-Object -Unique

foreach ($processId in $pids) {
  Write-Host "Stopping process $processId on port $Port..."
  taskkill /PID $processId /F | Out-Host
}
