FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate && pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_STANDALONE=true
ARG DATABASE_URL=postgresql://mbole:mbole_password@postgres:5432/mbole_pay
ENV NEXT_STANDALONE=$NEXT_STANDALONE
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate && npx prisma generate && npx next build

# Build a standalone prisma-migrate workspace via npm so that node_modules is flat
# (no pnpm .pnpm/ virtual store) and @prisma/engines is reachable in the runner.
RUN apk add --no-cache openssl \
  && PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version") \
  && mkdir -p /prisma-migrate \
  && cd /prisma-migrate \
  && echo '{"name":"prisma-migrate","private":true}' > package.json \
  && npm install --no-save --no-package-lock "prisma@${PRISMA_VER}" \
  && cp -r /app/prisma ./prisma

FROM base AS runner
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Standalone prisma-migrate workspace: prisma CLI + @prisma/engines binary + schema/migrations
COPY --from=builder /prisma-migrate /prisma-migrate

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./docker-entrypoint.sh"]
