import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { RegisterAuthDto } from 'src/auth/dtos/register-auth.dto';

/**
 * Serviço de gerenciamento de usuários
 */
@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly EMAIL_ALREADY_EXISTS_MESSAGE =
    'Email já cadastrado no sistema';
  private readonly EMAIL_NOT_FOUND_MESSAGE = 'Usuário não encontrado';
  private readonly INTERNAL_SERVER_ERROR_MESSAGE =
    'Erro ao criar usuário. Tente novamente mais tarde ou contate o suporte.';
  private readonly ALREADY_DELETED_MESSAGE = 'Usuário já foi deletado';

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Cria um novo usuário
   * @param createUserDto - Dados do usuário a ser criado
   * @returns Usuário criado
   * @throws ConflictException - Se o email já estiver cadastrado
   * @throws InternalServerErrorException - Se houver erro ao criar usuário
   */
  async create(
    createUserDto: RegisterAuthDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(this.EMAIL_ALREADY_EXISTS_MESSAGE);
    }

    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      const createdUser = await this.userRepository.create({
        email,
        password: hashedPassword,
      });

      return createdUser.toSafeObject();
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException(this.EMAIL_ALREADY_EXISTS_MESSAGE);
      }
      throw new InternalServerErrorException(
        this.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  }

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   * @returns Usuário encontrado
   * @throws NotFoundException - Se o usuário não for encontrado
   */
  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findById(id);
    return user?.toSafeObject() ?? null;
  }

  /**
   * Realiza soft delete de um usuário
   * Define deletedAt com a data atual ao invés de remover o registro
   * @param id - ID do usuário
   * @throws NotFoundException - Se o usuário não for encontrado
   * @throws BadRequestException - Se o usuário já foi deletado
   */
  async softDelete(id: string): Promise<void> {
    const existingUser = await this.userRepository.findById(id);
    if (existingUser && existingUser.isDeleted()) {
      throw new BadRequestException(this.ALREADY_DELETED_MESSAGE);
    }
    if (!existingUser) {
      throw new NotFoundException(this.EMAIL_NOT_FOUND_MESSAGE);
    }
    await this.userRepository.softDelete(id);
  }

  /**
   * Valida se a senha fornecida corresponde ao hash armazenado
   * Útil para autenticação
   * @param plainPassword - Senha em texto plano
   * @param hashedPassword - Hash da senha armazenado
   * @returns true se a senha é válida, false caso contrário
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
