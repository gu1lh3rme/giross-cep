import { Injectable, NotFoundException } from '@nestjs/common';
import { CsvService } from './csv.service';
import { haversineDistance } from './haversine.util';
import { CepSearchResult } from './cep-data.interface';

@Injectable()
export class CepService {
  constructor(private readonly csvService: CsvService) {}

  async searchCepsInRadius(cep: string, raioKm: number): Promise<CepSearchResult[]> {
    const normalizedCep = cep.replace(/-/g, '');
    
    const originCep = this.csvService.getCepByCode(normalizedCep);
    if (!originCep) {
      throw new NotFoundException(`CEP ${cep} não encontrado na base de dados`);
    }

    const allCeps = this.csvService.getAllCeps();
    
    const results: CepSearchResult[] = [];
    const batchSize = 1000; // Processa 1000 CEPs por vez
    
    // Processa em chunks para não bloquear o event loop
    for (let i = 0; i < allCeps.length; i += batchSize) {
      const batch = allCeps.slice(i, i + batchSize);
      
      for (const item of batch) {
        const distance = haversineDistance(
          originCep.latitude,
          originCep.longitude,
          item.latitude,
          item.longitude,
        );
        
        if (distance <= raioKm) {
          results.push({
            cep: item.cep,
            logradouro: item.logradouro,
            bairro: item.bairro,
            localidade: item.localidade,
            uf: item.uf,
            distanciaKm: Math.round(distance * 1000) / 1000,
          });
        }
      }
      
      // Libera o event loop para outras operações
      if (i + batchSize < allCeps.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    results.sort((a, b) => a.distanciaKm - b.distanciaKm);
    
    return results;
  }
}
