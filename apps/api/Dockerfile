# syntax=docker/dockerfile:1

# CARSERVICE API — multi-stage image (CS-M16-S02)
# Build from monorepo root:
#   docker build -f apps/api/Dockerfile -t carservice-api:local .

FROM node:20.20.2-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile-client/package.json apps/mobile-client/
COPY apps/mobile-provider/package.json apps/mobile-provider/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui-tokens/package.json packages/ui-tokens/
RUN pnpm install --frozen-lockfile --filter @carservice/api...

FROM base AS build
COPY --from=deps /app /app
COPY tsconfig.base.json ./
COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
RUN pnpm --filter @carservice/shared-types build \
  && pnpm --filter @carservice/api prisma:generate \
  && pnpm --filter @carservice/api build

FROM node:20.20.2-bookworm-slim AS runner
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api /app/apps/api
COPY --from=build /app/packages/shared-types /app/packages/shared-types
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
