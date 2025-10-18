import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para criação de novos usuários
 */
export class CreateUserDto {
  /**
   * Email do usuário
   * Deve ser um email válido e único no sistema
   * @example "usuario@exemplo.com"
   */
  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  /**
   * Senha do usuário
   * Mínimo de 6 caracteres por segurança
   * Será armazenada como hash bcrypt
   * @example "senha123"
   */
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
