import { Test, TestingModule } from '@nestjs/testing';
import { MyUrlsController } from '../../../src/my-urls/controllers/my-urls.controller';
import { MyUrlsService } from '../../../src/my-urls/services/my-urls.service';
import { UpdateUrlDto } from '../../../src/my-urls/dtos/update-url.dto';
import { Url } from '../../../src/urls/entities/url.entity';

describe('MyUrlsController', () => {
  let myUrlsController: MyUrlsController;

  const mockMyUrlsService = {
    findAllByUser: jest.fn(),
    findOneByUser: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-uuid' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyUrlsController],
      providers: [
        {
          provide: MyUrlsService,
          useValue: mockMyUrlsService,
        },
      ],
    }).compile();

    myUrlsController = module.get<MyUrlsController>(MyUrlsController);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve listar todas as URLs do usuário', async () => {
      const mockUrls = [
        new Url({
          id: 'url-uuid-1',
          originalUrl: 'https://example1.com',
          shortCode: 'abc123',
          customAlias: null,
          userId: 'user-uuid',
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
          userId: 'user-uuid',
          accessCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      mockMyUrlsService.findAllByUser.mockResolvedValue(mockUrls);

      const result = await myUrlsController.findAll(mockRequest);

      expect(result).toEqual(mockUrls);
      expect(mockMyUrlsService.findAllByUser).toHaveBeenCalledWith('user-uuid');
    });

    it('deve retornar array vazio quando usuário não tem URLs', async () => {
      mockMyUrlsService.findAllByUser.mockResolvedValue([]);

      const result = await myUrlsController.findAll(mockRequest);

      expect(result).toEqual([]);
      expect(mockMyUrlsService.findAllByUser).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('findOne', () => {
    it('deve buscar URL específica do usuário', async () => {
      const urlId = 'url-uuid';
      const mockUrl = new Url({
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockMyUrlsService.findOneByUser.mockResolvedValue(mockUrl);

      const result = await myUrlsController.findOne(mockRequest, urlId);

      expect(result).toEqual(mockUrl);
      expect(mockMyUrlsService.findOneByUser).toHaveBeenCalledWith(
        urlId,
        'user-uuid',
      );
    });

    it('deve propagar erro quando URL não for encontrada', async () => {
      const urlId = 'invalid-uuid';
      const error = new Error('URL não encontrada');

      mockMyUrlsService.findOneByUser.mockRejectedValue(error);

      await expect(
        myUrlsController.findOne(mockRequest, urlId),
      ).rejects.toThrow(error);
    });

    it('deve propagar erro quando URL não pertence ao usuário', async () => {
      const urlId = 'url-uuid';
      const error = new Error('Esta URL não pertence a você');

      mockMyUrlsService.findOneByUser.mockRejectedValue(error);

      await expect(
        myUrlsController.findOne(mockRequest, urlId),
      ).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('deve atualizar URL do usuário', async () => {
      const urlId = 'url-uuid';
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://new-example.com',
      };

      const mockUrl = new Url({
        id: urlId,
        originalUrl: updateUrlDto.originalUrl,
        shortCode: 'abc123',
        customAlias: null,
        userId: 'user-uuid',
        accessCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockMyUrlsService.update.mockResolvedValue(mockUrl);

      const result = await myUrlsController.update(
        mockRequest,
        urlId,
        updateUrlDto,
      );

      expect(result).toEqual(mockUrl);
      expect(mockMyUrlsService.update).toHaveBeenCalledWith(
        urlId,
        'user-uuid',
        updateUrlDto,
      );
    });

    it('deve propagar erro ao tentar atualizar URL de outro usuário', async () => {
      const urlId = 'url-uuid';
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://new-example.com',
      };

      const error = new Error('Esta URL não pertence a você');
      mockMyUrlsService.update.mockRejectedValue(error);

      await expect(
        myUrlsController.update(mockRequest, urlId, updateUrlDto),
      ).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('deve deletar URL do usuário', async () => {
      const urlId = 'url-uuid';

      mockMyUrlsService.remove.mockResolvedValue(undefined);

      await myUrlsController.remove(mockRequest, urlId);

      expect(mockMyUrlsService.remove).toHaveBeenCalledWith(urlId, 'user-uuid');
    });

    it('deve propagar erro ao tentar deletar URL de outro usuário', async () => {
      const urlId = 'url-uuid';
      const error = new Error('Esta URL não pertence a você');

      mockMyUrlsService.remove.mockRejectedValue(error);

      await expect(myUrlsController.remove(mockRequest, urlId)).rejects.toThrow(
        error,
      );
    });

    it('deve propagar erro ao tentar deletar URL já deletada', async () => {
      const urlId = 'url-uuid';
      const error = new Error('URL já foi deletada');

      mockMyUrlsService.remove.mockRejectedValue(error);

      await expect(myUrlsController.remove(mockRequest, urlId)).rejects.toThrow(
        error,
      );
    });
  });
});
