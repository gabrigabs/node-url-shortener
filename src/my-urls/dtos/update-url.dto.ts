import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para atualização de URL existente
 */
export class UpdateUrlDto {
  /**
   * Nova URL original
   * Deve ser uma URL válida HTTP ou HTTPS
   * @example "https://www.exemplo.com/nova-pagina"
   */
  @ApiProperty({
    description: 'Nova URL original',
    example: 'https://www.exemplo.com/nova-pagina',
    required: true,
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL deve ser válida e começar com http:// ou https://' },
  )
  @IsNotEmpty({ message: 'URL original é obrigatória' })
  originalUrl: string;
}
