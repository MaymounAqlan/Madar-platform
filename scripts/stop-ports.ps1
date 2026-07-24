$ports = @(3000, 3001, 8000)
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
      Write-Host "Stopping PID $($conn.OwningProcess) on port $port ($($proc.ProcessName))"
      Stop-Process -Id $conn.OwningProcess -Force
    }
  }
}
Start-Sleep -Seconds 3
foreach ($port in $ports) {
  $remaining = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($remaining) {
    Write-Host "Port $port still in use"
  } else {
    Write-Host "Port $port is free"
  }
}
