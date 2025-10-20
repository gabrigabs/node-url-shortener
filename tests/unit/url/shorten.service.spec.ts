import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ShortenService } from '../../../src/shorten/shorten.service';
import { UrlRepository } from '../../../src/urls/repositories/url.repository';
import { Url } from '../../../src/urls/entities/url.entity';
import { CreateUrlDto } from '../../../src/shorten/dtos/create-url.dto';
import { createMockLogger } from '../__mocks__/prisma.service.mock';

jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => {
    return jest.fn(() => 'abc123');
  }),
}));

describe('ShortenService', () => {
  let shortenService: ShortenService;

  const mockLogger = createMockLogger();

  const mockUrlRepository = {
    create: jest.fn(),
    createAnonymous: jest.fn(),
    customAliasExists: jest.fn(),
    shortCodeExists: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortenService,
        {
          provide: UrlRepository,
          useValue: mockUrlRepository,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    shortenService = module.get<ShortenService>(ShortenService);

    jest.clearAllMocks();
  });

  describe('create (authenticated)', () => {
    it('deve criar URL encurtada válida com shortCode de 6 caracteres', async () => {
      const userId = 'user-uuid';
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.shortCodeExists.mockResolvedValue(false);
      mockUrlRepository.create.mockResolvedValue(mockUrl);

      const result = await shortenService.create(userId, createUrlDto);

      expect(result).toEqual(mockUrl);
      expect(result.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId,
      });
    });

    it('deve criar URL com customAlias válido', async () => {
      const userId = 'user-uuid';
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customAlias: 'mylink',
      };

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: 'mylink',
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.customAliasExists.mockResolvedValue(false);
      mockUrlRepository.shortCodeExists.mockResolvedValue(false);
      mockUrlRepository.create.mockResolvedValue(mockUrl);

      const result = await shortenService.create(userId, createUrlDto);

      expect(result).toEqual(mockUrl);
      expect(result.customAlias).toBe('mylink');
      expect(mockUrlRepository.customAliasExists).toHaveBeenCalledWith(
        'mylink',
      );
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: 'mylink',
        userId,
      });
    });

    it('deve lançar ConflictException para customAlias duplicado', async () => {
      const userId = 'user-uuid';
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customAlias: 'existing',
      };

      mockUrlRepository.customAliasExists.mockResolvedValue(true);

      await expect(shortenService.create(userId, createUrlDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(shortenService.create(userId, createUrlDto)).rejects.toThrow(
        'Este alias já está em uso',
      );
      expect(mockUrlRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException para rotas reservadas', async () => {
      const userId = 'user-uuid';
      const reservedRoutes = ['auth', 'docs', 'api', 'swagger', 'my-urls'];

      for (const route of reservedRoutes) {
        const createUrlDto: CreateUrlDto = {
          originalUrl: 'https://example.com',
          customAlias: route,
        };

        await expect(
          shortenService.create(userId, createUrlDto),
        ).rejects.toThrow(BadRequestException);
        await expect(
          shortenService.create(userId, createUrlDto),
        ).rejects.toThrow(`O alias '${route}' é uma rota reservada`);
      }
    });

    it('deve regenerar shortCode em caso de colisão', async () => {
      const userId = 'user-uuid';
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.shortCodeExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockUrlRepository.create.mockResolvedValue(mockUrl);

      const result = await shortenService.create(userId, createUrlDto);

      expect(result).toEqual(mockUrl);
      expect(mockUrlRepository.shortCodeExists).toHaveBeenCalledTimes(2);
    });

    it('deve associar URL ao usuário autenticado', async () => {
      const userId = 'user-uuid';
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.shortCodeExists.mockResolvedValue(false);
      mockUrlRepository.create.mockResolvedValue(mockUrl);

      const result = await shortenService.create(userId, createUrlDto);

      expect(result.userId).toBe(userId);
      expect(result.belongsToUser(userId)).toBe(true);
    });
  });

  describe('createAnonymous', () => {
    it('deve criar URL anônima sem userId', async () => {
      const originalUrl = 'https://example.com';

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.shortCodeExists.mockResolvedValue(false);
      mockUrlRepository.createAnonymous.mockResolvedValue(mockUrl);

      const result = await shortenService.createAnonymous(originalUrl);

      expect(result).toEqual(mockUrl);
      expect(result.userId).toBeNull();
      expect(result.isAnonymous()).toBe(true);
      expect(mockUrlRepository.createAnonymous).toHaveBeenCalledWith({
        originalUrl,
        shortCode: 'abc123',
      });
    });

    it('deve gerar shortCode único para URL anônima', async () => {
      const originalUrl = 'https://example.com';

      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUrlRepository.shortCodeExists.mockResolvedValue(false);
      mockUrlRepository.createAnonymous.mockResolvedValue(mockUrl);

      const result = await shortenService.createAnonymous(originalUrl);

      expect(result.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(mockUrlRepository.shortCodeExists).toHaveBeenCalledWith('abc123');
    });
  });
});
