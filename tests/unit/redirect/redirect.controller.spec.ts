import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { RedirectController } from '../../../src/redirect/controllers/redirect.controller';
import { RedirectService } from '../../../src/redirect/redirect.service';
import { Url } from '../../../src/urls/entities/url.entity';

describe('RedirectController', () => {
  let redirectController: RedirectController;

  const mockRedirectService = {
    findByCodeAndIncrement: jest.fn(),
  };

  const mockRedirect = jest.fn();
  const mockResponse = {
    redirect: mockRedirect,
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedirectController],
      providers: [
        {
          provide: RedirectService,
          useValue: mockRedirectService,
        },
      ],
    }).compile();

    redirectController = module.get<RedirectController>(RedirectController);

    jest.clearAllMocks();
  });

  describe('redirect', () => {
    it('deve redirecionar para URL original usando shortCode', async () => {
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

      mockRedirectService.findByCodeAndIncrement.mockResolvedValue(mockUrl);

      await redirectController.redirect(shortCode, mockResponse);

      expect(mockRedirectService.findByCodeAndIncrement).toHaveBeenCalledWith(
        shortCode,
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        HttpStatus.FOUND,
        mockUrl.originalUrl,
      );
    });

    it('deve redirecionar para URL original usando customAlias', async () => {
      const customAlias = 'mylink';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com/page',
        shortCode: 'abc123',
        customAlias,
        userId: 'user-uuid',
        accessCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockRedirectService.findByCodeAndIncrement.mockResolvedValue(mockUrl);

      await redirectController.redirect(customAlias, mockResponse);

      expect(mockRedirectService.findByCodeAndIncrement).toHaveBeenCalledWith(
        customAlias,
      );
      expect(mockRedirect).toHaveBeenCalledWith(
        HttpStatus.FOUND,
        mockUrl.originalUrl,
      );
    });

    it('deve propagar erro quando URL não for encontrada', async () => {
      const code = 'invalid';

      const error = new Error('URL não encontrada');
      mockRedirectService.findByCodeAndIncrement.mockRejectedValue(error);

      await expect(
        redirectController.redirect(code, mockResponse),
      ).rejects.toThrow(error);
      expect(mockRedirectService.findByCodeAndIncrement).toHaveBeenCalledWith(
        code,
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('deve incrementar contador de acessos ao redirecionar', async () => {
      const shortCode = 'abc123';
      const mockUrl = new Url({
        id: 'url-uuid',
        originalUrl: 'https://example.com',
        shortCode,
        customAlias: null,
        userId: null,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockRedirectService.findByCodeAndIncrement.mockResolvedValue(mockUrl);

      await redirectController.redirect(shortCode, mockResponse);

      expect(mockRedirectService.findByCodeAndIncrement).toHaveBeenCalledWith(
        shortCode,
      );
    });
  });
});
