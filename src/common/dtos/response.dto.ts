import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta de erro padronizado
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro principal',
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo de erro',
    example: 'Bad Request',
  })
  error?: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2025-10-19T14:30:00.000Z',
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Path da requisição que gerou o erro',
    example: '/shorten',
  })
  path?: string;
}

/**
 * DTO de resposta de sucesso genérico
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Operação realizada com sucesso',
  })
  message: string;
}

/**
 * DTO de resposta de operação de delete
 */
export class DeleteResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'URL deletada com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'ID do recurso deletado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;
}
