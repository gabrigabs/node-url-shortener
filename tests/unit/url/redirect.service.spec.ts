import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RedirectService } from '../../../src/redirect/redirect.service';
import { UrlRepository } from '../../../src/urls/repositories/url.repository';
import { Url } from '../../../src/urls/entities/url.entity';
import {
  createMockLogger,
  createMockCacheManager,
} from '../__mocks__/prisma.service.mock';

describe('RedirectService', () => {
  let redirectService: RedirectService;

  const mockLogger = createMockLogger();
  const mockCacheManager = createMockCacheManager();

  const mockUrlRepository = {
    findByCode: jest.fn(),
    incrementAccessCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        {
          provide: UrlRepository,
          useValue: mockUrlRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    redirectService = module.get<RedirectService>(RedirectService);

    jest.clearAllMocks();
  });

  describe('findByCodeAndIncrement', () => {
    it('deve redirecionar corretamente e incrementar acessos', async () => {
      const shortCode = 'abc123';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode,
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockResolvedValue(mockUrl);
      mockUrlRepository.incrementAccessCount.mockResolvedValue(undefined);

      const result = await redirectService.findByCodeAndIncrement(shortCode);

      expect(result).toEqual(mockUrl);
      expect(mockUrlRepository.findByCode).toHaveBeenCalledWith(shortCode);
      expect(mockUrlRepository.incrementAccessCount).toHaveBeenCalledWith(
        mockUrl.id,
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `url:${shortCode}`,
        mockUrl,
        3600000,
      );
    });

    it('deve usar cache quando disponível', async () => {
      const shortCode = 'abc123';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode,
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockCacheManager.get.mockResolvedValue(mockUrl);
      mockUrlRepository.incrementAccessCount.mockResolvedValue(undefined);

      const result = await redirectService.findByCodeAndIncrement(shortCode);

      expect(result).toEqual(mockUrl);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`url:${shortCode}`);
      expect(mockUrlRepository.findByCode).not.toHaveBeenCalled();
      expect(mockUrlRepository.incrementAccessCount).toHaveBeenCalledWith(
        mockUrl.id,
      );
    });

    it('deve retornar 404 para URL não encontrada', async () => {
      const shortCode = 'invalid';

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockResolvedValue(null);

      await expect(
        redirectService.findByCodeAndIncrement(shortCode),
      ).rejects.toThrow(NotFoundException);
      await expect(
        redirectService.findByCodeAndIncrement(shortCode),
      ).rejects.toThrow('URL não encontrada');
      expect(mockUrlRepository.findByCode).toHaveBeenCalledWith(shortCode);
    });

    it('deve funcionar com customAlias', async () => {
      const customAlias = 'mylink';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias,
        userId: 'user-uuid',
        accessCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockResolvedValue(mockUrl);
      mockUrlRepository.incrementAccessCount.mockResolvedValue(undefined);

      const result = await redirectService.findByCodeAndIncrement(customAlias);

      expect(result).toEqual(mockUrl);
      expect(mockUrlRepository.findByCode).toHaveBeenCalledWith(customAlias);
    });

    it('deve lidar com erro no incremento de acessos sem lançar exceção', async () => {
      const shortCode = 'abc123';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode,
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockResolvedValue(mockUrl);
      mockUrlRepository.incrementAccessCount.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await redirectService.findByCodeAndIncrement(shortCode);

      expect(result).toEqual(mockUrl);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha ao incrementar contador de acessos',
        expect.any(Object),
      );
    });

    it('deve relançar erro genérico que não seja NotFoundException', async () => {
      const shortCode = 'abc123';
      const error = new Error('Generic database error');

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockRejectedValue(error);

      await expect(
        redirectService.findByCodeAndIncrement(shortCode),
      ).rejects.toThrow('Generic database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro em findByCodeAndIncrement',
        expect.objectContaining({
          context: 'RedirectService',
          code: shortCode,
          error: error.message,
        }),
      );
    });

    it('deve relançar NotFoundException', async () => {
      const shortCode = 'notfound';
      const notFoundError = new NotFoundException('URL não encontrada');

      mockCacheManager.get.mockResolvedValue(null);
      mockUrlRepository.findByCode.mockRejectedValue(notFoundError);

      await expect(
        redirectService.findByCodeAndIncrement(shortCode),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache corretamente', async () => {
      const code = 'abc123';
      mockCacheManager.del.mockResolvedValue(undefined);

      await redirectService.invalidateCache(code);

      expect(mockCacheManager.del).toHaveBeenCalledWith(`url:${code}`);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cache invalidado',
        expect.objectContaining({ code }),
      );
    });

    it('deve logar erro ao falhar na invalidação de cache', async () => {
      const code = 'abc123';
      const error = new Error('Cache error');
      mockCacheManager.del.mockRejectedValue(error);

      await redirectService.invalidateCache(code);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha ao invalidar cache',
        expect.objectContaining({
          code,
          error: error.message,
        }),
      );
    });
  });
});
