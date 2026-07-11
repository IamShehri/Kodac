FROM node:20-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  openssl \
  && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false && npm cache clean --force

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/
COPY config/ ./config/

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS production

# Install production dependencies only
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built artifacts from base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/config ./config
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Expose gateway + metrics
EXPOSE 3000

# Non-root user for security
USER node

# Start the gateway
CMD ["node", "dist/gateway/index.js"]
