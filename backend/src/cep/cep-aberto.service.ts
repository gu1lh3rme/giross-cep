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
   * 🎯 BUSCA POR COORDENADAS: Encontra CEP mais próximo usando lat/lng
   * Endpoint: /nearest com parâmetros lat e lng
   * Raio de busca: 10km (limitação da API)
   */
  async findNearestByCoordinates(
    lat: number,
    lng: number
  ): Promise<CepData | null> {
    try {
      this.logger.log(`Buscando CEP mais próximo a ${lat}, ${lng} via API /nearest`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseURL}/nearest`, {
          params: { lat, lng },
          headers: {
            Authorization: `Token token=${this.token}`,
          },
        })
      );

      if (!response.data || Object.keys(response.data).length === 0) {
        this.logger.warn(`Nenhum CEP encontrado próximo a ${lat}, ${lng}`);
        return null;
      }

      const result = this.mapApiResponseToCepData(response.data);
      this.logger.log(`Encontrado CEP ${result.cep} próximo a ${lat}, ${lng}`);
      return result;
    } catch (error: any) {
      this.logger.warn(`Erro ao buscar CEP próximo a ${lat}, ${lng}:`, error.message);
      return null;
    }
  }

  /**
   * 🎯 ESTRATÉGIA HÍBRIDA: Busca CEPs da mesma cidade via API
   * Usa busca por cidade para complementar dados locais
   */
  async findCepsFromSameCity(
    city: string,
    state: string
  ): Promise<CepData[]> {
    try {
      this.logger.log(`Buscando CEPs da cidade ${city}, ${state} via API`);

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
        this.logger.warn(`Nenhum CEP encontrado via API para ${city}, ${state}`);
        return [];
      }

      const mappedResults = response.data.map((item: any) => this.mapApiResponseToCepData(item));
      this.logger.log(`Encontrados ${mappedResults.length} CEPs via API para ${city}, ${state}`);
      return mappedResults;
    } catch (error: any) {
      this.logger.warn(`Erro ao buscar CEPs da cidade ${city}, ${state}:`, error.message);
      return [];
    }
  }

  /**
   * 📋 MÉTODO LEGADO: Busca CEPs de uma cidade específica
   * Use findCepsFromSameCity() para nova implementação otimizada
   */
  async findCepsByCity(city: string, state: string): Promise<CepData[]> {
    return await this.findCepsFromSameCity(city, state);
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
    return !!this.token && this.token.length > 10;
  }
}