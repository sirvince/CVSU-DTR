import { join } from 'node:path';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import configuration from './config/configuration';

// Standalone TypeORM CLI config (migration:generate / migration:run) — kept
// separate from app.module.ts's TypeOrmModule.forRootAsync because the CLI
// runs outside Nest's DI container and needs a plain DataSource instance.
// Reuses configuration()'s env-var reading (including its production JWT
// guard, which is harmless here — it just means DATABASE_* still comes from
// the same single source of truth as the running app, so the two configs
// can't drift apart).
const config = configuration();

// __dirname-relative (not `src/...`) so this resolves correctly both ways:
// via `typeorm-ts-node-commonjs` (running straight from src/, __dirname is
// .../src) and via the plain `typeorm` CLI against the compiled build
// (running from dist/, __dirname is .../dist, where nest build has already
// mirrored every .entity.ts/migrations file to .entity.js). The production
// container only ships dist/ (no src/, no ts-node), so the production
// migration:run script (package.json) needs the .js-only path — see
// "npm run migration:run:prod" and the Dockerfile.
export default new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  ssl: config.database.sslCa ? { ca: config.database.sslCa } : undefined,
  timezone: 'Z',
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
});
