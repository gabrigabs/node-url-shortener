import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/controllers/auth.controller';
import { AuthService } from '../../../src/auth/services/auth.service';
import { RegisterAuthDto } from '../../../src/auth/dtos/register-auth.dto';
import { LoginAuthDto } from '../../../src/auth/dtos/login-auth.dto';

describe('AuthController', () => {
  let authController: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockResponse = {
        access_token: 'mock-token',
        user: {
          id: 'user-uuid',
          email: registerDto.email,
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await authController.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro do service', async () => {
      const registerDto: RegisterAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const error = new Error('Email já cadastrado');
      mockAuthService.register.mockRejectedValue(error);

      await expect(authController.register(registerDto)).rejects.toThrow(error);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockResponse = {
        access_token: 'mock-token',
        user: {
          id: 'user-uuid',
          email: loginDto.email,
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await authController.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro de credenciais inválidas', async () => {
      const loginDto: LoginAuthDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const error = new Error('Credenciais inválidas');
      mockAuthService.login.mockRejectedValue(error);

      await expect(authController.login(loginDto)).rejects.toThrow(error);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
