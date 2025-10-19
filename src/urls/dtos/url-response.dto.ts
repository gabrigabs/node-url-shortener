import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de resposta de URL encurtada
 */
export class UrlResponseDto {
  @ApiProperty({
    description: 'ID único da URL',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'URL original completa',
    example: 'https://www.exemplo.com/pagina-muito-longa-com-parametros',
  })
  originalUrl: string;

  @ApiProperty({
    description: 'Código curto gerado (6 caracteres alfanuméricos)',
    example: 'aB3xY9',
    minLength: 6,
    maxLength: 6,
  })
  shortCode: string;

  @ApiPropertyOptional({
    description: 'Alias personalizado (apenas URLs autenticadas)',
    example: 'meu-link-legal',
    nullable: true,
  })
  customAlias: string | null;

  @ApiPropertyOptional({
    description: 'ID do usuário proprietário (null se anônima)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'Contador de acessos ao link',
    example: 42,
    minimum: 0,
  })
  accessCount: number;

  @ApiProperty({
    description: 'Data de criação da URL',
    example: '2025-10-19T14:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-10-19T14:30:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Data de soft delete (null se não deletada)',
    example: null,
    nullable: true,
  })
  deletedAt: Date | null;
}

/**
 * DTO de resposta de redirecionamento
 */
export class RedirectResponseDto {
  @ApiProperty({
    description: 'URL original para onde redirecionar',
    example: 'https://www.exemplo.com/pagina-destino',
  })
  originalUrl: string;

  @ApiProperty({
    description: 'Código usado para o redirect (shortCode ou customAlias)',
    example: 'aB3xY9',
  })
  code: string;

  @ApiProperty({
    description: 'Contador de acessos atualizado',
    example: 43,
  })
  accessCount: number;
}
