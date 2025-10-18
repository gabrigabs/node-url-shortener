import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controller principal da aplicação
 * Mostra o status da aplicação e a conexão com o banco de dados
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint para verificar o status da aplicação e a conexão com o banco de dados
   * @returns Status da conexão
   */
  @Get('healthcheck')
  async checkHealth() {
    const dbStatus = await this.appService.checkDatabaseConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
