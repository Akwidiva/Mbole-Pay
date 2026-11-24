# Mbole Pay

**A transparent, blockchain-backed platform for njangi (tontine) community savings groups in Cameroon.**

Members contribute, receive rotating payouts through mobile money, and resolve disputes, with every transaction recorded and visible to the whole group.

> Final-year project, BSc Software Engineering, The ICT University (Yaoundé, Cameroon), July 2026. Graded **A**.
> Thesis: *Design and Implementation of a Mobile Based Tontine ("Njangi") Management System integrating blockchain. Case Study: Mbitah's Njangi Group.*
> Author: **Fonguh Joy Akwi** · Supervisor: **Engr. Daniel Moune**

---

## 🎥 Demo video

[▶️ Watch the Mbole Pay walkthrough](https://drive.google.com/file/d/18OGqjz7kciZ8rCFa7mfwq4WRFkCvPjdm/view)

---

## The problem

Millions of Cameroonians save through **njangi**: rotating savings groups where members contribute regularly and take turns receiving the full pot. They run on trust, not paperwork, and are usually managed by hand.

That makes them fragile. In my mother's njangi, the treasurer disappeared with the group's money and every record. There was no backup and no way to prove who had paid what.

## The solution

Mbole Pay keeps everything that makes njangi work, community, rotation and trust, and removes the single point of failure:

| Problem in manual njangi | How Mbole Pay solves it |
|---|---|
| One treasurer holds the money | Payouts are launched by the group and processed automatically through mobile money |
| Records can be lost or altered | Every contribution is logged, and group rules and transactions are recorded with **blockchain smart contracts** |
| Members don't know who has paid | Real-time notifications and a shared contribution history |
| Disagreements have no fair process | Built-in disputes with member voting (uphold / reject) |
| Unknown or fake members | KYC verification |

## Research and validation

- **72 njangi members surveyed** before building, identifying **trust and transparency** as the main concerns
- **Piloted with 6 njangi groups**
- **Feedback sessions with 50+ members**, whose input shaped later improvements
- Regulatory review: COBAC/CEMAC rules, usury rules, and Cameroon's 2024 personal data protection law

---

## Key features

- **Groups:** create and join groups, invitations, group roles (Admin, Treasurer, Member)
- **Contributions:** record contributions, calendar view, statistics
- **Payments:** MTN Mobile Money and Orange Money through the **Fapshi** gateway, with webhooks and retry for failed payments
- **Payouts:** rotating payouts launched by the group and processed automatically
- **Blockchain:** a `NjangiGroupFactory` smart contract on **Polygon Amoy (testnet)** enforces group rules and records transactions
  - Contract: [0xd76D…175AF on PolygonScan](https://amoy.polygonscan.com/address/0xd76D93575Bfa2c99f5dD5E1965220607660175AF)
- **Disputes:** file a dispute and let members vote
- **Notifications:** email and in-app notifications, scheduled reminders
- **Reports:** export group reports as PDF, Excel, CSV or JSON
- **Observability:** health checks, Prometheus metrics, Grafana dashboards, logs and tracing

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Recharts |
| Database | PostgreSQL 16 with Prisma ORM |
| Auth | NextAuth.js |
| Background jobs | BullMQ + Redis 7 |
| Payments | Fapshi (MTN MoMo, Orange Money) |
| Blockchain | Smart contracts on Polygon Amoy testnet |
| Email | Nodemailer (SMTP) |
| Observability | Prometheus, Grafana, Loki, OpenTelemetry |
| Infrastructure | Docker Compose, Kubernetes (Helm), Terraform (AWS) |

## Known limitations and next steps

- **Payment gateway dependency:** payments go through a third-party aggregator (Fapshi) rather than a direct MTN MoMo integration. This is a remaining point of trust I want to reduce.
- **Testnet only:** smart contracts currently run on the Polygon Amoy testnet.
- **Next phase:** credit scoring based on njangi contribution history (an alternative credit signal for people without bank records), fraud detection for mobile money transactions, and early warnings for groups at financial risk.

---

## Run it locally (for reviewers)

**Requirements:** Docker and Docker Compose.

```bash
docker compose up --build
```

This starts the app, PostgreSQL, Redis and the monitoring stack. The first build takes about 2 minutes.

Then open **http://localhost:3000** and sign in with a test account:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@mbolepay.com | Admin123456! |
| Regular user | test@example.com | Test123456 |

> These are local demo accounts seeded for testing only.

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Grafana | http://localhost:3001 (admin / admin) |
| Prometheus | http://localhost:9090 |

To stop: `docker compose down`

<details>
<summary><b>Development mode, environment variables and deployment</b></summary>

### Development mode

```bash
pnpm install
# copy .env.example to .env.local and fill it in
docker compose up -d postgres redis
npx prisma migrate dev
pnpm dev   # http://localhost:3000
```

### Environment variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-to-a-random-secret-key
DATABASE_URL="postgresql://mbole:mbole_password@localhost:5432/mbole_pay"
REDIS_URL=redis://localhost:6379
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@mbolepay.com
FAPSHI_API_USER=your-fapshi-api-user
FAPSHI_API_KEY=your-fapshi-api-key
FAPSHI_BASE_URL=https://sandbox.fapshi.com
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Docker Compose sets `DATABASE_URL` and `REDIS_URL` automatically for containerised runs. Never commit `.env.local` or real credentials.

### Deployment

- **Kubernetes (Helm):** `helm upgrade --install mbole-pay ./helm/mbole-pay --namespace mbole-pay --create-namespace`
- **AWS (Terraform):** provisions VPC, subnets, security groups and RDS PostgreSQL. See [infra/README.md](infra/README.md).

### Project structure

```
app/            Next.js pages and API routes (groups, contributions, payments, disputes, reports, auth)
components/     React components and shadcn/ui
lib/            payments, queue workers, reports, scheduler, services, telemetry
prisma/         database schema and migrations
infra/          Terraform (AWS)
helm/           Kubernetes Helm chart
observability/  Prometheus, Grafana, Loki, OpenTelemetry configs
```

### Troubleshooting

- **Port 3000 in use:** `PORT=3001 pnpm dev`
- **Database error:** check `DATABASE_URL` and run `docker compose ps`
- **Cannot find `@prisma/client`:** `npx prisma generate`
- **Migrations not applied:** `npx prisma migrate dev`

</details>

---

## Author

**Fonguh Joy Akwi**, Software Engineer, Yaoundé, Cameroon
[LinkedIn](https://linkedin.com/in/fonguh-joyakwi) · fonguhjoyakwi@gmail.com
