# ==========================================
# Stage 1: Build Frontend (Vite + React SPA)
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend (Express + TypeScript)
# ==========================================
FROM node:22-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ==========================================
# Stage 3: Production Runner for Google Cloud Run
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=server-builder /app/server/dist ./dist

# Copy compiled frontend into public folder for Express static serving
COPY --from=client-builder /app/client/dist ./public

# Expose port (Google Cloud Run passes PORT=8080 by default)
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
