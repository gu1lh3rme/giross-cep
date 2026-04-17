import { Module } from '@nestjs/common';
import { CepController } from './cep.controller';
import { CepService } from './cep.service';
import { CsvService } from './csv.service';

@Module({
  controllers: [CepController],
  providers: [CepService, CsvService],
})
export class CepModule {}
