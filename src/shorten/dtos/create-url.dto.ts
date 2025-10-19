import { IsUrl, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({
    description: 'URL original a ser encurtada',
    example: 'https://www.exemplo.com/pagina-muito-longa',
  })
  @IsUrl({}, { message: 'URL inválida' })
  originalUrl: string;

  @ApiProperty({
    description:
      'Alias personalizado (opcional, apenas para usuários autenticados)',
    example: 'meu-link',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Alias deve conter apenas letras, números, hífens e underscores',
  })
  customAlias?: string;
}
