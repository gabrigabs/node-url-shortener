import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

/**
 * Serviço Prisma para gerenciar conexão com banco de dados
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Conecta ao banco de dados quando o módulo é inicializado
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Desconecta do banco de dados quando o módulo é destruído
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
