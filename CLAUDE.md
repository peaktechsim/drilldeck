# DrillDeck — AI Agent Instructions

## Tech Stack
React 19 + Vite 7 + shadcn/ui + TailwindCSS 4 + React Router + TanStack Query
NestJS 11 + Drizzle ORM + PostgreSQL
Single Docker image (NestJS serves React SPA)

## Auth Model
No better-auth. Custom email + 4-digit PIN. PIN hashed with bcrypt.
is_admin boolean on shooters table (default false, set directly in DB).
Frontend stores identity in sessionStorage, passes x-shooter-id and x-shooter-admin headers.

## Coding Standards
- TypeScript strict mode, no any types
- Biome for linting + formatting (not ESLint/Prettier)
- One NestJS module per entity: module + controller + service + dto + spec
- Drizzle ORM for database (NOT Prisma)
- Frontend: pages in src/pages/, hooks in src/hooks/, shadcn/ui components
- Tests: Jest (backend)
- Git: conventional commits, feature branches from main
