# LiveDisplay Enterprise Server - Production Dockerfile
# Multi-stage build for optimized production image

# ================================
# Dependencies Stage
# ================================
FROM node:20-alpine AS dependencies
LABEL stage=dependencies

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci --include=dev

# ================================
# Build Stage
# ================================
FROM node:20-alpine AS builder
LABEL stage=builder

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Run build steps
RUN npm run lint
RUN npm run test
RUN npm run build || echo "No build script found"

# Remove dev dependencies
RUN npm prune --omit=dev

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS production
LABEL maintainer="LiveDisplay Team"
LABEL version="2.0.0"
LABEL description="LiveDisplay Enterprise Office Management System"

# Install runtime dependencies only
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    ttf-dejavu \
    fontconfig \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S livedisplay -u 1001 -G nodejs

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=livedisplay:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=livedisplay:nodejs /app/src ./src
COPY --from=builder --chown=livedisplay:nodejs /app/package*.json ./
COPY --from=builder --chown=livedisplay:nodejs /app/.env.production.template ./.env.template

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/uploads /app/temp /app/backups && \
    chown -R livedisplay:nodejs /app/logs /app/uploads /app/temp /app/backups

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV TZ=UTC

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Switch to non-root user
USER livedisplay

# Expose port
EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]

# ================================
# Development Stage (optional)
# ================================
FROM dependencies AS development
LABEL stage=development

WORKDIR /app

# Copy source code
COPY . .

# Install nodemon for development
RUN npm install -g nodemon

# Create directories
RUN mkdir -p /app/logs /app/uploads /app/temp

# Set development environment
ENV NODE_ENV=development

# Expose port and debugger port
EXPOSE 4000 9229

# Start with nodemon for development
CMD ["npm", "run", "dev"]


