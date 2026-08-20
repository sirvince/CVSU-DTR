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

export default new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  ssl: config.database.sslCa ? { ca: config.database.sslCa } : undefined,
  timezone: 'Z',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
