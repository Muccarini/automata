FROM oven/bun:1.2.10-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY apps/backend/package.json /app/apps/backend/package.json
COPY packages/shared-contracts/package.json /app/packages/shared-contracts/package.json
COPY packages/shared-contracts/src /app/packages/shared-contracts/src

WORKDIR /app/apps/backend
RUN bun install

# Copy backend sources.
COPY apps/backend/tsconfig.json /app/apps/backend/tsconfig.json
COPY apps/backend/drizzle.config.ts /app/apps/backend/drizzle.config.ts
COPY apps/backend/drizzle /app/apps/backend/drizzle
COPY apps/backend/src /app/apps/backend/src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run src/index.ts"]
