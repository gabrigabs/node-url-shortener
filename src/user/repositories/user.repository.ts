import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../entities/user.entity';

/**
 * Repository para operações de banco de dados relacionadas a User
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo usuário no banco de dados
   * @param data - Dados do usuário a ser criado
   * @returns Usuário criado
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return new User(user);
  }

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? new User(user) : null;
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   * @returns Usuário encontrado ou null
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? new User(user) : null;
  }

  /**
   * Atualiza dados de um usuário
   * @param id - ID do usuário
   * @param data - Dados a serem atualizados
   * @returns Usuário atualizado
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id, deletedAt: null },
      data,
    });
    return new User(user);
  }

  /**
   * Realiza soft delete de um usuário
   * Define deletedAt com a data atual
   * @param id - ID do usuário
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Verifica se um email já existe no sistema
   * @param email - Email a ser verificado
   * @returns true se email existe, false caso contrário
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }
}
