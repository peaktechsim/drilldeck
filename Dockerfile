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
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/migrate.cjs ./migrate.cjs
COPY --from=frontend-build /app/public ./public
RUN npm prune --omit=dev
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "node migrate.cjs && node dist/src/main.js"]
