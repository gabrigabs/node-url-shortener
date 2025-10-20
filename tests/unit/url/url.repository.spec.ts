import { Test, TestingModule } from '@nestjs/testing';
import { UrlRepository } from '../../../src/urls/repositories/url.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { Url } from '../../../src/urls/entities/url.entity';

describe('UrlRepository', () => {
  let urlRepository: UrlRepository;

  const mockPrismaService = {
    url: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    urlRepository = module.get<UrlRepository>(UrlRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma nova URL com sucesso', async () => {
      const urlData = {
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: 'custom',
        userId: 'user-uuid',
      };

      const mockUrlData = {
        id: 'url-uuid',
        ...urlData,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.create.mockResolvedValue(mockUrlData);

      const result = await urlRepository.create(urlData);

      expect(result).toBeInstanceOf(Url);
      expect(result.id).toBe(mockUrlData.id);
      expect(result.originalUrl).toBe(urlData.originalUrl);
      expect(result.shortCode).toBe(urlData.shortCode);
      expect(mockPrismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: urlData.originalUrl,
          shortCode: urlData.shortCode,
          customAlias: urlData.customAlias,
          userId: urlData.userId,
        },
      });
    });

    it('deve criar uma URL sem customAlias', async () => {
      const urlData = {
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        userId: 'user-uuid',
      };

      const mockUrlData = {
        id: 'url-uuid',
        ...urlData,
        customAlias: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.create.mockResolvedValue(mockUrlData);

      const result = await urlRepository.create(urlData);

      expect(result).toBeInstanceOf(Url);
      expect(mockPrismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: urlData.originalUrl,
          shortCode: urlData.shortCode,
          customAlias: null,
          userId: urlData.userId,
        },
      });
    });
  });

  describe('findById', () => {
    it('deve retornar uma URL quando encontrada', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findUnique.mockResolvedValue(mockUrlData);

      const result = await urlRepository.findById('url-uuid');

      expect(result).toBeInstanceOf(Url);
      expect(result?.id).toBe(mockUrlData.id);
      expect(mockPrismaService.url.findUnique).toHaveBeenCalledWith({
        where: { id: 'url-uuid' },
      });
    });

    it('deve retornar null quando URL não encontrada', async () => {
      mockPrismaService.url.findUnique.mockResolvedValue(null);

      const result = await urlRepository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(mockPrismaService.url.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('findByShortCode', () => {
    it('deve retornar uma URL quando encontrada', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findUnique.mockResolvedValue(mockUrlData);

      const result = await urlRepository.findByShortCode('abc123');

      expect(result).toBeInstanceOf(Url);
      expect(result?.shortCode).toBe('abc123');
      expect(mockPrismaService.url.findUnique).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
      });
    });

    it('deve retornar null quando não encontrada', async () => {
      mockPrismaService.url.findUnique.mockResolvedValue(null);

      const result = await urlRepository.findByShortCode('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCustomAlias', () => {
    it('deve retornar uma URL quando encontrada', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: 'custom',
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findUnique.mockResolvedValue(mockUrlData);

      const result = await urlRepository.findByCustomAlias('custom');

      expect(result).toBeInstanceOf(Url);
      expect(result?.customAlias).toBe('custom');
      expect(mockPrismaService.url.findUnique).toHaveBeenCalledWith({
        where: { customAlias: 'custom' },
      });
    });

    it('deve retornar null quando não encontrada', async () => {
      mockPrismaService.url.findUnique.mockResolvedValue(null);

      const result = await urlRepository.findByCustomAlias('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('deve retornar todas as URLs ativas do usuário', async () => {
      const mockUrlsData = [
        {
          id: 'url-uuid-1',
          originalUrl: 'https://example1.com',
          shortCode: 'abc123',
          customAlias: null,
          userId: 'user-uuid',
          accessCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'url-uuid-2',
          originalUrl: 'https://example2.com',
          shortCode: 'xyz789',
          customAlias: 'custom',
          userId: 'user-uuid',
          accessCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.url.findMany.mockResolvedValue(mockUrlsData);

      const result = await urlRepository.findByUserId('user-uuid');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Url);
      expect(result[1]).toBeInstanceOf(Url);
      expect(mockPrismaService.url.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('deve retornar array vazio quando usuário não tem URLs', async () => {
      mockPrismaService.url.findMany.mockResolvedValue([]);

      const result = await urlRepository.findByUserId('user-uuid');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('deve atualizar uma URL com sucesso', async () => {
      const updateData = {
        originalUrl: 'https://updated.com',
        accessCount: 10,
      };

      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: updateData.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: updateData.accessCount,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.update.mockResolvedValue(mockUrlData);

      const result = await urlRepository.update('url-uuid', updateData);

      expect(result).toBeInstanceOf(Url);
      expect(result.originalUrl).toBe(updateData.originalUrl);
      expect(result.accessCount).toBe(updateData.accessCount);
      expect(mockPrismaService.url.update).toHaveBeenCalledWith({
        where: { id: 'url-uuid' },
        data: updateData,
      });
    });
  });

  describe('softDelete', () => {
    it('deve fazer soft delete de uma URL', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      mockPrismaService.url.update.mockResolvedValue(mockUrlData);

      const result = await urlRepository.softDelete('url-uuid');

      expect(result).toBeInstanceOf(Url);
      expect(result.deletedAt).toBeTruthy();
      expect(mockPrismaService.url.update).toHaveBeenCalledWith({
        where: { id: 'url-uuid' },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });
  });

  describe('incrementAccessCount', () => {
    it('deve incrementar o contador de acessos', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 11,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.update.mockResolvedValue(mockUrlData);

      const result = await urlRepository.incrementAccessCount('url-uuid');

      expect(result).toBeInstanceOf(Url);
      expect(result.accessCount).toBe(11);
      expect(mockPrismaService.url.update).toHaveBeenCalledWith({
        where: { id: 'url-uuid' },
        data: {
          accessCount: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('shortCodeExists', () => {
    it('deve retornar true quando shortCode existe', async () => {
      mockPrismaService.url.count.mockResolvedValue(1);

      const result = await urlRepository.shortCodeExists('abc123');

      expect(result).toBe(true);
      expect(mockPrismaService.url.count).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
      });
    });

    it('deve retornar false quando shortCode não existe', async () => {
      mockPrismaService.url.count.mockResolvedValue(0);

      const result = await urlRepository.shortCodeExists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('customAliasExists', () => {
    it('deve retornar true quando customAlias existe', async () => {
      mockPrismaService.url.count.mockResolvedValue(1);

      const result = await urlRepository.customAliasExists('custom');

      expect(result).toBe(true);
      expect(mockPrismaService.url.count).toHaveBeenCalledWith({
        where: { customAlias: 'custom' },
      });
    });

    it('deve retornar false quando customAlias não existe', async () => {
      mockPrismaService.url.count.mockResolvedValue(0);

      const result = await urlRepository.customAliasExists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findByCode', () => {
    it('deve encontrar URL por shortCode', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findFirst.mockResolvedValue(mockUrlData);

      const result = await urlRepository.findByCode('abc123');

      expect(result).toBeInstanceOf(Url);
      expect(result?.shortCode).toBe('abc123');
      expect(mockPrismaService.url.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ shortCode: 'abc123' }, { customAlias: 'abc123' }],
          deletedAt: null,
        },
      });
    });

    it('deve encontrar URL por customAlias', async () => {
      const mockUrlData = {
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: 'custom',
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findFirst.mockResolvedValue(mockUrlData);

      const result = await urlRepository.findByCode('custom');

      expect(result).toBeInstanceOf(Url);
      expect(result?.customAlias).toBe('custom');
    });

    it('deve retornar null quando código não existe', async () => {
      mockPrismaService.url.findFirst.mockResolvedValue(null);

      const result = await urlRepository.findByCode('non-existent');

      expect(result).toBeNull();
    });

    it('não deve retornar URLs deletadas', async () => {
      mockPrismaService.url.findFirst.mockResolvedValue(null);

      await urlRepository.findByCode('deleted-code');

      expect(mockPrismaService.url.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ shortCode: 'deleted-code' }, { customAlias: 'deleted-code' }],
          deletedAt: null,
        },
      });
    });
  });

  describe('createAnonymous', () => {
    it('deve criar uma URL anônima com sucesso', async () => {
      const urlData = {
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
      };

      const mockUrlData = {
        id: 'url-uuid',
        ...urlData,
        customAlias: null,
        userId: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.create.mockResolvedValue(mockUrlData);

      const result = await urlRepository.createAnonymous(urlData);

      expect(result).toBeInstanceOf(Url);
      expect(result.userId).toBeNull();
      expect(mockPrismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: urlData.originalUrl,
          shortCode: urlData.shortCode,
          customAlias: null,
          userId: null,
        },
      });
    });
  });
});
