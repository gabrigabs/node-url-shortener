import { Test, TestingModule } from '@nestjs/testing';
import { ShortenController } from '../../../src/shorten/controllers/shorten.controller';
import { ShortenService } from '../../../src/shorten/shorten.service';
import { CreateUrlDto } from '../../../src/shorten/dtos/create-url.dto';
import { UrlResponseDto } from '../../../src/urls/dtos/url-response.dto';

describe('ShortenController', () => {
  let shortenController: ShortenController;

  const mockShortenService = {
    create: jest.fn(),
    createAnonymous: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortenController],
      providers: [
        {
          provide: ShortenService,
          useValue: mockShortenService,
        },
      ],
    }).compile();

    shortenController = module.get<ShortenController>(ShortenController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar URL autenticada quando usuário está logado', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customAlias: 'mylink',
      };

      const req = {
        user: { id: 'user-uuid' },
      };

      const mockResponse: UrlResponseDto = {
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: 'mylink',
        shortUrl: 'http://localhost:3000/mylink',
        userId: 'user-uuid',
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockShortenService.create.mockResolvedValue(mockResponse);

      const result = await shortenController.create(req, createUrlDto);

      expect(result).toEqual(mockResponse);
      expect(result.shortUrl).toBe('http://localhost:3000/mylink');
      expect(mockShortenService.create).toHaveBeenCalledWith(
        'user-uuid',
        createUrlDto,
      );
      expect(mockShortenService.createAnonymous).not.toHaveBeenCalled();
    });

    it('deve criar URL anônima quando usuário não está logado', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      const req = {};

      const mockResponse: UrlResponseDto = {
        id: 'url-uuid',
        originalUrl: createUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        shortUrl: 'http://localhost:3000/abc123',
        userId: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockShortenService.createAnonymous.mockResolvedValue(mockResponse);

      const result = await shortenController.create(req, createUrlDto);

      expect(result).toEqual(mockResponse);
      expect(result.shortUrl).toBe('http://localhost:3000/abc123');
      expect(mockShortenService.createAnonymous).toHaveBeenCalledWith(
        createUrlDto.originalUrl,
      );
      expect(mockShortenService.create).not.toHaveBeenCalled();
    });

    it('deve propagar erro ao criar URL com alias inválido', async () => {
      const req = { user: { id: 'user-uuid' } };
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customAlias: 'invalid alias',
      };

      const error = new Error('Alias inválido');
      mockShortenService.create.mockRejectedValue(error);

      await expect(shortenController.create(req, createUrlDto)).rejects.toThrow(
        error,
      );
    });

    it('deve propagar erro de rota reservada', async () => {
      const createUrlDto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customAlias: 'auth',
      };

      const req = {
        user: { id: 'user-uuid' },
      };

      const error = new Error("O alias 'auth' é uma rota reservada");
      mockShortenService.create.mockRejectedValue(error);

      await expect(shortenController.create(req, createUrlDto)).rejects.toThrow(
        error,
      );
    });
  });
});
