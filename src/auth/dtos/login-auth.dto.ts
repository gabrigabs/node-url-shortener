import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para autenticação (login)
 * Valida credenciais de acesso do usuário
 */
export class LoginAuthDto {
  /**
   * Email do usuário cadastrado
   * @example "usuario@exemplo.com"
   */
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
    required: true,
  })
  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  /**
   * Senha do usuário
   * @example "senha123"
   */
  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
    minLength: 6,
    required: true,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
