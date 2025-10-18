import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

/**
 * Serviço de gerenciamento de usuários
 */
@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Cria um novo usuário
   * @param createUserDto - Dados do usuário a ser criado
   * @returns Usuário criado
   * @throws ConflictException - Se o email já estiver cadastrado
   * @throws InternalServerErrorException - Se houver erro ao criar usuário
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado no sistema');
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
        throw new ConflictException('Email já cadastrado no sistema');
      }
      throw new InternalServerErrorException(
        'Erro ao criar usuário. Tente novamente.',
      );
    }
  }

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null
   */
  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findByEmail(email);
    return user?.toSafeObject() ?? null;
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   * @returns Usuário encontrado
   * @throws NotFoundException - Se o usuário não for encontrado
   */
  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return user.toSafeObject();
  }

  /**
   * Realiza soft delete de um usuário
   * Define deletedAt com a data atual ao invés de remover o registro
   * @param id - ID do usuário
   * @throws NotFoundException - Se o usuário não for encontrado
   * @throws BadRequestException - Se o usuário já foi deletado
   */
  async softDelete(id: string): Promise<void> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (existingUser && existingUser.isDeleted()) {
        throw new BadRequestException(`Usuário com ID ${id} já foi deletado`);
      }
      await this.userRepository.softDelete(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }
      throw error;
    }
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
