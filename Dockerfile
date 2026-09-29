# =============================================================================
# Emmanuel Healthcare Data Breach Prevention - React Frontend Dockerfile
# Multi-Stage Production Build: Node 20 Builder -> Hardened Nginx Alpine Runner
# =============================================================================

# Stage 1: Build the optimized static bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies layer
COPY package*.json ./
RUN npm ci

# Copy application source tree
COPY . .

# Build production bundle with TypeScript checking and Vite minification
RUN npm run build

# Stage 2: High-performance lightweight Nginx web server
FROM nginx:alpine

# Install curl or wget for healthcheck
RUN apk add --no-cache curl

# Copy built frontend assets to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy tailored Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck probe against Nginx root
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
