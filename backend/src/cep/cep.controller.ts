import { Controller, Get, Query, HttpCode, HttpStatus, Param, NotFoundException, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { CepService } from './cep.service';
import { CsvService } from './csv.service';
import { DatasetDownloaderService } from './dataset-downloader.service';
import { SearchCepDto } from './dto/search-cep.dto';
import { CepSearchResult } from './cep-data.interface';

@ApiTags('CEP')
@Controller('cep')
export class CepController {
  constructor(
    private readonly cepService: CepService,
    private readonly csvService: CsvService,
    private readonly datasetDownloaderService: DatasetDownloaderService,
  ) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '📊 Estatísticas dos estados com dados locais',
    description: 'Mostra quais estados brasileiros possuem dados locais carregados para fallback quando a API está indisponível'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas dos dados locais carregados',
  })
  getLocalDataStats() {
    return {
      message: '📊 Estatísticas de dados locais por estado brasileiro',
      ...this.csvService.getStats(),
      estadosComDados: this.csvService.getStatesWithLocalData(),
      totalEstadosBrasil: 27,
      observacao: 'Estados com dados locais funcionam mesmo quando a API do CEP Aberto está com rate limit'
    };
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar CEPs em um raio geográfico',
    description: 'Retorna todos os CEPs localizados dentro do raio informado a partir do CEP de origem. Utiliza dados do CEP Aberto como fonte principal.',
  })
  @ApiQuery({ name: 'cep', description: 'CEP de origem', example: '01310100' })
  @ApiQuery({ name: 'raioKm', description: 'Raio em quilômetros', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Lista de CEPs encontrados no raio',
  })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos ou CEP inválido' })
  @ApiResponse({ status: 404, description: 'CEP não encontrado na base de dados' })
  async search(@Query() dto: SearchCepDto): Promise<CepSearchResult[]> {
    return this.cepService.searchCepsInRadius(dto.cep, dto.raioKm);
  }

  @Get(':cep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar informações de um CEP específico',
    description: 'Retorna as informações detalhadas de um CEP específico usando a API do CEP Aberto.',
  })
  @ApiParam({ 
    name: 'cep', 
    description: 'Código CEP (com ou sem formatação)',
    example: '01310100',
    type: 'string'
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do CEP encontrado',
    schema: {
      type: 'object',
      properties: {
        cep: { type: 'string', example: '01310100' },
        logradouro: { type: 'string', example: 'Avenida Paulista' },
        bairro: { type: 'string', example: 'Bela Vista' },
        localidade: { type: 'string', example: 'São Paulo' },
        uf: { type: 'string', example: 'SP' },
        latitude: { type: 'number', example: -23.5632 },
        longitude: { type: 'number', example: -46.6542 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'CEP não encontrado' })
  async findByCep(@Param('cep') cep: string) {
    const result = await this.cepService.findCepByCode(cep);
    if (!result) {
      throw new NotFoundException(`CEP ${cep} não encontrado`);
    }
    return result;
  }

  @Get('datasets/info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '📦 Informações dos datasets locais',
    description: 'Mostra informações detalhadas dos datasets baixados do CEP Aberto'
  })
  @ApiResponse({status: 200, description: 'Informações dos datasets locais'})
  getDatasetsInfo() {
    return {
      message: '📦 Informações dos datasets do CEP Aberto',
      ...this.datasetDownloaderService.getLocalDatasetsInfo()
    };
  }

  @Post('datasets/download/priority')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🚀 Baixar estados prioritários',
    description: 'Baixa automaticamente os datasets dos estados mais populosos do Brasil'
  })
  @ApiResponse({status: 200, description: 'Download iniciado com sucesso'})
  async downloadPriorityStates() {
    // Executa em background
    this.datasetDownloaderService.downloadPriorityStates().catch(error => {
      console.error('Erro no download de estados prioritários:', error);
    });
    
    return {
      message: '🚀 Download de estados prioritários iniciado',
      status: 'Em processamento... Verifique logs do servidor',
      estados: ['SP', 'RJ', 'MG', 'BA', 'PR', 'RS', 'PE', 'CE', 'SC', 'GO']
    };
  }

  @Post('datasets/download/states')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '📥 Baixar estados específicos',
    description: 'Baixa datasets de estados específicos do Brasil'
  })
  @ApiResponse({status: 200, description: 'Download iniciado'})
  async downloadSpecificStates(@Body() body: { states: string[] }) {
    if (!Array.isArray(body.states) || body.states.length === 0) {
      throw new NotFoundException('Lista de estados é obrigatória');
    }

    // Executa em background
    this.datasetDownloaderService.checkAndDownloadUpdates(body.states).catch(error => {
      console.error('Erro no download de estados específicos:', error);
    });
    
    return {
      message: `📥 Download iniciado para ${body.states.length} estado(s)`,
      status: 'Em processamento... Verifique logs do servidor',
      estados: body.states
    };
  }

  @Post('datasets/check-updates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔍 Verificar atualizações',
    description: 'Verifica e baixa atualizações para todos os datasets'
  })
  @ApiResponse({status: 200, description: 'Verificação de atualização iniciada'})
  async checkAndDownloadUpdates() {
    // Executa em background
    this.datasetDownloaderService.checkAndDownloadUpdates().catch(error => {
      console.error('Erro na verificação de atualizações:', error);
    });
    
    return {
      message: '🔍 Verificação de atualizações iniciada',
      status: 'Em processamento... Verifique logs do servidor',
      observacao: 'Datasets são atualizados se tiverem mais de 7 dias'
    };
  }
}
