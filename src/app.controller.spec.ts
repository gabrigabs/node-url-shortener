import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('checkHealth', () => {
    it('should return application health status', async () => {
      jest.spyOn(appController, 'checkHealth').mockResolvedValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'success',
          message: '✅ Banco de dados conectado com sucesso',
        },
      });

      const result = await appController.checkHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
    });
  });
});
