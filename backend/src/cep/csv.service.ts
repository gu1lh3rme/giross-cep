import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { CepData } from './cep-data.interface';

@Injectable()
export class CsvService implements OnModuleInit {
  private readonly logger = new Logger(CsvService.name);
  private cepMap: Map<string, CepData> = new Map();
  private cepList: CepData[] = [];
  private loaded = false;

  async onModuleInit() {
    await this.loadCsvData();
  }

  private normalizeCep(cep: string): string {
    return cep.replace('-', '');
  }

  async loadCsvData(): Promise<void> {
    const csvPath = path.join(process.cwd(), 'data', 'ceps.csv');
    
    if (!fs.existsSync(csvPath)) {
      this.logger.warn(`CSV file not found at ${csvPath}. Using empty dataset.`);
      this.loaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const records: CepData[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }))
        .on('data', (row: any) => {
          const lat = parseFloat(row.latitude);
          const lng = parseFloat(row.longitude);
          if (isNaN(lat) || isNaN(lng)) return;
          
          const normalized = this.normalizeCep(row.cep || '');
          if (normalized.length !== 8) return;
          
          const record: CepData = {
            cep: normalized,
            logradouro: row.logradouro || '',
            bairro: row.bairro || '',
            localidade: row.localidade || '',
            uf: row.uf || '',
            latitude: lat,
            longitude: lng,
          };
          records.push(record);
        })
        .on('end', () => {
          for (const record of records) {
            this.cepMap.set(record.cep, record);
          }
          this.cepList = records;
          this.loaded = true;
          this.logger.log(`Loaded ${records.length} CEPs from CSV`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Error loading CSV: ${err.message}`);
          this.loaded = true;
          reject(err);
        });
    });
  }

  getCepByCode(cep: string): CepData | undefined {
    return this.cepMap.get(this.normalizeCep(cep));
  }

  getAllCeps(): CepData[] {
    return this.cepList;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
