import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { CepData } from './cep-data.interface';

// 🗺️ Coordenadas regionais aproximadas para estados brasileiros
const ESTADO_COORDENADAS = {
  'AC': { lat: -9.0238, lng: -70.8120, nome: 'Acre', capital: 'Rio Branco' },
  'AL': { lat: -9.5713, lng: -36.7820, nome: 'Alagoas', capital: 'Maceió' },
  'AP': { lat: 0.9020, lng: -52.0030, nome: 'Amapá', capital: 'Macapá' },
  'AM': { lat: -2.1401, lng: -59.9200, nome: 'Amazonas', capital: 'Manaus' },
  'BA': { lat: -12.9500, lng: -38.4619, nome: 'Bahia', capital: 'Salvador' },
  'CE': { lat: -3.1190, lng: -40.3490, nome: 'Ceará', capital: 'Fortaleza' },
  'DF': { lat: -15.7998, lng: -47.8645, nome: 'Distrito Federal', capital: 'Brasília' },
  'ES': { lat: -20.2976, lng: -40.2958, nome: 'Espírito Santo', capital: 'Vitória' },
  'GO': { lat: -16.6864, lng: -49.2643, nome: 'Goiás', capital: 'Goiânia' },
  'MA': { lat: -2.5387, lng: -44.2825, nome: 'Maranhão', capital: 'São Luís' },
  'MT': { lat: -12.6819, lng: -56.9211, nome: 'Mato Grosso', capital: 'Cuiabá' },
  'MS': { lat: -20.4697, lng: -54.6201, nome: 'Mato Grosso do Sul', capital: 'Campo Grande' },
  'MG': { lat: -19.9191, lng: -43.9386, nome: 'Minas Gerais', capital: 'Belo Horizonte' },
  'PA': { lat: -5.5190, lng: -52.0368, nome: 'Pará', capital: 'Belém' },
  'PB': { lat: -7.2400, lng: -36.7820, nome: 'Paraíba', capital: 'João Pessoa' },
  'PR': { lat: -24.8960, lng: -51.4292, nome: 'Paraná', capital: 'Curitiba' },
  'PE': { lat: -8.8137, lng: -36.9541, nome: 'Pernambuco', capital: 'Recife' },
  'PI': { lat: -8.8137, lng: -42.4637, nome: 'Piauí', capital: 'Teresina' },
  'RJ': { lat: -22.9068, lng: -43.1729, nome: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
  'RN': { lat: -5.4026, lng: -36.9541, nome: 'Rio Grande do Norte', capital: 'Natal' },
  'RS': { lat: -30.0346, lng: -51.2177, nome: 'Rio Grande do Sul', capital: 'Porto Alegre' },
  'RO': { lat: -11.5057, lng: -63.5806, nome: 'Rondônia', capital: 'Porto Velho' },
  'RR': { lat: 1.4554, lng: -60.4790, nome: 'Roraima', capital: 'Boa Vista' },
  'SC': { lat: -27.5969, lng: -48.549, nome: 'Santa Catarina', capital: 'Florianópolis' },
  'SP': { lat: -23.5505, lng: -46.6333, nome: 'São Paulo', capital: 'São Paulo' },
  'SE': { lat: -10.9472, lng: -37.0731, nome: 'Sergipe', capital: 'Aracaju' },
  'TO': { lat: -10.1753, lng: -48.2982, nome: 'Tocantins', capital: 'Palmas' }
};

@Injectable()
export class CsvService implements OnModuleInit {
  private readonly logger = new Logger(CsvService.name);
  private cepMap: Map<string, CepData> = new Map();
  private cepList: CepData[] = [];
  private stateDataMap: Map<string, Map<string, any>> = new Map(); // Map de estado -> Map de CEPs
  private loaded = false;
  
  // 🏛️ Lookup tables para relacionamentos CEP Aberto
  private statesLookup = new Map<number, {nome: string, sigla: string}>();
  private citiesLookup = new Map<number, {nome: string, estadoId: number}>();
  private lookupTablesLoaded = false;

  // 📍 Cache de coordenadas médias calculadas dinamicamente para cada estado
  private estadoCoordenadasCalculadas = new Map<string, {lat: number, lng: number, count: number}>();

  async onModuleInit() {
    await this.loadLookupTables(); // 📚 Carrega tabelas de referência primeiro
    await this.loadCsvData();
    await this.loadAllStatesData(); // 🇧🇷 Carrega dados de todos os estados
    this.calcularCoordenadasMediasEstado(); // 📍 Calcula coordenadas médias reais (APÓS simular coordenadas)
  }

  /**
   * 📚 Carrega tabelas de lookup (states.csv e cities.csv)
   */
  private async loadLookupTables(): Promise<void> {
    if (this.lookupTablesLoaded) return;
    
    const dataPath = path.join(process.cwd(), 'data');
    
    // 🏛️ Carrega states.csv (ID, Nome, Sigla)
    await this.loadStatesLookup(path.join(dataPath, 'states.csv'));
    
    // 🏙️ Carrega cities.csv (ID, Nome, ID_Estado)
    await this.loadCitiesLookup(path.join(dataPath, 'cities.csv'));
    
    this.lookupTablesLoaded = true;
    this.logger.log(`📚 Lookup tables carregadas: ${this.statesLookup.size} estados, ${this.citiesLookup.size} cidades`);
  }
  
  /**
   * 🗺️ Carrega mapeamento de estados
   */
  private async loadStatesLookup(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`States file not found: ${filePath}`);
      return;
    }
    
    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(parse({skip_empty_lines: true, trim: true,}))
        .on('data', (row: any) => {
          if (Array.isArray(row) && row.length >= 3) {
            const [id, nome, sigla] = row;
            const stateId = parseInt(id);
            if (!isNaN(stateId)) {
              this.statesLookup.set(stateId, {
                nome: nome.trim(),
                sigla: sigla.trim()
              });
            }
          }
        })
        .on('end', () => resolve())
        .on('error', (err) => {
          this.logger.error(`Error loading states: ${err.message}`);
          resolve();
        });
    });
  }
  
  /**
   * 🏙️ Carrega mapeamento de cidades
   */
  private async loadCitiesLookup(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Cities file not found: ${filePath}`);
      return;
    }
    
    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(parse({skip_empty_lines: true, trim: true,}))
        .on('data', (row: any) => {
          if (Array.isArray(row) && row.length >= 3) {
            const [id, nome, estadoId] = row;
            const cityId = parseInt(id);
            const stateId = parseInt(estadoId);
            if (!isNaN(cityId) && !isNaN(stateId)) {
              this.citiesLookup.set(cityId, {
                nome: nome.trim(),
                estadoId: stateId
              });
            }
          }
        })
        .on('end', () => resolve())
        .on('error', (err) => {
          this.logger.error(`Error loading cities: ${err.message}`);
          resolve();
        });
    });
  }

  /**
   * 📍 Calcula coordenadas médias reais de CEPs para cada estado
   */
  private calcularCoordenadasMediasEstado(): void {
    console.log('📊 Calculando coordenadas médias reais por estado...');
    
    this.estadoCoordenadasCalculadas.clear();
    
    // 1️⃣ Percorre CEPs gerais (arquivo ceps.csv)
    for (const cepData of this.cepList) {
      if (cepData.latitude && cepData.longitude && cepData.latitude !== 0 && cepData.longitude !== 0) {
        this.adicionarCoordenadasMedia(cepData.uf, cepData.latitude, cepData.longitude);
      }
    }
    
    // 2️⃣ Percorre CEPs de estados específicos (arquivos estaduais com coordenadas simuladas)
    for (const [uf, cepMap] of this.stateDataMap.entries()) {
      for (const cepData of cepMap.values()) {
        if (cepData.latitude && cepData.longitude && cepData.latitude !== 0 && cepData.longitude !== 0) {
          this.adicionarCoordenadasMedia(uf, cepData.latitude, cepData.longitude);
        }
      }
    }
    
    // 📊 Log das coordenadas calculadas
    for (const [uf, coords] of this.estadoCoordenadasCalculadas.entries()) {
      console.log(`📍 ${uf}: lat=${coords.lat.toFixed(4)}, lng=${coords.lng.toFixed(4)} (${coords.count} CEPs)`);
    }
  }

  /**
   * 📊 Método auxiliar para atualizar coordenadas médias incrementalmente
   */
  private adicionarCoordenadasMedia(uf: string, latitude: number, longitude: number): void {
    const existing = this.estadoCoordenadasCalculadas.get(uf);
    if (existing) {
      // Atualiza média incremental
      existing.count++;
      existing.lat = (existing.lat * (existing.count - 1) + latitude) / existing.count;
      existing.lng = (existing.lng * (existing.count - 1) + longitude) / existing.count;
    } else {
      // Primeira coordenada do estado
      this.estadoCoordenadasCalculadas.set(uf, {
        lat: latitude,
        lng: longitude,
        count: 1
      });
    }
  }

  private normalizeCep(cep: string): string {
    return cep.replace(/-/g, '');
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
    const normalizedCep = this.normalizeCep(cep);
    
    // 🔍 Primeiro busca nos dados gerais (ceps.csv)
    const generalResult = this.cepMap.get(normalizedCep);
    if (generalResult) {
      return generalResult;
    }

    // 🇧🇷 Se não encontrou, busca nos dados específicos dos estados
    for (const [uf, stateMap] of this.stateDataMap) {
      const stateResult = stateMap.get(normalizedCep);
      if (stateResult) {
        console.log(`🎯 CEP ${normalizedCep} encontrado nos dados locais de ${uf}`);
        return stateResult;
      }
    }

    return undefined;
  }

  getAllCeps(): CepData[] {
    return this.cepList;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 🇧🇷 Carrega dados de CEPs de todos os estados brasileiros
   */
  async loadAllStatesData(): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data');
    
    for (const [uf, coordenadas] of Object.entries(ESTADO_COORDENADAS)) {
      await this.loadStateData(uf, coordenadas);
    }
    
    this.logger.log(`📊 Total de estados com dados locais: ${this.stateDataMap.size}`);
  }

  /**
   * Carrega dados de um estado específico
   * 🔄 Suporta múltiplos padrões: {estado}.cepaberto_parte_N.csv e ceps-{estado}.csv
   */
  private async loadStateData(uf: string, coordenadas: any): Promise<void> {
    const dataPath = path.join(process.cwd(), 'data');
    
    // 🔍 Tenta múltiplos padrões de nomenclatura
    const possibleFiles = [
      // Novo padrão do CEP Aberto: {estado}.cepaberto_parte_N.csv
      ...this.getCepAbertoFiles(dataPath, uf),
      // Padrão antigo: ceps-{estado}.csv  
      path.join(dataPath, `ceps-${uf.toLowerCase()}.csv`)
    ].filter(file => fs.existsSync(file));

    if (possibleFiles.length === 0) {
      // Não é erro - apenas não temos dados locais para este estado
      return;
    }

    this.logger.log(`📂 Encontrados ${possibleFiles.length} arquivo(s) para ${uf}: ${possibleFiles.map(f => path.basename(f)).join(', ')}`);
    
    // Carrega todos os arquivos encontrados para o estado
    const stateMap = new Map<string, any>();
    let totalRecords = 0;
    
    for (const csvPath of possibleFiles) {
      const records = await this.loadSingleCsvFile(csvPath, uf, coordenadas, stateMap);
      totalRecords += records;
    }
    
    if (totalRecords > 0) {
      this.stateDataMap.set(uf, stateMap);
      this.logger.log(`✅ ${uf}: ${totalRecords} CEPs carregados de ${possibleFiles.length} arquivo(s)`);
    }
  }
  
  /**
   * 🔍 Busca todos os arquivos CEP Aberto para um estado (suporta múltiplas partes)
   */
  private getCepAbertoFiles(dataPath: string, uf: string): string[] {
    const files: string[] = [];
    let part = 1;
    
    while (true) {
      const filePath = path.join(dataPath, `${uf.toLowerCase()}.cepaberto_parte_${part}.csv`);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
        part++;
      } else {
        break;
      }
    }
    
    return files;
  }
  
  /**
   * 📄 Carrega um único arquivo CSV
   */
  private async loadSingleCsvFile(csvPath: string, uf: string, coordenadas: any, stateMap: Map<string, any>): Promise<number> {
    return new Promise((resolve) => {
      let records = 0;
      
      fs.createReadStream(csvPath)
        .pipe(parse({
          skip_empty_lines: true,
          trim: true,
          delimiter: ',',
        }))
        .on('data', (row: any) => {
          if (Array.isArray(row) && row.length >= 5) {
            const [cep, logradouro, complemento, bairro, cidadeId, estadoId] = row;
            
            if (cep && cep.length === 8) {
              const normalized = this.normalizeCep(cep);
              
              // 🔍 Resolve localidade usando lookup tables
              const localidade = this.resolveLocalidadeFromIds(
                parseInt(cidadeId), 
                parseInt(estadoId), 
                coordenadas
              );
              
              // 🌍 Gera coordenadas simuladas baseadas no estado
              const simulatedCoords = this.generateStateCoordinates(uf, coordenadas, normalized);
              
              stateMap.set(normalized, {
                cep: normalized,
                logradouro: logradouro || '',
                complemento: complemento || '',
                bairro: bairro || '',
                localidade: localidade,
                uf: uf,
                latitude: simulatedCoords.lat,
                longitude: simulatedCoords.lng,
              });
              records++;
            }
          }
        })
        .on('end', () => {
          this.logger.log(`📊 Arquivo ${path.basename(csvPath)}: ${records} CEPs processados`);
          resolve(records);
        })
        .on('error', (err) => {
          this.logger.warn(`⚠️ Erro ao carregar ${csvPath}: ${err.message}`);
          resolve(0);
        });
    });
  }

  /**
   * 🗺️ Busca CEPs de uma região específica (qualquer estado brasileiro)
   */
  getCepsByRegion(uf: string): any[] {
    if (this.stateDataMap.has(uf)) {
      return Array.from(this.stateDataMap.get(uf)!.values());
    }
    
    // Fallback para dados gerais se não tiver dados específicos
    return this.cepList.filter(cep => cep.uf === uf);
  }

  /**
   * 📍 Busca CEP específico no dataset de um estado
   */
  getStateCepByCode(uf: string, cep: string): any | undefined {
    const stateMap = this.stateDataMap.get(uf);
    if (stateMap) {
      return stateMap.get(this.normalizeCep(cep));
    }
    return undefined;
  }

  /**
   * 🔍 Resolve localidade usando IDs relacionais dos arquivos de lookup
   */
  private resolveLocalidadeFromIds(cidadeId: number, estadoId: number, coordenadas: any): string {
    // 1️⃣ Primeiro tenta buscar pelo ID da cidade
    if (!isNaN(cidadeId)) {
      const cidade = this.citiesLookup.get(cidadeId);
      if (cidade) {
        return cidade.nome;
      }
    }
    
    // 2️⃣ Se não encontrar, tenta pelo ID do estado 
    if (!isNaN(estadoId)) {
      const estado = this.statesLookup.get(estadoId);
      if (estado) {
        return estado.nome; // Usa nome do estado como fallback
      }
    }
    
    // 3️⃣ Último fallback: capital do estado do arquivo de coordenadas
    return coordenadas.capital;
  }

  /**
   * � Gera coordenadas simuladas baseadas no estado e CEP
   */
  private generateStateCoordinates(uf: string, coordenadas: any, cep: string): {lat: number, lng: number} {
    // Base coordinates são do centro/capital do estado
    const baseLat = coordenadas.lat;
    const baseLng = coordenadas.lng;
    
    // 🧮 Usa dígitos do CEP para criar variação determinística
    const cepNumber = parseInt(cep.substring(0, 8));
    const seed = cepNumber % 1000; // Usa últimos 3 dígitos como seed
    
    // 📍 Gera variação baseada no CEP (determinística para o mesmo CEP)
    const latVariation = ((seed % 100) - 50) * 0.004; // ±0.2 grau aprox (maior dispersão)
    const lngVariation = (((seed / 100) % 100) - 50) * 0.004;
    
    // 🗺️ Ajuste específico por estado para melhor distribuição geográfica
    const stateFactors = {
      // ✅ REGIÃO SUL
      'PR': { latRange: 0.6, lngRange: 0.5 }, // Curitiba, Londrina, Maringá
      'SC': { latRange: 0.6, lngRange: 0.5 }, // Florianópolis, Joinville, Blumenau  
      'RS': { latRange: 0.8, lngRange: 0.6 }, // Porto Alegre, Caxias do Sul, Pelotas
      
      // ✅ REGIÃO SUDESTE
      'SP': { latRange: 0.7, lngRange: 0.6 }, // Grande São Paulo, interior extenso
      'RJ': { latRange: 0.5, lngRange: 0.4 }, // Rio, Niterói, Baixada Fluminense
      'MG': { latRange: 1.0, lngRange: 0.8 }, // Estado extenso: BH, interior
      'ES': { latRange: 0.6, lngRange: 0.5 }, // Vitória, Vila Velha, Serra
      
      // ✅ REGIÃO CENTRO-OESTE  
      'GO': { latRange: 0.8, lngRange: 0.7 }, // Goiânia, interior extenso
      'MT': { latRange: 1.2, lngRange: 1.0 }, // Estado imenso: Cuiabá, interior
      'MS': { latRange: 0.9, lngRange: 0.8 }, // Campo Grande, Dourados
      'DF': { latRange: 0.4, lngRange: 0.4 }, // Brasília, área metropolitana
      
      // ✅ REGIÃO NORDESTE
      'BA': { latRange: 1.0, lngRange: 0.9 }, // Salvador, interior extenso
      'PE': { latRange: 0.6, lngRange: 0.5 }, // Recife, Caruaru, Petrolina
      'CE': { latRange: 0.7, lngRange: 0.6 }, // Fortaleza, interior
      'PB': { latRange: 0.5, lngRange: 0.4 }, // João Pessoa, Campina Grande
      'RN': { latRange: 0.5, lngRange: 0.4 }, // Natal, Mossoró  
      'AL': { latRange: 0.4, lngRange: 0.4 }, // Maceió, Arapiraca
      'SE': { latRange: 0.3, lngRange: 0.3 }, // Aracaju, menor estado
      'PI': { latRange: 0.6, lngRange: 0.5 }, // Teresina, Parnaíba
      'MA': { latRange: 0.8, lngRange: 0.7 }, // São Luís, interior extenso
      
      // ✅ REGIÃO NORTE
      'AM': { latRange: 1.5, lngRange: 1.4 }, // Estado imenso: Manaus, interior
      'PA': { latRange: 1.2, lngRange: 1.1 }, // Belém, interior extenso  
      'AC': { latRange: 0.8, lngRange: 0.7 }, // Rio Branco, cidades do interior
      'RO': { latRange: 0.7, lngRange: 0.6 }, // Porto Velho, interior
      'RR': { latRange: 0.6, lngRange: 0.5 }, // Boa Vista, municípios  
      'AP': { latRange: 0.5, lngRange: 0.4 }, // Macapá, Santana
      'TO': { latRange: 0.7, lngRange: 0.6 }, // Palmas, Araguaína
    };
    
    const factor = stateFactors[uf] || { latRange: 0.5, lngRange: 0.5 };
    
    return {
      lat: baseLat + (latVariation * factor.latRange),
      lng: baseLng + (lngVariation * factor.lngRange),
    };
  }

  /**
   * �🌍 Retorna coordenadas aproximadas para um estado
   * ⚡ NOVA VERSÃO: Usa coordenadas médias calculadas dinamicamente
   */
  getStateCoordinates(uf: string) {
    // 📍 Prioriza coordenadas calculadas a partir de CEPs reais
    const coordenadasCalculadas = this.estadoCoordenadasCalculadas.get(uf);
    if (coordenadasCalculadas) {
      return {
        lat: coordenadasCalculadas.lat,
        lng: coordenadasCalculadas.lng,
        nome: ESTADO_COORDENADAS[uf]?.nome || uf,
        capital: ESTADO_COORDENADAS[uf]?.capital || 'N/A'
      };
    }
    
    // Fallback para coordenadas fixas se não houver dados calculados
    return ESTADO_COORDENADAS[uf] || ESTADO_COORDENADAS['SP'];
  }

  /**
   * 📊 Retorna estatísticas de CEPs carregados por estado
   */
  getStatesWithLocalData(): string[] {
    return Array.from(this.stateDataMap.keys());
  }

  /**
   * 📈 Retorna estatísticas detalhadas
   */
  getStats() {
    const stats = {
      cepsGerais: this.cepList.length,
      estadosComDadosLocais: this.stateDataMap.size,
      detalhePorEstado: {} as any
    };

    this.stateDataMap.forEach((cepMap, uf) => {
      // 📍 Usa coordenadas calculadas ou fallback para fixas
      const coordenadasCalculadas = this.estadoCoordenadasCalculadas.get(uf);
      const coordenadas = coordenadasCalculadas ? 
        { nome: ESTADO_COORDENADAS[uf]?.nome || uf } : 
        ESTADO_COORDENADAS[uf];
      
      stats.detalhePorEstado[uf] = {
        nome: coordenadas?.nome || uf,
        cepsCarregados: cepMap.size,
        coordenadasCalculadas: coordenadasCalculadas ? 
          `lat=${coordenadasCalculadas.lat.toFixed(4)}, lng=${coordenadasCalculadas.lng.toFixed(4)}` : 
          'usando fixas',
        fonte: 'dados_locais'
      };
    });

    return stats;
  }
}
