import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CepModule } from './cep/cep.module';
import { TelemetryInterceptor } from './telemetry/telemetry.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as configs disponíveis globalmente
      envFilePath: '.env',
    }),
    CepModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
})
export class AppModule {}
