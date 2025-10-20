import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MyUrlsService } from '../../../src/my-urls/services/my-urls.service';
import { UrlRepository } from '../../../src/urls/repositories/url.repository';
import { Url } from '../../../src/urls/entities/url.entity';
import { UpdateUrlDto } from '../../../src/my-urls/dtos/update-url.dto';
import {
  createMockLogger,
  createMockCacheManager,
} from '../__mocks__/prisma.service.mock';

describe('MyUrlsService', () => {
  let myUrlsService: MyUrlsService;

  const mockLogger = createMockLogger();
  const mockCacheManager = createMockCacheManager();

  const mockUrlRepository = {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyUrlsService,
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

    myUrlsService = module.get<MyUrlsService>(MyUrlsService);

    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('deve listar URLs do usuário autenticado', async () => {
      const userId = 'user-uuid';
      const mockUrls = [
        new Url({
          id: 'url-uuid-1',
          originalUrl: 'https://example1.com',
          shortCode: 'abc123',
          customAlias: null,
          userId,
          accessCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        new Url({
          id: 'url-uuid-2',
          originalUrl: 'https://example2.com',
          shortCode: 'xyz789',
          customAlias: 'mylink',
          userId,
          accessCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      mockUrlRepository.findByUserId.mockResolvedValue(mockUrls);

      const result = await myUrlsService.findAllByUser(userId);

      expect(result).toEqual(mockUrls);
      expect(result).toHaveLength(2);
      expect(mockUrlRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('deve retornar array vazio se usuário não tiver URLs', async () => {
      const userId = 'user-uuid';
      mockUrlRepository.findByUserId.mockResolvedValue([]);

      const result = await myUrlsService.findAllByUser(userId);

      expect(result).toEqual([]);
      expect(mockUrlRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOneByUser', () => {
    it('deve buscar URL específica do usuário', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      const result = await myUrlsService.findOneByUser(urlId, userId);

      expect(result).toEqual(mockUrl);
      expect(mockUrlRepository.findById).toHaveBeenCalledWith(urlId);
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      const userId = 'user-uuid';
      const urlId = 'invalid-uuid';

      mockUrlRepository.findById.mockResolvedValue(null);

      await expect(myUrlsService.findOneByUser(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(myUrlsService.findOneByUser(urlId, userId)).rejects.toThrow(
        'URL não encontrada',
      );
    });

    it('deve lançar ForbiddenException para URL de outro usuário', async () => {
      const userId = 'user-uuid';
      const otherUserId = 'other-user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: otherUserId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(myUrlsService.findOneByUser(urlId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(myUrlsService.findOneByUser(urlId, userId)).rejects.toThrow(
        'Esta URL não pertence a você',
      );
    });

    it('deve lançar NotFoundException para URL deletada', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(myUrlsService.findOneByUser(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve permitir atualização apenas do dono da URL', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://new-example.com',
      };

      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://old-example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const updatedMockUrl = new Url({
        ...mockUrl,
        originalUrl: updateUrlDto.originalUrl,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);
      mockUrlRepository.update.mockResolvedValue(updatedMockUrl);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await myUrlsService.update(urlId, userId, updateUrlDto);

      expect(result.originalUrl).toBe(updateUrlDto.originalUrl);
      expect(mockUrlRepository.update).toHaveBeenCalledWith(urlId, {
        originalUrl: updateUrlDto.originalUrl,
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `url:${mockUrl.shortCode}`,
      );
    });

    it('deve invalidar cache após atualização', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://new-example.com',
      };

      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://old-example.com',
        shortCode: 'abc123',
        customAlias: 'mylink',
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const updatedMockUrl = new Url({
        ...mockUrl,
        originalUrl: updateUrlDto.originalUrl,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);
      mockUrlRepository.update.mockResolvedValue(updatedMockUrl);
      mockCacheManager.del.mockResolvedValue(undefined);

      await myUrlsService.update(urlId, userId, updateUrlDto);

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `url:${mockUrl.shortCode}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `url:${mockUrl.customAlias}`,
      );
    });

    it('deve lançar ForbiddenException ao tentar atualizar URL de outro usuário', async () => {
      const userId = 'user-uuid';
      const otherUserId = 'other-user-uuid';
      const urlId = 'url-uuid';
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://new-example.com',
      };

      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://old-example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: otherUserId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(
        myUrlsService.update(urlId, userId, updateUrlDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUrlRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete corretamente', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);
      mockUrlRepository.softDelete.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      await myUrlsService.remove(urlId, userId);

      expect(mockUrlRepository.findById).toHaveBeenCalledWith(urlId);
      expect(mockUrlRepository.softDelete).toHaveBeenCalledWith(urlId);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `url:${mockUrl.shortCode}`,
      );
    });

    it('deve lançar ForbiddenException para URLs de outros usuários', async () => {
      const userId = 'user-uuid';
      const otherUserId = 'other-user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: otherUserId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(myUrlsService.remove(urlId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(myUrlsService.remove(urlId, userId)).rejects.toThrow(
        'Esta URL não pertence a você',
      );
      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se URL já foi deletada', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);

      await expect(myUrlsService.remove(urlId, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(myUrlsService.remove(urlId, userId)).rejects.toThrow(
        'URL já foi deletada',
      );
      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se URL não existir', async () => {
      const userId = 'user-uuid';
      const urlId = 'invalid-uuid';

      mockUrlRepository.findById.mockResolvedValue(null);

      await expect(myUrlsService.remove(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve continuar mesmo se falhar ao invalidar cache', async () => {
      const userId = 'user-uuid';
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: 'custom',
        userId,
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.findById.mockResolvedValue(mockUrl);
      mockUrlRepository.softDelete.mockResolvedValue(undefined);
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await myUrlsService.remove(urlId, userId);

      expect(mockUrlRepository.softDelete).toHaveBeenCalledWith(urlId);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha ao invalidar cache',
        expect.objectContaining({
          context: 'MyUrlsService',
          urlId: mockUrl.id,
        }),
      );
    });
  });
});
