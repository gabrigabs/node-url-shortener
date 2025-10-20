import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  AuthService,
  JwtPayload,
} from '../../../src/auth/services/auth.service';
import { UserService } from '../../../src/user/services/user.service';
import { RegisterAuthDto } from '../../../src/auth/dtos/register-auth.dto';
import { LoginAuthDto } from '../../../src/auth/dtos/login-auth.dto';
import { User } from '../../../src/user/entities/user.entity';
import { createMockLogger } from '../__mocks__/prisma.service.mock';

describe('AuthService', () => {
  let authService: AuthService;

  const mockLogger = createMockLogger();

  const mockUserService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockUser = new User({
        id: 'user-uuid',
        email: registerDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const mockToken = 'mock-jwt-token';

      mockUserService.create.mockResolvedValue(mockUser.toSafeObject());
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tentativa de registro de usuário',
        expect.any(Object),
      );
    });

    it('deve lançar ConflictException ao tentar registrar email duplicado', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      mockUserService.create.mockRejectedValue(
        new ConflictException('Email já cadastrado no sistema'),
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('deve logar erro quando o registro falhar', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const error = new Error('Database error');
      mockUserService.create.mockRejectedValue(error);

      await expect(authService.register(registerDto)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Falha no registro de usuário',
        expect.objectContaining({
          context: 'AuthService',
          email: registerDto.email,
          error: error.message,
        }),
      );
    });
  });

  describe('login', () => {
    it('deve autenticar usuário válido e gerar access_token', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockUser = new User({
        id: 'user-uuid',
        email: loginDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const mockToken = 'mock-jwt-token';

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUserService.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('deve lançar UnauthorizedException para usuário não encontrado', async () => {
      const loginDto: LoginAuthDto = {
        email: 'notfound@example.com',
        password: 'Test@123',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUserService.validatePassword).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException para senha inválida', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = new User({
        id: 'user-uuid',
        email: loginDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.validatePassword.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserService.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException para conta desativada', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockUser = new User({
        id: 'user-uuid',
        email: loginDto.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Conta desativada',
      );
      expect(mockUserService.validatePassword).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('deve validar payload JWT corretamente', async () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'test@example.com',
      };

      const mockUser = new User({
        id: payload.sub,
        email: payload.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockUserService.findById.mockResolvedValue(mockUser.toSafeObject());

      const result = await authService.validateUser(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('deve retornar null para usuário não encontrado', async () => {
      const payload: JwtPayload = {
        sub: 'invalid-uuid',
        email: 'test@example.com',
      };

      mockUserService.findById.mockResolvedValue(null);

      const result = await authService.validateUser(payload);

      expect(result).toBeNull();
      expect(mockUserService.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('deve retornar null para usuário deletado', async () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'test@example.com',
      };

      const mockUser = new User({
        id: payload.sub,
        email: payload.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      mockUserService.findById.mockResolvedValue(mockUser.toSafeObject());

      const result = await authService.validateUser(payload);

      expect(result).toBeNull();
    });
  });
});
