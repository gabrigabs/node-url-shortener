import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verificação da conexão com o banco
   * @returns Status da conexão
   */
  async checkDatabaseConnection(): Promise<{
    status: string;
    message: string;
  }> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return {
        status: 'success',
        message: '✅ Banco de dados conectado com sucesso',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `❌ Erro ao conectar com o banco: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
