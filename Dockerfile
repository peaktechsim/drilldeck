# Stage 1: Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Vite outputs to ../public = /app/public

# Stage 2: Backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/migrate.cjs ./migrate.cjs
COPY --from=frontend-build /app/public ./public
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "node migrate.cjs; node dist/src/main.js"]
