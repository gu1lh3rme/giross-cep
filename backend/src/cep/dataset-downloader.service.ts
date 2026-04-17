import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

// URLs de downloads do CEP Aberto (exemplos - verificar site oficial)
const DATASET_URLS = {
  'MG': 'https://cepaberto.com/api/v3/cep/download/mg',
  'SP': 'https://cepaberto.com/api/v3/cep/download/sp', 
  'RJ': 'https://cepaberto.com/api/v3/cep/download/rj',
  'BA': 'https://cepaberto.com/api/v3/cep/download/ba',
  'PR': 'https://cepaberto.com/api/v3/cep/download/pr',
  'RS': 'https://cepaberto.com/api/v3/cep/download/rs',
  'PE': 'https://cepaberto.com/api/v3/cep/download/pe',
  'CE': 'https://cepaberto.com/api/v3/cep/download/ce',
  'SC': 'https://cepaberto.com/api/v3/cep/download/sc',
  'GO': 'https://cepaberto.com/api/v3/cep/download/go',
  'MA': 'https://cepaberto.com/api/v3/cep/download/ma',
  'PB': 'https://cepaberto.com/api/v3/cep/download/pb',
  'PA': 'https://cepaberto.com/api/v3/cep/download/pa',
  'ES': 'https://cepaberto.com/api/v3/cep/download/es',
  'PI': 'https://cepaberto.com/api/v3/cep/download/pi',
  'AL': 'https://cepaberto.com/api/v3/cep/download/al',
  'DF': 'https://cepaberto.com/api/v3/cep/download/df',
  'MS': 'https://cepaberto.com/api/v3/cep/download/ms',
  'MT': 'https://cepaberto.com/api/v3/cep/download/mt',
  'RO': 'https://cepaberto.com/api/v3/cep/download/ro',
  'AC': 'https://cepaberto.com/api/v3/cep/download/ac',
  'AM': 'https://cepaberto.com/api/v3/cep/download/am',
  'RR': 'https://cepaberto.com/api/v3/cep/download/rr',
  'AP': 'https://cepaberto.com/api/v3/cep/download/ap',
  'TO': 'https://cepaberto.com/api/v3/cep/download/to',
  'RN': 'https://cepaberto.com/api/v3/cep/download/rn',
  'SE': 'https://cepaberto.com/api/v3/cep/download/se',
};

@Injectable()
export class DatasetDownloaderService {
  private readonly logger = new Logger(DatasetDownloaderService.name);
  private readonly dataPath = path.join(process.cwd(), 'data');
  private readonly downloadPath = path.join(this.dataPath, 'downloads');

