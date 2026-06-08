$endpoints = @(
  '/api/groups',
  '/api/dashboard/stats',
  '/api/groups/GROUP_ID',
  '/api/groups/GROUP_ID/analytics',
  '/api/contributions',
  '/api/disputes',
  '/api/notifications/preferences'
)

foreach ($ep in $endpoints) {
  $url = "http://localhost:3000$ep"
  Write-Host "\nChecking: $url" -ForegroundColor Cyan
  try {
    $res = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "Status: $($res.StatusCode)" -ForegroundColor Green
    $content = $res.Content
    if ($content.Length -gt 0) {
      $snippet = $content.Substring(0,[Math]::Min(500,$content.Length))
      Write-Host "Body snippet:" -ForegroundColor Yellow
      Write-Host $snippet
    }
  } catch {
    $err = $_.Exception
    if ($err.Response -ne $null) {
      $status = $err.Response.StatusCode.value__
      Write-Host "Status: $status" -ForegroundColor Yellow
      try {
        $body = (New-Object System.IO.StreamReader($err.Response.GetResponseStream())).ReadToEnd()
        Write-Host "Body snippet:" -ForegroundColor Yellow
        Write-Host $body.Substring(0,[Math]::Min(500,$body.Length))
      } catch { Write-Host "(no body)" }
    } else {
      Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}
