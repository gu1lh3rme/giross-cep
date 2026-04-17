import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TelemetryInterceptor } from './telemetry/telemetry.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.useGlobalInterceptors(new TelemetryInterceptor());
  
  const config = new DocumentBuilder()
    .setTitle('CEP Search API')
    .setDescription('API for searching CEPs within a geographic radius')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(3001);
  console.log('Application running on: http://localhost:3001');
  console.log('Swagger docs: http://localhost:3001/api');
}
bootstrap();
