import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriodsModule } from './academic-periods/academic-periods.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DtrModule } from './dtr/dtr.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TeachersModule } from './teachers/teachers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Global request-rate limit — a stricter per-route limit is applied to
    // /auth/login and /auth/register specifically (see auth.controller.ts).
    // This baseline matters more than usual on free-tier hosting: the target
    // MySQL provider (Aiven free tier) has a small connection budget, so an
    // unthrottled endpoint is a resource-exhaustion risk, not just a
    // brute-force one.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslCa = configService.get<string>('database.sslCa');
        return {
          type: 'mysql',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          database: configService.get<string>('database.name'),
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.password'),
          ssl: sslCa ? { ca: sslCa } : undefined,
          autoLoadEntities: true,
          synchronize: configService.get<string>('nodeEnv') !== 'production',
          timezone: 'Z',
        };
      },
    }),
    AuthModule,
    UsersModule,
    TeachersModule,
    AcademicPeriodsModule,
    SchedulesModule,
    DtrModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
