FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The DTR Excel master template lives outside dist/ (it's a static asset,
# not TypeScript) — without this the container boots fine but every
# POST /api/dtr/generate 500s with a missing-template error the moment
# someone actually tries to generate a DTR. storage/generated is deliberately
# NOT copied (it's runtime output, .dockerignore already excludes it); the
# app creates it on demand via fs.mkdir(..., { recursive: true }).
COPY --from=build /app/storage/templates ./storage/templates
EXPOSE 3000
# Run pending migrations, then start. Safe to run on every boot: TypeORM
# migrations are tracked in a `migrations` table and each one only runs
# once. If you deploy multiple replicas of this container behind a load
# balancer, move this into the host's separate pre-deploy/release-command
# step instead (Render/Railway both support one) so N replicas don't race
# to run the same migration concurrently on cold start.
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]
