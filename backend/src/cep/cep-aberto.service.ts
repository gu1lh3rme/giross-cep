import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CepData } from './cep-data.interface';

@Injectable()
export class CepAbertoService {
  private readonly logger = new Logger(CepAbertoService.name);
  private readonly baseURL = 'https://www.cepaberto.com/api/v3';
  private readonly token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('CEP_ABERTO_TOKEN', '');
    
    if (this.isConfigured()) {
      this.logger.log('✅ CEP Aberto configurado com sucesso');
    } else {
      this.logger.warn('⚠️ Token do CEP Aberto não encontrado. Configure CEP_ABERTO_TOKEN no .env');
    }
  }

  /**
   * Busca informações de um CEP específico na API do CEP Aberto
   */
  async findCepByCode(cep: string): Promise<CepData | null> {
    try {
      const normalizedCep = this.normalizeCep(cep);
      this.logger.log(`Buscando CEP ${normalizedCep} na API do CEP Aberto`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseURL}/cep`, {
          params: { cep: normalizedCep },
          headers: {
            Authorization: `Token token=${this.token}`,
          },
        })
      );

      const data = response.data;
      
      if (!data || data.status === 400) {
        this.logger.warn(`CEP ${cep} não encontrado na API`);
        return null;
      }

      return this.mapApiResponseToCepData(data);
    } catch (error: any) {
      this.logger.error(`Erro ao buscar CEP ${cep}:`, error.message);
      throw new HttpException(
        'Erro ao consultar CEP na API externa',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Busca CEPs próximos usando latitude e longitude
   * Método alternativo usando coordenadas geográficas
   */
  async findNearbyByCoordinates(
    lat: number,
    lng: number,
    radius: number = 5000 // metros
  ): Promise<CepData[]> {
    try {
      this.logger.log(`Buscando CEPs próximos a ${lat},${lng} em raio de ${radius}m`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseURL}/address`, {
          params: {
            lat,
            lng,
            radius,
          },
          headers: {
            Authorization: `Token token=${this.token}`,
          },
        })
      );

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((item: any) => this.mapApiResponseToCepData(item));
    } catch (error: any) {
      this.logger.error(`Erro ao buscar CEPs próximos:`, error.message);
      return [];
    }
  }

  /**
   * Busca CEPs de uma cidade específica
   */
  async findCepsByCity(city: string, state: string): Promise<CepData[]> {
    try {
      this.logger.log(`Buscando CEPs da cidade ${city}, ${state}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseURL}/cities`, {
          params: {
            city,
            state,
          },
          headers: {
            Authorization: `Token token=${this.token}`,
          },
        })
      );

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data.map((item: any) => this.mapApiResponseToCepData(item));
    } catch (error: any) {
      this.logger.error(`Erro ao buscar CEPs da cidade ${city}:`, error.message);
      return [];
    }
  }

  /**
   * Mapeia a resposta da API para o formato interno
   */
  private mapApiResponseToCepData(apiData: any): CepData {
    return {
      cep: this.normalizeCep(apiData.cep || ''),
      logradouro: apiData.logradouro || '',
      bairro: apiData.bairro || '',
      localidade: apiData.cidade?.nome || '',
      uf: apiData.estado?.sigla || '',
      latitude: parseFloat(apiData.latitude) || 0,
      longitude: parseFloat(apiData.longitude) || 0,
    };
  }

  /**
   * Remove formatação do CEP
   */
  private normalizeCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  /**
   * Verifica se o token está configurado corretamente
   */
  isConfigured(): boolean {
    return !!this.token && this.token !== 'seu-token-aqui' && this.token.length > 10;
  }
}