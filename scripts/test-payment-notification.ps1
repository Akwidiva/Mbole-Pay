$response = Invoke-RestMethod -Uri 'http://localhost:3000/api/notifications/dev-send' -Method POST -Body (ConvertTo-Json @{ 
  type = 'PAYMENT_SUCCESS'
  userId = 'user-1'
  data = @{ 
    paymentId='pay-test-001'
    amount=5000
    currency='XAF'
    groupName='Community Savings Group'
    provider='MTN_MOMO'
  } 
}) -ContentType 'application/json' -UseBasicParsing

Write-Host 'Response:' -ForegroundColor Green
Write-Host (ConvertTo-Json $response -Depth 3)
Write-Host 'Event processing... (check dev server logs)' -ForegroundColor Yellow
Start-Sleep -Seconds 3
