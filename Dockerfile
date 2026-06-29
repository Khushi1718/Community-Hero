# Use Node 22 as base image (required by puppeteer-core >=25)
FROM node:22-slim AS base

# Install system dependencies needed by Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libnspr4 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    unzip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Skip Puppeteer browser download during npm install (saves time & avoids errors)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Puppeteer doesn't need to download a browser at build time
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Stub out server-side env vars so Next.js build doesn't crash on missing secrets.
# Real values are injected at runtime via Cloud Run / your deployment platform.
ENV MONGODB_URI=mongodb://placeholder:27017/placeholder
ENV GEMINI_API_KEY=placeholder
ENV GMAIL_USER=placeholder@example.com
ENV GMAIL_APP_PASSWORD=placeholder
ENV ENCRYPTION_KEY=placeholder00000000000000000000000
ENV CRM_WEBHOOK_SECRET=placeholder
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_FIREBASE_API_KEY=placeholder
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=placeholder.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=placeholder
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=placeholder.appspot.com
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:placeholder

RUN npm run build

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets from builder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Leverage Next.js standalone output to minimise image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
