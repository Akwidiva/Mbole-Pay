# Secrets Management (Must have)

This document explains safe handling of secrets for local development, Kubernetes, and CI/CD. Do NOT commit real secret values to the repository.

1) Local development

- Use `.env.local` (Gitignored). Create it from `.env.example`:

```bash
cp .env.example .env.local
# edit .env.local and add real values
```

2) Kubernetes (kubectl)

- Create a namespace for the app if you don't have one:

```bash
kubectl create namespace mbole-pay
```

- Create a generic secret from literals (avoid in plain shell history):

```bash
kubectl create secret generic mbole-pay-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host/db' \
  --from-literal=NEXTAUTH_SECRET='your-secret' \
  --namespace mbole-pay
```

- Or create from a file (recommended for many keys):

```bash
# keep this .env.secret out of git
kubectl create secret generic mbole-pay-secrets --from-env-file=.env.secret --namespace mbole-pay
```

3) Helm

- You can pass values via `--set` or mount secrets via the Kubernetes secret you created above. Example using existing k8s secret (values placeholder):

```yaml
# helm/mbole-pay/values-secrets.yaml (example)
env:
  DATABASE_URL: "{{ .Values.database.url }}"
  NEXTAUTH_SECRET: "{{ .Values.secrets.nextauth }}"
```

- Install with Helm referencing k8s secret values (example pattern):

```bash
helm upgrade --install mbole-pay ./helm/mbole-pay \
  --namespace mbole-pay \
  --set-file env.secret=.env.secret
```

4) GitHub Actions / CI

- Store secrets in GitHub repository or organization Secrets and reference them in workflows:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

steps:
  - name: Build
    run: pnpm build
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

5) Sealed Secrets / External Secrets (recommended for automation)

- For GitOps, use Bitnami SealedSecrets or External Secrets Operator to keep encrypted secrets in git. Example flow:
  - Encrypt Kubernetes Secret into a SealedSecret and commit it
  - Controller in cluster decrypts and materializes a regular Secret

### Generating a SealedSecret (example)

Prerequisites:
- `kubectl` configured for your cluster
- `kubeseal` installed and able to access the SealedSecrets controller public key

1. Create a local env file from `.env.local`:

```bash
cp .env.local .env.secret
```

2. Generate sealed secret (Linux/macOS):

```bash
./scripts/generate-sealed-secret.sh mbole-pay mbole-pay-secrets .env.secret
```

Or on Windows PowerShell:

```powershell
.\scripts\generate-sealed-secret.ps1 -EnvFile .env.secret -Namespace mbole-pay -Name mbole-pay-secrets
```

3. The command creates `sealed-secret.yaml` which you can commit to your repo and apply safely:

```bash
kubectl apply -f sealed-secret.yaml --namespace mbole-pay
```

Notes:
- If your `kubeseal` cannot reach the controller, you can fetch the public key once and use `--cert` with `kubeseal`:

```bash
kubectl get secret -n kube-system sealed-secrets-key -o yaml
# or download public cert from cluster operator and run:
kubeseal --format yaml --cert mycert.pem < secret.yaml > sealed-secret.yaml
```


6) HashiCorp Vault (recommended for large teams)

- Vault provides dynamic secrets, lease/rotate capabilities, and K8s auth. High-level steps:
  - Deploy Vault or use managed Vault
  - Configure Kubernetes auth and a policy for the app
  - Use a sidecar or init script to fetch secrets at startup

7) Best practices

- Never commit `.env.local` or files with secrets.
- Use a secrets manager for production (Vault, Secrets Manager, KeyVault).
- Rotate keys regularly and enforce least privilege.
- Use Kubernetes RBAC and namespaces to limit exposure.

---

## Automated helpers (examples)

- PowerShell helper to create/update a k8s secret from an env file:

```powershell
.\scripts\create-k8s-secret.ps1 -EnvFile .env.secret -SecretName mbole-pay-secrets -Namespace mbole-pay
```

- Example GitHub Actions workflow that creates `.env.secret` from a repository secret and applies it to the cluster is available at `.github/workflows/deploy-with-secrets.yml`.

- If you use GitOps, see `kubernetes/sealed-secret-template.yaml` for a `SealedSecret` template. Generate sealed secrets with `kubeseal` and commit the sealed manifest to your repo.

