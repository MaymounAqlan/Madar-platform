# MADAR Backend Dockerfile
# Multi-stage build for optimized production image

# --- Build Stage ---
FROM node:20-alpine AS builder

# Install build tools for native dependencies (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install dependencies (use npm install if lock file missing)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

# Install runtime dependencies for native modules
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:3001/api/health || exit 1

CMD ["node", "dist/main"]
