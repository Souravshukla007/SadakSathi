# Web app image (Next.js standalone server). Builds on a Pi 4/5 (4 GB+) or cross-builds with
# `docker buildx build --platform linux/arm64`.
FROM node:22-slim AS deps
WORKDIR /app
# Prisma's migration engine needs OpenSSL, which the slim image lacks.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY . .
# Baked into metadata (Open Graph URLs) at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# One-shot migrations + staff seeding (used by the `migrate` service): production deps only.
FROM node:22-slim AS migrate
WORKDIR /app
# Prisma's migration engine needs OpenSSL, which the slim image lacks.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json prisma.config.ts seed-authorities.js ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force
CMD ["sh", "-c", "npx prisma migrate deploy && node seed-authorities.js"]

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Only the traced files the server needs (~10x smaller than a full node_modules).
COPY --from=build --chown=node /app/.next/standalone ./
COPY --from=build --chown=node /app/.next/static ./.next/static
COPY --from=build --chown=node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
