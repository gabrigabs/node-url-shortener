/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);

    jest.spyOn(prismaService, '$connect').mockResolvedValue();
    jest.spyOn(prismaService, '$disconnect').mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('deve conectar ao banco de dados', async () => {
      await prismaService.onModuleInit();

      expect(prismaService.$connect).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com erro na conexão', async () => {
      const error = new Error('Falha na conexão');
      (prismaService.$connect as jest.Mock).mockRejectedValue(error);

      await expect(prismaService.onModuleInit()).rejects.toThrow(
        'Falha na conexão',
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('deve desconectar do banco de dados', async () => {
      await prismaService.onModuleDestroy();

      expect(prismaService.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com erro na desconexão', async () => {
      const error = new Error('Falha na desconexão');
      (prismaService.$disconnect as jest.Mock).mockRejectedValue(error);

      await expect(prismaService.onModuleDestroy()).rejects.toThrow(
        'Falha na desconexão',
      );
    });
  });

  describe('lifecycle', () => {
    it('deve conectar e desconectar em sequência', async () => {
      await prismaService.onModuleInit();
      await prismaService.onModuleDestroy();

      expect(prismaService.$connect).toHaveBeenCalledTimes(1);
      expect(prismaService.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
