import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../../../src/user/repositories/user.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { User } from '../../../src/user/entities/user.entity';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo usuário com sucesso', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed-password',
      };

      const mockUserData = {
        id: 'user-uuid',
        email: userData.email,
        password: userData.password,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.create.mockResolvedValue(mockUserData);

      const result = await userRepository.create(userData);

      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(mockUserData.id);
      expect(result.email).toBe(userData.email);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário quando encontrado', async () => {
      const mockUserData = {
        id: 'user-uuid',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUserData);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toBeInstanceOf(User);
      expect(result?.email).toBe('test@example.com');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('deve retornar null quando usuário não encontrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail(
        'non-existent@example.com',
      );

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'non-existent@example.com' },
      });
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário quando encontrado', async () => {
      const mockUserData = {
        id: 'user-uuid',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUserData);

      const result = await userRepository.findById('user-uuid');

      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-uuid');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
    });

    it('deve retornar null quando usuário não encontrado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('softDelete', () => {
    it('deve fazer soft delete de um usuário', async () => {
      const mockUserData = {
        id: 'user-uuid',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      mockPrismaService.user.update.mockResolvedValue(mockUserData);

      await userRepository.softDelete('user-uuid');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });
  });

  describe('existsByEmail', () => {
    it('deve retornar true quando email existe', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await userRepository.existsByEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });

    it('deve retornar false quando email não existe', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await userRepository.existsByEmail(
        'non-existent@example.com',
      );

      expect(result).toBe(false);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { email: 'non-existent@example.com', deletedAt: null },
      });
    });

    it('deve retornar false quando email está deletado', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await userRepository.existsByEmail('deleted@example.com');

      expect(result).toBe(false);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { email: 'deleted@example.com', deletedAt: null },
      });
    });
  });
});
