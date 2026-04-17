import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CepService } from './cep.service';
import { SearchCepDto } from './dto/search-cep.dto';
import { CepSearchResult } from './cep-data.interface';

@ApiTags('CEP')
@Controller('cep')
export class CepController {
  constructor(private readonly cepService: CepService) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar CEPs em um raio geográfico',
    description: 'Retorna todos os CEPs localizados dentro do raio informado a partir do CEP de origem',
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
}
