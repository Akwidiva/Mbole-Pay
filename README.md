# Mbole Pay

Community savings group management platform (njangi/tontine). Members contribute, receive rotating payouts, and resolve disputes — all digitally, with full transparency.

---

## Running the app

One command starts everything (Next.js app, PostgreSQL, Redis, Prometheus, Grafana, Loki, OTel Collector):

```bash
docker compose up --build
```

First build takes ~2 minutes (pnpm install + Next.js build). Subsequent runs use Docker cache and start in seconds.

What you'll see:
```
app-1  | Running database migrations...
app-1  | No pending migrations to apply.
app-1  | Starting application... http://localhost:3000
app-1  |  ✓ Ready in 129ms
app-1  | [queue] workers started
```

| Service | URL | Credentials |
|---|---|---|
| App | http://localhost:3000 | see Test Accounts below |
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| PostgreSQL | localhost:5432 | mbole / mbole_password |
| Redis | localhost:6379 | — |
| Blockchain (Polygon Amoy) | https://amoy.polygonscan.com/address/0x8a8855cEA52AD03eD4D8D0621E7f20484B731f1c | NjangiGroupFactory contract |
| Deployer wallet | https://amoy.polygonscan.com/address/0x593cb545E30Ed2868B7FfA26A3A6DA9253274508 | — |

To stop: `docker compose down`

---

## Test accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@mbolepay.com | Admin123456! |
| Regular user | test@example.com | Test123456 |

---

## Development mode

For local development with hot reload:

```bash
pnpm install
# configure .env.local (see Environment Variables below)
docker compose up -d postgres redis   # infrastructure only
npx prisma migrate dev
pnpm dev                              # http://localhost:3000
```

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-to-a-random-secret-key

# Database (use localhost:5432 for dev mode, postgres:5432 inside Docker)
DATABASE_URL="postgresql://mbole:mbole_password@localhost:5432/mbole_pay"

# Redis
REDIS_URL=redis://localhost:6379

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@mbolepay.com

# Payment (Fapshi — MTN MoMo / Orange Money aggregator)
FAPSHI_API_USER=your-fapshi-api-user
FAPSHI_API_KEY=your-fapshi-api-key
FAPSHI_BASE_URL=https://sandbox.fapshi.com

# Observability (optional)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

The `docker compose` setup overrides `DATABASE_URL` and `REDIS_URL` automatically to use internal service hostnames — no manual change needed for containerised runs.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, standalone build) |
| Language | TypeScript |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | NextAuth.js |
| Queue | BullMQ + Redis 7 |
| UI | React 18, Tailwind CSS, shadcn/ui, Recharts |
| Payments | Fapshi (MTN MoMo + Orange Money) |
| Email | Nodemailer (SMTP) |
| Observability | Prometheus, Grafana, Loki, OpenTelemetry |
| Infrastructure | Docker Compose, Kubernetes (Helm), Terraform (AWS) |

---

## Project structure

```
app/
├── api/                  # API routes (Next.js route handlers)
│   ├── groups/
│   ├── contributions/
│   ├── payments/
│   ├── disputes/
│   ├── notifications/
│   ├── reports/
│   └── auth/
├── groups/               # Group pages
├── dashboard/            # User dashboard
├── disputes/
├── transactions/
└── (auth)/               # Sign in / sign up

components/               # React components
├── groups/
├── contributions/
├── payments/
├── disputes/
├── analytics/
├── notifications/
└── ui/                   # shadcn/ui base components

lib/
├── payments/             # Fapshi + MTN MoMo provider
├── queue/                # BullMQ workers, queues, enqueue helpers
├── reports/              # PDF, Excel, CSV export (see lib/reports/README.md)
├── scheduler/            # Cron-style notification jobs (see lib/scheduler/README.md)
├── services/             # Email service, notification event handler
├── auth.ts
├── db.ts                 # Prisma client singleton
└── telemetry/            # OpenTelemetry init

prisma/
├── schema.prisma
└── migrations/

infra/                    # Terraform (AWS VPC + RDS) — see infra/README.md
helm/                     # Kubernetes Helm chart
observability/            # Prometheus, Grafana, Loki, OTel configs
```

