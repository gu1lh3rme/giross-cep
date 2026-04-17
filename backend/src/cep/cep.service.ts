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
    
    for (const item of allCeps) {
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
    
    results.sort((a, b) => a.distanciaKm - b.distanciaKm);
    
    return results;
  }
}
