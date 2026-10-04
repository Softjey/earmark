# Railway / Docker image for the Next.js app (devnet). Build from the repo root.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json app/package.json
RUN pnpm install --frozen-lockfile --filter earmark-app...
COPY app app
COPY scripts scripts

# NEXT_PUBLIC_* are inlined by `next build`, so they must exist at build time.
# Railway passes service variables as build args for every ARG declared here.
ARG NEXT_PUBLIC_CLUSTER=devnet
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_PROGRAM_ID
ARG NEXT_PUBLIC_TPLN_MINT
ARG NEXT_PUBLIC_RAMP_API_KEY
ENV NEXT_PUBLIC_CLUSTER=$NEXT_PUBLIC_CLUSTER \
    NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL \
    NEXT_PUBLIC_PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID \
    NEXT_PUBLIC_TPLN_MINT=$NEXT_PUBLIC_TPLN_MINT \
    NEXT_PUBLIC_RAMP_API_KEY=$NEXT_PUBLIC_RAMP_API_KEY
RUN pnpm --dir app build

FROM build AS runtime
ENV NODE_ENV=production
# Metadata lives in Postgres (DATABASE_URL, Railway reference ${{Postgres.DATABASE_URL}}); no volume needed.
# FAUCET_SECRET_KEY is a runtime-only secret: set it in Railway Variables, never as an ARG.
WORKDIR /repo/app
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec next start -H 0.0.0.0 -p ${PORT:-3000}"]
