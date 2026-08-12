# syntax=docker/dockerfile:1
# 智衡 AI Radar — Phase 12
# Build: docker compose build
# Run:   docker compose up -d

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN mkdir -p public \
  && npm run build

# Thin production web (Next standalone)
FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010
ENV HOSTNAME=0.0.0.0
RUN useradd -m -u 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
# Seed data into image; prefer bind-mount ./data at runtime
COPY --from=builder --chown=nextjs:nextjs /app/data ./data
USER nextjs
EXPOSE 3010
CMD ["node", "server.js"]

# Full tree for intel:refresh / qa (compose profile: tools)
FROM node:22-bookworm-slim AS tools
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json next.config.ts ./
COPY src ./src
COPY scripts ./scripts
COPY mcp ./mcp
COPY data ./data
CMD ["npm", "run", "intel:refresh:offline"]
