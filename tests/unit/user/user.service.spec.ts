import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../src/user/services/user.service';
import { UserRepository } from '../../../src/user/repositories/user.repository';
import { User } from '../../../src/user/entities/user.entity';
import { RegisterAuthDto } from '../../../src/auth/dtos/register-auth.dto';

jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;

  const mockUserRepository = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar usuário com senha hasheada', async () => {
      const createUserDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const hashedPassword = 'hashed-password-123';
      const mockUser = new User({
        id: 'user-uuid',
        email: createUserDto.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.create(createUserDto);

      expect(result).toEqual(mockUser.toSafeObject());
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('deve impedir criação com e-mail existente', async () => {
      const createUserDto: RegisterAuthDto = {
        email: 'existing@example.com',
        password: 'Test@123',
      };

      const existingUser = new User({
        id: 'existing-uuid',
        email: createUserDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(userService.create(createUserDto)).rejects.toThrow(
        'Email já cadastrado no sistema',
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException em caso de violação de unicidade (P2002)', async () => {
      const createUserDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const prismaError: Error & { code?: string } = new Error(
        'Unique constraint failed',
      );
      prismaError.code = 'P2002';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(prismaError);

      await expect(userService.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(userService.create(createUserDto)).rejects.toThrow(
        'Email já cadastrado no sistema',
      );
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      const createUserDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const unexpectedError = new Error('Database connection failed');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(unexpectedError);

      await expect(userService.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(userService.create(createUserDto)).rejects.toThrow(
        'Erro ao criar usuário. Tente novamente mais tarde ou contate o suporte.',
      );
    });
  });

  describe('findByEmail', () => {
    it('deve buscar usuário por email', async () => {
      const email = 'test@example.com';
      const mockUser = new User({
        id: 'user-uuid',
        email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('deve retornar null se usuário não for encontrado', async () => {
      const email = 'notfound@example.com';
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('findById', () => {
    it('deve buscar usuário por ID e retornar dados seguros', async () => {
      const userId = 'user-uuid';
      const mockUser = new User({
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById(userId);

      expect(result).toEqual(mockUser.toSafeObject());
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe('test@example.com');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('deve retornar null se usuário não for encontrado', async () => {
      const userId = 'invalid-uuid';
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('softDelete', () => {
    it('deve realizar soft delete corretamente', async () => {
      const userId = 'user-uuid';
      const mockUser = new User({
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.softDelete.mockResolvedValue(undefined);

      await userService.softDelete(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
    });

    it('deve lançar NotFoundException se usuário não existir', async () => {
      const userId = 'invalid-uuid';
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.softDelete(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(userService.softDelete(userId)).rejects.toThrow(
        'Usuário não encontrado',
      );
      expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se usuário já foi deletado', async () => {
      const userId = 'user-uuid';
      const mockDeletedUser = new User({
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(), // Já deletado
      });

      mockUserRepository.findById.mockResolvedValue(mockDeletedUser);

      await expect(userService.softDelete(userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(userService.softDelete(userId)).rejects.toThrow(
        'Usuário já foi deletado',
      );
      expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('deve retornar true para senha válida', async () => {
      const plainPassword = 'Test@123';
      const hashedPassword = 'hashed-password-123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.validatePassword(
        plainPassword,
        hashedPassword,
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
    });

    it('deve retornar false para senha inválida', async () => {
      const plainPassword = 'WrongPassword';
      const hashedPassword = 'hashed-password-123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.validatePassword(
        plainPassword,
        hashedPassword,
      );

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
    });
  });
});
