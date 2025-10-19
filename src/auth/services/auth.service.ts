import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '../../user/services/user.service';
import { RegisterAuthDto } from '../dtos/register-auth.dto';
import { LoginAuthDto } from '../dtos/login-auth.dto';

/**
 * Interface do payload JWT
 */
export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Interface da resposta de autenticação
 */
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Serviço de autenticação
 */
@Injectable()
export class AuthService {
  private readonly INVALID_CREDENTIALS_MESSAGE = 'Credenciais inválidas';
  private readonly ACCOUNT_DEACTIVATED_MESSAGE = 'Conta desativada';

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Registra um novo usuário no sistema
   * @param registerDto - Dados de registro (email e senha)
   * @returns Token JWT e dados do usuário
   * @throws ConflictException - Se o email já estiver cadastrado
   */
  async register(registerDto: RegisterAuthDto): Promise<AuthResponse> {
    const { email } = registerDto;
    const startTime = Date.now();

    this.logger.info('Tentativa de registro de usuário', {
      context: 'AuthService',
      email,
    });

    try {
      const user = await this.userService.create(registerDto);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
      };

      const access_token = this.jwtService.sign(payload);

      const duration = Date.now() - startTime;
      this.logger.info('Usuário registrado com sucesso', {
        context: 'AuthService',
        userId: user.id,
        email: user.email,
        duration: `${duration}ms`,
      });

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Falha no registro de usuário', {
        context: 'AuthService',
        email,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Autentica um usuário existente
   * @param loginDto - Credenciais de login (email e senha)
   * @returns Token JWT e dados do usuário
   * @throws UnauthorizedException - Se as credenciais forem inválidas
   */
  async login(loginDto: LoginAuthDto): Promise<AuthResponse> {
    const { email, password } = loginDto;
    const startTime = Date.now();

    this.logger.info('Tentativa de login', {
      context: 'AuthService',
      email,
    });

    const user = await this.userService.findByEmail(email);

    if (!user) {
      const duration = Date.now() - startTime;
      this.logger.warn('Falha no login: usuário não encontrado', {
        context: 'AuthService',
        email,
        duration: `${duration}ms`,
      });
      throw new UnauthorizedException(this.INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.isDeleted()) {
      const duration = Date.now() - startTime;
      this.logger.warn('Falha no login: conta desativada', {
        context: 'AuthService',
        email,
        userId: user.id,
        duration: `${duration}ms`,
      });
      throw new UnauthorizedException(this.ACCOUNT_DEACTIVATED_MESSAGE);
    }

    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      const duration = Date.now() - startTime;
      this.logger.warn('Falha no login: senha inválida', {
        context: 'AuthService',
        email,
        userId: user.id,
        duration: `${duration}ms`,
      });
      throw new UnauthorizedException(this.INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    const duration = Date.now() - startTime;
    this.logger.info('Login realizado com sucesso', {
      context: 'AuthService',
      userId: user.id,
      email: user.email,
      duration: `${duration}ms`,
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  /**
   * Valida payload do JWT e retorna dados do usuário
   * Usado pela JwtStrategy
   * @param payload - Payload decodificado do JWT
   * @returns Dados do usuário ou null se inválido
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);

    if (!user || (user && user.isDeleted())) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
