import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicUrlConstraint } from '../../shorten/validators/is-public-url.validator';

/**
 * DTO para criação de nova URL encurtada
 */
export class CreateUrlDto {
  /**
   * URL original completa
   * Deve ser uma URL válida HTTP ou HTTPS
   * @example "https://www.exemplo.com/pagina-muito-longa"
   */
  @ApiProperty({
    description: 'URL original completa a ser encurtada',
    example: 'https://www.exemplo.com/pagina-muito-longa',
    required: true,
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL deve ser válida e começar com http:// ou https://' },
  )
  @IsNotEmpty({ message: 'URL original é obrigatória' })
  @Validate(IsPublicUrlConstraint)
  originalUrl: string;

  /**
   * Alias personalizado opcional (3 a 30 caracteres)
   * Deve conter apenas letras minúsculas, números, hífens e underscores
   * @example "meu-link-customizado"
   */
  @ApiProperty({
    description:
      'Alias personalizado para a URL (opcional, 3-30 caracteres, apenas a-z, 0-9, - e _)',
    example: 'meu-link-customizado',
    required: false,
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString({ message: 'Alias deve ser uma string' })
  @MinLength(3, { message: 'Alias deve ter no mínimo 3 caracteres' })
  @MaxLength(30, { message: 'Alias deve ter no máximo 30 caracteres' })
  @Matches(/^[a-z0-9_-]{3,30}$/i, {
    message:
      'Alias deve conter apenas letras, números, hífens e underscores (3-30 caracteres)',
  })
  customAlias?: string;
}
