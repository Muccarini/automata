# Automata Monorepo

Monorepo con split frontend/backend e prima iterazione backend multi-tenant.

## Workspace

- `apps/frontend`: React + Vite + TypeScript
- `apps/backend`: Bun + Elysia + Drizzle + PostgreSQL
- `packages/shared-contracts`: schemi Zod e DTO condivisi

## Prerequisiti

- Node.js 22+
- npm 10+
- Bun 1.1+
- PostgreSQL 15+

## Setup

```bash
npm install
```

## Database bootstrap (schema + RLS + seed)

Assicurati di avere `DATABASE_URL` impostato (default backend: `postgres://postgres:postgres@localhost:5432/automata`).

```bash
npm run db:migrate
npm run db:seed
```

Seed utente demo:

- email: `admin@automata.local`
- password: `admin12345`
- tenant id: `11111111-1111-1111-1111-111111111111`

## Avvio sviluppo

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev:backend
```

Frontend usa `VITE_API_BASE_URL` (default: `http://localhost:3000/api`).

## Quality checks

```bash
npm run lint
npm run build
```

## Note architetturali backend

- Architettura 2-layer: `api` + `bll`
- Multi-tenant e RBAC enforce via PostgreSQL RLS policies
- Ogni request autenticata usa transaction dedicata con:
  - `SET LOCAL app.current_tenant_id`
  - `SET LOCAL request.jwt.claims`

## Rust boundary (design v1, non implementato)

Candidate principali per la futura componente Rust:

- motore runtime di esecuzione grafo (`executor`) per throughput e latenza predicibile
- trasformazioni JSON/mapping ad alto volume

Boundary consigliato per iterazione successiva:

- servizio/worker Rust separato
- protocollo di integrazione HTTP interno o gRPC
- payload versionati tramite contratti condivisi per evitare drift
