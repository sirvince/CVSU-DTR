const DEV_JWT_SECRET = 'dev-secret-change-me';
const DEV_JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me';

export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const jwtSecret = process.env.JWT_SECRET ?? DEV_JWT_SECRET;
  const jwtRefreshSecret =
    process.env.JWT_REFRESH_SECRET ?? DEV_JWT_REFRESH_SECRET;
  const corsOrigin = process.env.CORS_ORIGIN || undefined;

  // Security: the dev-fallback secrets below are checked into source, so
  // silently running with them in production would let anyone forge a valid
  // JWT for any teacherId/role (full account takeover) — fail startup loudly
  // instead of booting with a known-guessable signing key. Mirrors the
  // production guard app.module.ts already has on `synchronize`. Also fail
  // fast if CORS_ORIGIN is unset in production — the alternative is silently
  // falling back to a wide-open CORS policy in main.ts, which defeats the
  // point of restricting it.
  if (
    nodeEnv === 'production' &&
    (jwtSecret === DEV_JWT_SECRET ||
      jwtRefreshSecret === DEV_JWT_REFRESH_SECRET)
  ) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET must be set to non-default values when NODE_ENV=production',
    );
  }
  if (nodeEnv === 'production' && !corsOrigin) {
    throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
  }

  return {
    nodeEnv,
    // Most managed container hosts (Render, Railway, Fly) inject PORT and
    // require the app to bind to exactly that value, overriding whatever
    // app-level default is configured — so PORT wins over APP_PORT when set.
    port: parseInt(process.env.PORT ?? process.env.APP_PORT ?? '3000', 10),
    timezone: process.env.APP_TIMEZONE ?? 'Asia/Manila',
    // Unset (undefined) locally — main.ts falls back to a permissive dev
    // policy in that case. Guaranteed set here whenever NODE_ENV=production,
    // per the guard above.
    corsOrigin,
    database: {
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
      name: process.env.DATABASE_NAME ?? 'teacher_dtr',
      user: process.env.DATABASE_USER ?? 'root',
      password: process.env.DATABASE_PASSWORD ?? '',
      // Managed MySQL providers (e.g. Aiven) require SSL; local docker-compose
      // MySQL doesn't, so this is undefined (no ssl option passed) unless set.
      sslCa: process.env.DATABASE_SSL_CA || undefined,
    },
    jwt: {
      secret: jwtSecret,
      refreshSecret: jwtRefreshSecret,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    dtr: {
      templatePath:
        process.env.DTR_TEMPLATE_PATH ??
        'storage/templates/dtr/DTR-FORMAT-MASTER.xlsx',
      storagePath: process.env.STORAGE_PATH ?? 'storage/generated',
    },
  };
};
