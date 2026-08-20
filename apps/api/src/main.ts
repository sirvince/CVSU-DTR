import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api');
  const nodeEnv = configService.get<string>('nodeEnv');
  const corsOrigin = configService.get<string>('corsOrigin');
  // Security: wide-open CORS (reflect any origin) is fine for local dev, but
  // fail loudly at boot if this is still unset in production — the
  // alternative is silently falling back to that same wide-open policy for
  // a real deployment, which defeats the point of restricting it. This
  // guard used to live in configuration.ts, but that factory is also
  // imported by data-source.ts (the migration CLI), which doesn't use CORS
  // at all — putting it there broke `migration:run:prod` in production over
  // a setting migrations never needed. It belongs here instead, right next
  // to the one call that actually consumes corsOrigin.
  if (nodeEnv === 'production' && !corsOrigin) {
    throw new Error('CORS_ORIGIN must be set when NODE_ENV=production');
  }
  app.enableCors({ origin: corsOrigin ?? true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
}
bootstrap().catch((err: unknown) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
