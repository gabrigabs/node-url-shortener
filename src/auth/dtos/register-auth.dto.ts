import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para registro de novo usuário
 * Valida dados de entrada para criação de conta
 */
export class RegisterAuthDto {
  /**
   * Email do usuário
   * Deve ser único e válido
   * @example "usuario@exemplo.com"
   */
  @ApiProperty({
    description: 'Email único do usuário',
    example: 'usuario@exemplo.com',
    required: true,
  })
  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  /**
   * Senha do usuário
   * Mínimo de 6 caracteres para segurança
   * @example "senha123"
   */
  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'senha123',
    minLength: 6,
    required: true,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
