import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    checkDatabaseConnection: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);

    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('deve retornar status da aplicação com banco conectado', async () => {
      const mockDbStatus = {
        status: 'success',
        message: '✅ Banco de dados conectado com sucesso',
      };

      mockAppService.checkDatabaseConnection.mockResolvedValue(mockDbStatus);

      const result = await appController.checkHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result.database).toEqual(mockDbStatus);
      expect(mockAppService.checkDatabaseConnection).toHaveBeenCalledTimes(1);
    });

    it('deve retornar status da aplicação com erro no banco', async () => {
      const mockDbStatus = {
        status: 'error',
        message: '❌ Erro ao conectar com o banco: Connection refused',
      };

      mockAppService.checkDatabaseConnection.mockResolvedValue(mockDbStatus);

      const result = await appController.checkHealth();

      expect(result.status).toBe('ok');
      expect(result.database).toEqual(mockDbStatus);
      expect(result.database.status).toBe('error');
    });
  });
});
