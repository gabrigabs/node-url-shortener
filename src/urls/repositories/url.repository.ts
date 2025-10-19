import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Url } from '../entities/url.entity';

/**
 * Repository para operações de banco de dados de URLs
 */
@Injectable()
export class UrlRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova URL no banco de dados
   * @param data - Dados da URL a ser criada
   * @returns URL criada
   */
  async create(data: {
    originalUrl: string;
    shortCode: string;
    customAlias?: string | null;
    userId: string;
  }): Promise<Url> {
    const url = await this.prisma.url.create({
      data: {
        originalUrl: data.originalUrl,
        shortCode: data.shortCode,
        customAlias: data.customAlias || null,
        userId: data.userId,
      },
    });
    return new Url(url);
  }

  /**
   * Busca URL por ID
   * @param id - ID da URL
   * @returns URL encontrada ou null
   */
  async findById(id: string): Promise<Url | null> {
    const url = await this.prisma.url.findUnique({
      where: { id },
    });
    return url ? new Url(url) : null;
  }

  /**
   * Busca URL por shortCode
   * @param shortCode - Código curto da URL
   * @returns URL encontrada ou null
   */
  async findByShortCode(shortCode: string): Promise<Url | null> {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });
    return url ? new Url(url) : null;
  }

  /**
   * Busca URL por customAlias
   * @param customAlias - Alias personalizado
   * @returns URL encontrada ou null
   */
  async findByCustomAlias(customAlias: string): Promise<Url | null> {
    const url = await this.prisma.url.findUnique({
      where: { customAlias },
    });
    return url ? new Url(url) : null;
  }

  /**
   * Busca todas as URLs de um usuário (apenas ativas)
   * @param userId - ID do usuário
   * @returns Lista de URLs do usuário
   */
  async findByUserId(userId: string): Promise<Url[]> {
    const urls = await this.prisma.url.findMany({
      where: {
        userId,
        deletedAt: null, // Apenas URLs ativas
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return urls.map((url) => new Url(url));
  }

  /**
   * Atualiza uma URL existente
   * @param id - ID da URL
   * @param data - Dados a serem atualizados
   * @returns URL atualizada
   */
  async update(
    id: string,
    data: {
      originalUrl?: string;
      accessCount?: number;
      deletedAt?: Date;
    },
  ): Promise<Url> {
    const url = await this.prisma.url.update({
      where: { id },
      data,
    });
    return new Url(url);
  }

  /**
   * Soft delete de uma URL
   * @param id - ID da URL
   * @returns URL deletada
   */
  async softDelete(id: string): Promise<Url> {
    const url = await this.prisma.url.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return new Url(url);
  }

  /**
   * Incrementa o contador de acessos de uma URL
   * @param id - ID da URL
   * @returns URL com contador incrementado
   */
  async incrementAccessCount(id: string): Promise<Url> {
    const url = await this.prisma.url.update({
      where: { id },
      data: {
        accessCount: {
          increment: 1,
        },
      },
    });
    return new Url(url);
  }

  /**
   * Verifica se um shortCode já existe
   * @param shortCode - Código curto a verificar
   * @returns true se existe, false caso contrário
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    const count = await this.prisma.url.count({
      where: { shortCode },
    });
    return count > 0;
  }

  /**
   * Verifica se um customAlias já existe
   * @param customAlias - Alias a verificar
   * @returns true se existe, false caso contrário
   */
  async customAliasExists(customAlias: string): Promise<boolean> {
    const count = await this.prisma.url.count({
      where: { customAlias },
    });
    return count > 0;
  }

  /**
   * Busca URL por shortCode ou customAlias (para redirecionamento público)
   * Retorna apenas URLs ativas (não deletadas)
   * @param code - ShortCode ou customAlias
   * @returns URL encontrada ou null
   */
  async findByCode(code: string): Promise<Url | null> {
    const url = await this.prisma.url.findFirst({
      where: {
        OR: [{ shortCode: code }, { customAlias: code }],
        deletedAt: null,
      },
    });
    return url ? new Url(url) : null;
  }

  /**
   * Cria uma nova URL anônima no banco de dados
   * @param data - Dados da URL a ser criada (sem userId)
   * @returns URL criada
   */
  async createAnonymous(data: {
    originalUrl: string;
    shortCode: string;
  }): Promise<Url> {
    const url = await this.prisma.url.create({
      data: {
        originalUrl: data.originalUrl,
        shortCode: data.shortCode,
        customAlias: null,
        userId: null,
      },
    });
    return new Url(url);
  }
}
