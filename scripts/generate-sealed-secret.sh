#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/generate-sealed-secret.sh [namespace] [secret-name]
# Requires: kubectl and kubeseal installed and configured for your cluster

NAMESPACE=${1:-mbole-pay}
NAME=${2:-mbole-pay-secrets}
ENV_FILE=${3:-.env.secret}

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file '$ENV_FILE' not found. Create it from .env.local and do NOT commit it." >&2
  exit 2
fi

echo "Creating Kubernetes Secret manifest from $ENV_FILE..."
kubectl create secret generic "$NAME" --from-env-file="$ENV_FILE" --namespace="$NAMESPACE" --dry-run=client -o yaml > secret.yaml

echo "Sealing secret into sealed-secret.yaml (kubeseal)..."
if ! command -v kubeseal >/dev/null 2>&1; then
  echo "kubeseal not found in PATH. Install kubeseal: https://github.com/bitnami-labs/sealed-secrets#installation" >&2
  exit 3
fi

kubeseal --format yaml < secret.yaml > sealed-secret.yaml

echo "Sealed secret written to sealed-secret.yaml. Review and then commit sealed-secret.yaml to git if desired."
echo "To apply to cluster: kubectl apply -f sealed-secret.yaml --namespace $NAMESPACE"
