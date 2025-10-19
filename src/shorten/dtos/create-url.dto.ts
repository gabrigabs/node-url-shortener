import {
  IsUrl,
  IsOptional,
  IsString,
  Matches,
  Validate,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicUrlConstraint } from '../validators/is-public-url.validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'URL original a ser encurtada',
    example: 'https://www.exemplo.com/pagina-muito-longa',
  })
  @IsUrl({}, { message: 'URL inválida' })
  @Validate(IsPublicUrlConstraint)
  originalUrl: string;

  @ApiProperty({
    description:
      'Alias personalizado (opcional, apenas para usuários autenticados, 3-30 caracteres)',
    example: 'meu-link',
    required: false,
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Alias deve ter no mínimo 3 caracteres' })
  @MaxLength(30, { message: 'Alias deve ter no máximo 30 caracteres' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Alias deve conter apenas letras, números, hífens e underscores',
  })
  customAlias?: string;
}
