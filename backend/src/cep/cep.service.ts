import { Injectable, NotFoundException } from '@nestjs/common';
import { CsvService } from './csv.service';
import { CepAbertoService } from './cep-aberto.service';
import { haversineDistance } from './haversine.util';
import { CepSearchResult, CepData } from './cep-data.interface';

@Injectable()
export class CepService {
  private cepCache = new Map<string, CepData>();

  constructor(
    private readonly csvService: CsvService,
    private readonly cepAbertoService: CepAbertoService,
  ) {}

  async searchCepsInRadius(cep: string, raioKm: number): Promise<CepSearchResult[]> {
    const normalizedCep = cep.replace(/-/g, '');
    
    // Primeiro tenta buscar o CEP de origem
    let originCep = await this.findCepByCode(normalizedCep);
    
    // 🚨 Se não encontrou via API, tenta nos dados locais por estado
    if (!originCep) {
      console.warn(`🔍 CEP ${normalizedCep} não encontrado via API, tentando dados locais...`);
      
      // Tenta identificar o estado pelo padrão do CEP
      const possibleState = this.identifyStateFromCep(normalizedCep);
      
      if (possibleState) {
        console.log(`🎯 CEP parece ser de ${possibleState}, buscando em dados locais...`);
        const localCep = this.csvService.getStateCepByCode(possibleState, normalizedCep);
        
        if (localCep) {
          // Cria um CEP com coordenadas simuladas baseadas no estado
          const stateCoords = this.csvService.getStateCoordinates(possibleState);
          originCep = {
            cep: localCep.cep,
            logradouro: localCep.logradouro || 'Logradouro Local',
            bairro: localCep.bairro || 'Centro',
            localidade: localCep.localidade || stateCoords.capital,
            uf: possibleState,
            latitude: stateCoords.lat + (Math.random() - 0.5) * 0.1,
            longitude: stateCoords.lng + (Math.random() - 0.5) * 0.1,
          };
          console.log(`✅ CEP encontrado em dados locais de ${possibleState}`);
        }
      }
      
      // Se ainda não encontrou, retorna erro
      if (!originCep) {
        throw new NotFoundException(`CEP ${cep} não encontrado`);
      }
    }

    const results: CepSearchResult[] = [];

    // 🎯 ESTRATÉGIA APRIMORADA: API /nearest + dados locais + busca por cidade
    if (originCep.latitude && originCep.longitude) {
      console.log(`🔍 Iniciando busca otimizada para ${originCep.localidade}, ${originCep.uf}`);
      
      // 1️⃣ BUSCA INICIAL: CEP mais próximo via API /nearest (sempre atualizado)
      if (this.cepAbertoService.isConfigured()) {
        try {
          const nearestCep = await this.cepAbertoService.findNearestByCoordinates(
            originCep.latitude,
            originCep.longitude
          );
          
          if (nearestCep) {
            const distance = haversineDistance(
              originCep.latitude, originCep.longitude,
              nearestCep.latitude, nearestCep.longitude,
            );
            
            if (distance <= raioKm) {
              results.push({
                cep: nearestCep.cep,
                logradouro: nearestCep.logradouro,
                bairro: nearestCep.bairro,
                localidade: nearestCep.localidade,
                uf: nearestCep.uf,
                latitude: nearestCep.latitude,
                longitude: nearestCep.longitude,
                distanciaKm: Math.round(distance * 1000) / 1000,
              });
              console.log(`✅ API /nearest: encontrado CEP ${nearestCep.cep} a ${distance.toFixed(2)}km`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erro na busca via API /nearest:`, error);
        }
      }
      
      // 2️⃣ BUSCA COMPLEMENTAR: CEPs da mesma cidade via API (dados atualizados)
      if (originCep.localidade && this.cepAbertoService.isConfigured()) {
        try {
          const cityResults = await this.cepAbertoService.findCepsFromSameCity(
            originCep.localidade,
            originCep.uf
          );
          
          // Filtra CEPs da cidade por proximidade
          for (const item of cityResults) {
            if (item.latitude && item.longitude) {
              const distance = haversineDistance(
                originCep.latitude,
                originCep.longitude,
                item.latitude,
                item.longitude,
              );

              if (distance <= raioKm) {
                // Evita duplicatas
                const exists = results.find(r => r.cep === item.cep);
                if (!exists) {
                  results.push({
                    cep: item.cep,
                    logradouro: item.logradouro,
                    bairro: item.bairro,
                    localidade: item.localidade,
                    uf: item.uf,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    distanciaKm: Math.round(distance * 1000) / 1000,
                  });
                }
              }
            }
          }
          
          console.log(`✅ API cidade: encontrados ${cityResults.length} CEPs de ${originCep.localidade}`);
        } catch (error) {
          console.warn(`⚠️ Erro na busca por cidade via API:`, error);
        }
      }
      
      const estadosDados = this.csvService.getStatesWithLocalData();
      
      if (estadosDados.includes(originCep.uf)) {
        console.log(`📋 Complementando com dados locais de ${originCep.uf}...`);
        const initialCount = results.length;
        await this.searchStateDataWithCoordinates(originCep, raioKm, results);
        
        const addedFromLocal = results.length - initialCount;
        console.log(`✅ Dados locais: adicionados ${addedFromLocal} CEPs próximos`);
      } else {
        // Para estados sem dados locais, tenta busca individual
        console.log(`🔍 Estado ${originCep.uf} sem dados locais, tentando busca individual...`);
        await this.searchNearbyIndividually(originCep, raioKm, results);
      }
    }

    // 🔄 FALLBACK FINAL: Se não obteve resultados suficientes, busca em todos os dados locais
    if (results.length === 0) {
      console.log(`🔄 Fallback: buscando em todos os dados CSV locais...`);
      const allCeps = this.csvService.getAllCeps();
      
      for (const item of allCeps) {
        const distance = haversineDistance(
          originCep.latitude,
          originCep.longitude,
          item.latitude,
          item.longitude,
        );
        
        if (distance <= raioKm) {
          // Evita duplicatas com resultados já encontrados
          const exists = results.find(r => r.cep === item.cep);
          if (!exists) {
            results.push({
              cep: item.cep,
              logradouro: item.logradouro,
              bairro: item.bairro,
              localidade: item.localidade,
              uf: item.uf,
              latitude: item.latitude,
              longitude: item.longitude,
              distanciaKm: Math.round(distance * 1000) / 1000,
            });
          }
        }
      }
      console.log(`✅ Fallback: encontrados ${results.length} CEPs em todos os dados locais`);
    }

    // Ordena por distância
    results.sort((a, b) => a.distanciaKm - b.distanciaKm);
    
    // 📊 Log final do resultado
    console.log(`🎯 RESULTADO FINAL: ${results.length} CEPs encontrados em raio de ${raioKm}km de ${originCep.cep}`);
    if (results.length > 0) {
      console.log(`📏 Distâncias: ${results[0].distanciaKm}km (mais próximo) até ${results[results.length-1].distanciaKm}km (mais distante)`);
    }
    
    return results;
  }

  /**
   * Busca um CEP por código usando múltiplas fontes
   */
  async findCepByCode(cep: string): Promise<CepData | null> {
    const normalizedCep = cep.replace(/-/g, '');

    // Verifica cache local
    if (this.cepCache.has(normalizedCep)) {
      return this.cepCache.get(normalizedCep)!;
    }

    // Primeiro tenta na API do CEP Aberto (se configurada)
    if (this.cepAbertoService.isConfigured()) {
      try {
        const apiResult = await this.cepAbertoService.findCepByCode(normalizedCep);
        if (apiResult) {
          // Armazena no cache
          this.cepCache.set(normalizedCep, apiResult);
          return apiResult;
        }
      } catch (error: any) {
        console.warn(`Erro ao consultar API: ${error.message}`);
      }
    }

    // Fallback para dados locais
    const localResult = this.csvService.getCepByCode(normalizedCep);
    if (localResult) {
      this.cepCache.set(normalizedCep, localResult);
      return localResult;
    }

    return null;
  }

  /**
   * 🇧🇷 Busca CEPs usando dados locais de qualquer estado brasileiro
   * 🔧 NOVA ESTRATÉGIA: Usa coordenadas médias do estado quando CEP não encontrado na API
   */
  private async searchStateDataWithCoordinates(
    originCep: CepData,
    raioKm: number,
    results: CepSearchResult[]
  ): Promise<void> {
    try {
      const estado = originCep.uf;
      console.log(`📍 Buscando CEPs de ${estado} usando dados locais...`);
      
      // 📍 NOVA LÓGICA: Se coordenadas são 0 ou muito distantes da média do estado,
      // usa coordenadas médias calculadas dinamicamente
      let originLat = typeof originCep.latitude === 'string' ? parseFloat(originCep.latitude) : originCep.latitude;
      let originLng = typeof originCep.longitude === 'string' ? parseFloat(originCep.longitude) : originCep.longitude;
      
      // Verifica se deve usar coordenadas médias calculadas
      const coordenadasMedias = this.csvService.getStateCoordinates(estado);
      if (originLat === 0 || originLng === 0 || !coordenadasMedias) {
        console.log(`⚙️ Usando coordenadas médias calculadas para ${estado}: ${coordenadasMedias?.lat}, ${coordenadasMedias?.lng}`);
        originLat = coordenadasMedias?.lat || originLat;
        originLng = coordenadasMedias?.lng || originLng;
      } else {
        // Verifica se coordenadas estão muito distantes da média do estado
        const distanciaMedia = haversineDistance(originLat, originLng, coordenadasMedias.lat, coordenadasMedias.lng);
        if (distanciaMedia > 50) { // Se > 50km da média do estado
          console.log(`⚙️ Coordenadas muito distantes da média do estado (${distanciaMedia.toFixed(0)}km), usando médias calculadas`);
          originLat = coordenadasMedias.lat;
          originLng = coordenadasMedias.lng;
        }
      }
      
      // Busca TODOS os CEPs do estado (incluindo coordenadas simuladas)
      const estadoCeps = this.csvService.getCepsByRegion(estado);
      console.log(`📋 Encontrados ${estadoCeps.length} CEPs de ${estado} no CSV`);
      
      if (estadoCeps.length === 0) {
        console.log(`⚠️ Nenhum dado local encontrado para ${estado}`);
        return;
      }
      
      // ✅ CORREÇÃO: Aceita CEPs com coordenadas válidas (reais OU simuladas)
      const cepsComCoordenadas = estadoCeps.filter(cep => 
        cep.latitude && cep.longitude && 
        !isNaN(parseFloat(cep.latitude.toString())) && 
        !isNaN(parseFloat(cep.longitude.toString()))
      );
      
      console.log(`🌎 CEPs com coordenadas válidas: ${cepsComCoordenadas.length} de ${estadoCeps.length}`);
      
      if (cepsComCoordenadas.length === 0) {
        console.log(`⚠️ Nenhum CEP com coordenadas válidas encontrado para ${estado}`);
        return;
      }
      
      console.log(`🎯 Testando ${cepsComCoordenadas.length} CEPs de ${estado}...`);
      
      let found = 0;
      let tested = 0;
      
      for (const estadoCepData of cepsComCoordenadas) {
        try {
          tested++;
          
          // 🌎 Usa coordenadas (reais ou simuladas)
          const lat2 = typeof estadoCepData.latitude === 'string' ? parseFloat(estadoCepData.latitude) : estadoCepData.latitude;
          const lon2 = typeof estadoCepData.longitude === 'string' ? parseFloat(estadoCepData.longitude) : estadoCepData.longitude;
          
          // Valida se as coordenadas são números válidos
          if (isNaN(lat2) || isNaN(lon2)) {
            continue;
          }
          
          // Calcula distância entre coordenadas
          const distance = haversineDistance(originLat, originLng, lat2, lon2);

          if (distance <= raioKm) {
            // Evita duplicatas com resultados já encontrados
            const exists = results.find(r => r.cep === estadoCepData.cep);
            if (!exists) {
              results.push({
                cep: estadoCepData.cep,
                logradouro: estadoCepData.logradouro,
                bairro: estadoCepData.bairro,
                localidade: estadoCepData.localidade,
                uf: estado,
                latitude: lat2,
                longitude: lon2,  
                distanciaKm: Math.round(distance * 1000) / 1000,
              });
              found++;
              
              console.log(`✅ CEP ${estadoCepData.cep} (${estadoCepData.localidade}) encontrado a ${distance.toFixed(2)}km`);
            }
          }
          
          // Para se encontrou alguns resultados
          /* if (found >= 15) {
            console.log('⏹️ Parando busca - já encontrados 15 resultados');
            break;
          } */
        } catch (error) {
          // Continua com próximo CEP se um falhar
          continue;
        }
      }
      
      console.log(`✅ Busca de ${estado}: testou ${tested} CEPs, encontrou ${found} próximos`);
      
    } catch (error) {
      console.warn(`Erro na busca de CEPs de ${originCep.uf}:`, error);
    }
  }

  /**
   * 🌐 Busca CEPs próximos individualmente quando a API de proximidade está limitada
   */
  private async searchNearbyIndividually(
    originCep: CepData, 
    raioKm: number, 
    results: CepSearchResult[]
  ): Promise<void> {
    try {
      let candidateCeps: string[] = [];

      // Verifica se temos dados locais para o estado de origem
      const estadosDados = this.csvService.getStatesWithLocalData();
      
      if (estadosDados.includes(originCep.uf)) {
        // 🎯 Se temos dados locais do estado, usa o método de busca por estado
        const estadoCeps = this.csvService.getCepsByRegion(originCep.uf);
        candidateCeps = estadoCeps
          .map(cep => cep.cep)
          .slice(0, 30); // Limita a 30 para não sobrecarregar
        
        console.log(`📍 Encontrados ${estadoCeps.length} CEPs de ${originCep.uf} no CSV local`);
      } else {
        // 🎲 Para estados sem dados locais, gera candidatos baseados no padrão do CEP
        candidateCeps = this.generateNearbyCepCandidates(originCep.cep, raioKm);
        console.log(`🎯 Gerando candidatos para ${originCep.uf} baseados no padrão do CEP`);
      }
      
      // Busca cada CEP candidato individualmente (com limite)
      const maxRequests = Math.min(candidateCeps.length, 20);
      let found = 0;
      
      for (let i = 0; i < maxRequests; i++) {
        try {
          const candidateCep = candidateCeps[i];
          const cepData = await this.cepAbertoService.findCepByCode(candidateCep);
          
          if (cepData && cepData.latitude && cepData.longitude) {
            const distance = haversineDistance(
              originCep.latitude,
              originCep.longitude,
              cepData.latitude,
              cepData.longitude,
            );

            if (distance <= raioKm) {
              // Evita duplicatas com resultados já encontrados
              const exists = results.find(r => r.cep === cepData.cep);
              if (!exists) {
                results.push({
                  cep: cepData.cep,
                  logradouro: cepData.logradouro,
                  bairro: cepData.bairro,
                  localidade: cepData.localidade,
                  uf: cepData.uf,
                  latitude: cepData.latitude,
                  longitude: cepData.longitude,
                  distanciaKm: Math.round(distance * 1000) / 1000,
                });
                found++;
              }
            }
          }
          
          // Delay entre requisições para evitar rate limit
          if (i < maxRequests - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        } catch (error) {
          continue;
        }
      }
      
      console.log(`✅ Busca individual encontrou ${found} CEPs próximos`);
    } catch (error) {
      console.warn('Erro na busca individual:', error);
    }
  }

  /**
   * 🗺️ Identifica o possível estado baseado no padrão do CEP brasileiro
   */
  private identifyStateFromCep(cep: string): string | null {
    const firstTwo = cep.substring(0, 2);
    const firstThree = cep.substring(0, 3);
    
    // Padrões aproximados de CEP por estado
    const cepPatterns: Record<string, string[]> = {
      'SP': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
      'RJ': ['20', '21', '22', '23', '24', '25', '26', '27', '28'],
      'MG': ['30', '31', '32', '33', '34', '35', '36', '37', '38', '39'],
      'ES': ['29'],
      'BA': ['40', '41', '42', '43', '44', '45', '46', '47', '48'],
      'SE': ['49'],
      'PE': ['50', '51', '52', '53', '54', '55', '56'],
      'AL': ['57'],
      'PB': ['58'],
      'RN': ['59'],
      'CE': ['60', '61', '62', '63'],
      'PI': ['64'],
      'MA': ['65'],
      'PA': ['66', '67', '68'],
      'AP': ['68'],
      'AM': ['69'],
      'RR': ['69'],
      'AC': ['69'],
      'DF': ['70', '71', '72', '73'],
      'GO': ['72', '73', '74', '75', '76'],
      'TO': ['77'],
      'MT': ['78'],
      'RO': ['76', '78'],
      'MS': ['79'],
      'PR': ['80', '81', '82', '83', '84', '85', '86', '87'],
      'SC': ['88', '89'],
      'RS': ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99']
    };
    
    // Busca pelo padrão de 2 dígitos
    for (const [state, patterns] of Object.entries(cepPatterns)) {
      if (patterns.includes(firstTwo)) {
        return state;
      }
    }
    
    return null;
  }

  /**
   * Gera CEPs candidatos próximos baseados no CEP de origem
   */
  private generateNearbyCepCandidates(originCep: string, raioKm: number): string[] {
    const candidates = new Set<string>();
    const baseCep = parseInt(originCep);
    
    // Algoritmo simples: varia os 4 últimos dígitos do CEP
    // Para um raio maior, varia mais dígitos
    const variation = raioKm <= 5 ? 100 : raioKm <= 10 ? 500 : 1000;
    
    for (let i = -variation; i <= variation; i += 10) {
      const candidate = (baseCep + i).toString().padStart(8, '0');
      if (candidate.length === 8 && candidate !== originCep) {
        candidates.add(candidate);
      }
    }
    
    // Também tenta variação nos primeiros dígitos para cobrir bairros próximos
    const prefix = originCep.substring(0, 5);
    const basePrefix = parseInt(prefix);
    
    for (let prefixVar = -2; prefixVar <= 2; prefixVar++) {
      const newPrefix = (basePrefix + prefixVar).toString().padStart(5, '0');
      for (let suffix = 0; suffix < 1000; suffix += 100) {
        const candidate = newPrefix + suffix.toString().padStart(3, '0');
        if (candidate !== originCep) {
          candidates.add(candidate);
        }
      }
    }
    
    return Array.from(candidates).slice(0, 50); // Limita a 50 candidatos
  }
}
