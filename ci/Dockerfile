FROM node:24-slim AS base
WORKDIR /www

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /www/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-slim AS runtime
WORKDIR /www

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
COPY --from=deps /www/node_modules ./node_modules
COPY --from=build /www/dist ./dist
COPY --from=build /www/docs ./docs

EXPOSE 8080
CMD ["node", "dist/index.js"]
