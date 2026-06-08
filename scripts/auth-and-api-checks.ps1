$baseUrl = 'http://localhost:3000'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host 'Fetching CSRF token...' -ForegroundColor Cyan
$csrfResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/csrf" -Method GET -WebSession $session -UseBasicParsing
$csrfToken = $csrfResponse.csrfToken
if (-not $csrfToken) { throw 'Failed to fetch CSRF token' }

Write-Host 'Signing in with seeded credentials...' -ForegroundColor Cyan
$signInBody = @{
  csrfToken = $csrfToken
  email = 'test@example.com'
  password = 'Test123456'
  callbackUrl = "$baseUrl/dashboard"
  json = 'true'
}

$signInResponse = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/callback/credentials?json=true" `
  -Method POST `
  -WebSession $session `
  -Body $signInBody `
  -ContentType 'application/x-www-form-urlencoded' `
  -UseBasicParsing

Write-Host "Sign-in response:" -ForegroundColor Green
$signInResponse | ConvertTo-Json -Depth 5

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
  $url = "$baseUrl$ep"
  Write-Host "`nChecking: $url" -ForegroundColor Cyan
  try {
    $res = Invoke-WebRequest -Uri $url -Method GET -WebSession $session -UseBasicParsing -TimeoutSec 15
    Write-Host "Status: $($res.StatusCode)" -ForegroundColor Green
    if ($res.Content) {
      $snippet = $res.Content.Substring(0, [Math]::Min(500, $res.Content.Length))
      Write-Host 'Body snippet:' -ForegroundColor Yellow
      Write-Host $snippet
    }
  } catch {
    $err = $_.Exception
    if ($err.Response -ne $null) {
      $status = $err.Response.StatusCode.value__
      Write-Host "Status: $status" -ForegroundColor Yellow
      try {
        $body = (New-Object System.IO.StreamReader($err.Response.GetResponseStream())).ReadToEnd()
        if ($body) {
          Write-Host 'Body snippet:' -ForegroundColor Yellow
          Write-Host $body.Substring(0, [Math]::Min(500, $body.Length))
        }
      } catch {
        Write-Host '(no body)' -ForegroundColor DarkYellow
      }
    } else {
      Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}
