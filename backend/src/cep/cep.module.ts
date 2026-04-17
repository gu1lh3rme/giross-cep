import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';
import { CsvService } from './csv.service';
import { CepAbertoService } from './cep-aberto.service';
import { DatasetDownloaderService } from './dataset-downloader.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [CepController],
  providers: [CepService, CsvService, CepAbertoService, DatasetDownloaderService],
})
export class CepModule {}
