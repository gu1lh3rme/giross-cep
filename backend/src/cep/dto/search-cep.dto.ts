import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCepDto {
  @ApiProperty({
    description: 'CEP de origem (somente números ou formato XXXXX-XXX)',
    example: '01310100',
  })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP inválido. Use o formato XXXXXYYY ou XXXXX-YYY' })
  cep: string;

  @ApiProperty({
    description: 'Raio de busca em quilômetros',
    example: 5,
    minimum: 0.1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  raioKm: number;
}
