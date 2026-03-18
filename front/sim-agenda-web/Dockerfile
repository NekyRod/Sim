# ── Frontend (Multi-stage: Build + Nginx) ────────────
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source code and build
COPY . .

# Build arguments for API URLs (injected at build time)
ARG VITE_BACKEND_URL=/api
ARG VITE_AUTH_SERVICE_URL=/auth
ARG VITE_TOKEN_URL=/auth/token

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_TOKEN_URL=$VITE_TOKEN_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