  constructor(private readonly httpService: HttpService) {
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath);
    }
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath);
    }
  }

  /**
   * 🌐 Verifica se há atualizações disponíveis e baixa datasets automaticamente
   */
  async checkAndDownloadUpdates(states?: string[]): Promise<void> {
    const statesToUpdate = states || Object.keys(DATASET_URLS);
    
    this.logger.log(`🔍 Verificando atualizações para ${statesToUpdate.length} estados...`);
    
    for (const state of statesToUpdate) {
      try {
        const shouldUpdate = await this.shouldUpdateState(state);
        
        if (shouldUpdate) {
          this.logger.log(`📥 Baixando dataset atualizado para ${state}...`);
          await this.downloadStateDataset(state);
        } else {
          this.logger.log(`✅ Dataset de ${state} já está atualizado`);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Erro ao processar ${state}: ${error.message}`);
      }
    }
  }

  /**
   * 📥 Baixa dataset de um estado específico
   */
  async downloadStateDataset(state: string): Promise<boolean> {
    try {
      const url = DATASET_URLS[state];
      if (!url) {
        this.logger.warn(`❌ URL não encontrada para estado ${state}`);
        return false;
      }

      this.logger.log(`📡 Baixando ${state} de ${url}...`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 segundos
          headers: {
            'User-Agent': 'CEP-Search-System/1.0',
          }
        })
      );

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Salva o arquivo ZIP
      const zipPath = path.join(this.downloadPath, `${state.toLowerCase()}.zip`);
      fs.writeFileSync(zipPath, response.data);
      
      this.logger.log(`💾 Arquivo salvo: ${zipPath}`);
      
      // Extrai o CSV
      await this.extractAndProcessZip(zipPath, state);
      
      // Remove o ZIP após extração
      fs.unlinkSync(zipPath);
      
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao baixar ${state}: ${error.message}`);
      return false;
    }
  }

  /**
   * 📦 Extrai ZIP e processa CSV
   */
  private async extractAndProcessZip(zipPath: string, state: string): Promise<void> {
    try {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      
      for (const entry of entries) {
        if (entry.entryName.endsWith('.csv')) {
          const csvContent = entry.getData().toString('utf8');
          const csvPath = path.join(this.dataPath, `ceps-${state.toLowerCase()}.csv`);
          
          // Processa e limpa o CSV se necessário
          const processedContent = this.processCsvContent(csvContent);
          fs.writeFileSync(csvPath, processedContent, 'utf8');
          
          this.logger.log(`✅ CSV extraído para: ${csvPath}`);
          
          // Conta linhas para estatísticas
          const lineCount = processedContent.split('\n').filter(line => line.trim()).length;
          this.logger.log(`📊 ${lineCount} CEPs processados para ${state}`);
          
          break;
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao extrair ZIP ${zipPath}: ${error.message}`);
    }
  }

  /**
   * 🧹 Processa e limpa conteúdo do CSV
   */
  private processCsvContent(content: string): string {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Remove linhas vazias e cabeçalhos
      if (!trimmedLine || trimmedLine.startsWith('CEP') || trimmedLine.startsWith('cep')) {
        continue;
      }
      
      // Valida formato básico do CEP (8 dígitos no início)
      const cepMatch = trimmedLine.match(/^(\d{8})/);
      if (cepMatch) {
        processedLines.push(trimmedLine);
      }
    }
    
    return processedLines.join('\n');
  }

  /**
   * ⏰ Verifica se precisa atualizar dataset do estado
   */
  private async shouldUpdateState(state: string): Promise<boolean> {
    const csvPath = path.join(this.dataPath, `ceps-${state.toLowerCase()}.csv`);
    
    // Se não existe, precisa baixar
    if (!fs.existsSync(csvPath)) {
      return true;
    }
    
    // Verifica idade do arquivo (atualiza se > 7 dias)
    const stats = fs.statSync(csvPath);
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    return ageInDays > 7; // Atualiza a cada 7 dias
  }

  /**
   * 🚀 Executa download inicial para estados prioritários
   */
  async downloadPriorityStates(): Promise<void> {
    // Estados mais populosos primeiro
    const priorities = ['SP', 'RJ', 'MG', 'BA', 'PR', 'RS', 'PE', 'CE', 'SC', 'GO'];
    
    this.logger.log(`🎯 Baixando estados prioritários: ${priorities.join(', ')}`);
    
    for (const state of priorities) {
      await this.downloadStateDataset(state);
      
      // Delay entre downloads para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * 📊 Retorna estatísticas dos datasets locais
   */
  getLocalDatasetsInfo(): any {
    const info: any = {
      totalStates: 0,
      datasets: {},
      lastUpdate: null,
      totalSize: 0
    };
    
    for (const state of Object.keys(DATASET_URLS)) {
      const csvPath = path.join(this.dataPath, `ceps-${state.toLowerCase()}.csv`);
      
      if (fs.existsSync(csvPath)) {
        const stats = fs.statSync(csvPath);
        const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim()).length;
        
        info.datasets[state] = {
          exists: true,
          lastModified: stats.mtime,
          sizeBytes: stats.size,
          estimatedRecords: lines
        };
        
        info.totalStates++;
        info.totalSize += stats.size;
        
        if (!info.lastUpdate || stats.mtime > info.lastUpdate) {
          info.lastUpdate = stats.mtime;
        }
      } else {
        info.datasets[state] = {
          exists: false
        };
      }
    }
    
    return info;
  }
}