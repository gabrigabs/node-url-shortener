import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../../../src/app.service';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('AppService', () => {
  let appService: AppService;

  const mockPrismaService = {
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);

    jest.clearAllMocks();
  });

  describe('checkDatabaseConnection', () => {
    it('deve retornar sucesso quando banco está conectado', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appService.checkDatabaseConnection();

      expect(result).toEqual({
        status: 'success',
        message: '✅ Banco de dados conectado com sucesso',
      });
      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT 1',
      );
    });

    it('deve retornar erro quando falha na conexão', async () => {
      const error = new Error('Conexão recusada');
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(error);

      const result = await appService.checkDatabaseConnection();

      expect(result).toEqual({
        status: 'error',
        message: '❌ Erro ao conectar com o banco: Conexão recusada',
      });
      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT 1',
      );
    });

    it('deve lidar com erros não-Error objects', async () => {
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(
        'String error message',
      );

      const result = await appService.checkDatabaseConnection();

      expect(result).toEqual({
        status: 'error',
        message: '❌ Erro ao conectar com o banco: String error message',
      });
    });

    it('deve lidar com erros do tipo objeto', async () => {
      mockPrismaService.$queryRawUnsafe.mockRejectedValue({
        code: 'P2024',
        message: 'Timeout',
      });

      const result = await appService.checkDatabaseConnection();

      expect(result.status).toBe('error');
      expect(result.message).toContain('❌ Erro ao conectar com o banco:');
    });
  });
});
