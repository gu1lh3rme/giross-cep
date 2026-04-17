import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('CepController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  it('/cep/search (GET) returns 400 for missing params', () => {
    return request(app.getHttpServer())
      .get('/cep/search')
      .expect(400);
  });

  it('/cep/search (GET) returns 400 for invalid CEP format', () => {
    return request(app.getHttpServer())
      .get('/cep/search?cep=invalid&raioKm=5')
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
