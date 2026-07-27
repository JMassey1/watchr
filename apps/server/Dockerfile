FROM node:24-slim AS base
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

ENV NODE_ENV=production
RUN cd apps/server && bun run build
# Unset (not "false"): t3-env treats any non-empty string, including "false",
# as truthy, so `SKIP_ENV_VALIDATION=false` would keep validation disabled.
# Unsetting it re-enables runtime env validation so missing secrets fail loudly.
ENV SKIP_ENV_VALIDATION=

EXPOSE 3000

WORKDIR /app/apps/server
CMD ["bun", "dist/index.mjs"]
