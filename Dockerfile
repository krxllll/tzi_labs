# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest-10 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# --- runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]