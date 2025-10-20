import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';
import {
  AuthService,
  JwtPayload,
} from '../../../src/auth/services/auth.service';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('deve validar payload JWT e retornar dados do usuário', async () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('deve lançar UnauthorizedException se usuário não for encontrado', async () => {
      const payload: JwtPayload = {
        sub: 'invalid-uuid',
        email: 'test@example.com',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        'Token inválido ou usuário não encontrado',
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('deve lançar UnauthorizedException se usuário estiver inativo', async () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'test@example.com',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(payload);
    });
  });

  describe('constructor', () => {
    it('deve lançar erro se JWT_SECRET não estiver configurado', () => {
      const mockBadConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => {
        new JwtStrategy(
          mockAuthService as unknown as AuthService,
          mockBadConfigService as unknown as ConfigService,
        );
      }).toThrow('JWT_SECRET is not configured');
    });
  });
});
