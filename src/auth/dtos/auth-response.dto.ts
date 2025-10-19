import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de dados do usuário em resposta de autenticação
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  email: string;
}

/**
 * DTO de resposta de autenticação (login/register)
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT de acesso',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzdWFyaW9AZXhlbXBsby5jb20iLCJpYXQiOjE2OTc2NTY4MDB9.abc123xyz',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