---

## Key API endpoints

### Groups
```
GET    /api/groups                     List user's groups
POST   /api/groups/create              Create a group
GET    /api/groups/[id]                Group details + members
GET    /api/groups/[id]/analytics      Financial metrics
POST   /api/groups/[id]/contribute     Record a contribution
GET    /api/groups/[id]/members        List members
POST   /api/groups/[id]/invitations    Create invitation
```

### Payments
```
POST   /api/payments/initialize        Initiate Fapshi payment
POST   /api/payments/webhook           Fapshi webhook (status updates)
GET    /api/payments/history           Payment history
POST   /api/payments/[id]/retry        Retry a failed payment
```

### Disputes
```
GET    /api/disputes                   List group disputes
POST   /api/disputes                   File a dispute
POST   /api/disputes/[id]/vote         Vote UPHOLD or REJECT
```

### Contributions
```
GET    /api/contributions              List contributions
GET    /api/contributions/calendar     Calendar view data
GET    /api/contributions/stats        Aggregated stats
```

### Reports
```
POST   /api/reports/generate           Generate PDF/Excel/CSV/JSON report
GET    /api/reports/preview            Preview report data
GET    /api/reports/history            Past generated reports
```

### Observability
```
GET    /api/health                     Basic health check
GET    /api/ready                      Readiness (DB + Redis)
GET    /api/metrics                    Prometheus metrics endpoint
GET    /api/scheduler/status           Scheduler job status
POST   /api/scheduler/trigger          Manually trigger a job
```

---

## Roles and permissions

### System roles (User.role)
| Role | Access |
|---|---|
| SUPER_ADMIN | Full system — manage all users, groups, disputes |
| ADMIN | Manage groups they created or admin |
| USER | Create groups, join groups, participate |

### Group roles (GroupMembership.role)
| Role | Access |
|---|---|
| ADMIN | Full group management, settings, member roles |
| TREASURER | Record payments, generate reports |
| MEMBER | Make contributions, vote on disputes |

---

## Database schema

Core tables: `User`, `Account`, `Session`, `Group`, `GroupMembership`, `Contribution`, `Payment`, `Payout`, `Dispute`, `DisputeVote`, `NotificationPreference`

View or edit live data:
```bash
npx prisma studio
```

---

## Secrets management

**Local development:** `.env.local` (git-ignored). Copy from `.env.example`.

**Kubernetes:**
```bash
kubectl create secret generic mbole-pay-secrets \
  --from-env-file=.env.local \
  --namespace mbole-pay
```

**GitHub Actions:** Store secrets in repo Settings → Secrets and reference as `${{ secrets.DATABASE_URL }}`.

**Production (recommended):** Use HashiCorp Vault or AWS Secrets Manager with a K8s sidecar/init-container to inject secrets at startup. See `kubernetes/sealed-secret-template.yaml` for a Bitnami SealedSecrets example.

Never commit `.env.local` or any file containing real credentials.

---

## Cloud deployment

### Kubernetes (Helm)
```bash
helm upgrade --install mbole-pay ./helm/mbole-pay \
  --namespace mbole-pay \
  --create-namespace \
  --values ./helm/mbole-pay/values.yaml
```

### AWS infrastructure (Terraform)
Provisions VPC, subnets, security groups, and RDS PostgreSQL. See [infra/README.md](infra/README.md).

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars
terraform init && terraform plan -out tfplan && terraform apply tfplan
terraform output -raw database_url   # use this as DATABASE_URL
```

---

## Troubleshooting

**Port 3000 already in use**
```bash
# Kill the process or use a different port:
PORT=3001 pnpm dev
```

**Database connection error**
Verify `DATABASE_URL` in `.env.local` and confirm the postgres container is running (`docker compose ps`).

**`Cannot find module '@prisma/client'`**
```bash
npx prisma generate
```

**Queue workers not connecting**
Verify `REDIS_URL` and confirm the redis container is running.

**Migrations not applied**
```bash
npx prisma migrate dev    # dev
npx prisma migrate deploy # production
```
In Docker, migrations run automatically on container startup.
