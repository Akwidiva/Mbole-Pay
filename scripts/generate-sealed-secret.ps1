param(
  [string]$EnvFile = '.env.secret',
  [string]$Namespace = 'mbole-pay',
  [string]$Name = 'mbole-pay-secrets'
)

if (-Not (Test-Path $EnvFile)) {
  Write-Error "Env file '$EnvFile' not found. Create it from .env.local and do NOT commit it."
  exit 1
}

Write-Output "Creating Kubernetes secret manifest from $EnvFile..."

$secretYaml = kubectl create secret generic $Name --from-env-file=$EnvFile --namespace=$Namespace --dry-run=client -o yaml

Set-Content -Path secret.yaml -Value $secretYaml -Encoding utf8

Write-Output "Sealing secret into sealed-secret.yaml (kubeseal)..."
if (-Not (Get-Command kubeseal -ErrorAction SilentlyContinue)) {
  Write-Error "kubeseal not found in PATH. Install kubeseal: https://github.com/bitnami-labs/sealed-secrets#installation"
  exit 2
}

kubeseal --format yaml < secret.yaml > sealed-secret.yaml

Write-Output "Sealed secret written to sealed-secret.yaml. Review and then commit sealed-secret.yaml to git if desired."
Write-Output "To apply to cluster: kubectl apply -f sealed-secret.yaml --namespace $Namespace"
