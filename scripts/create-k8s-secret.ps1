Param(
  [string]$EnvFile = ".env.secret",
  [string]$SecretName = "mbole-pay-secrets",
  [string]$Namespace = "mbole-pay"
)

if (-Not (Test-Path $EnvFile)) {
  Write-Error "Env file '$EnvFile' not found. Create it from .env.example or .env.local (do not commit)."
  exit 1
}

Write-Output "Creating/updating Kubernetes secret '$SecretName' in namespace '$Namespace' from '$EnvFile'..."

$applyCmd = "kubectl create secret generic $SecretName --from-env-file=$EnvFile --namespace=$Namespace --dry-run=client -o yaml | kubectl apply -f -"

Write-Output "Running: $applyCmd"

Invoke-Expression $applyCmd

if ($LASTEXITCODE -ne 0) {
  Write-Error "kubectl command failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Output "Secret applied successfully."
