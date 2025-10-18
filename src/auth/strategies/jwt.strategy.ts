import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../services/auth.service';

/**
 * Estratégia JWT para validação de tokens
 * Usa Passport.js para autenticação baseada em JWT
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        return secret;
      })(),
    });
  }

  /**
   * Valida o payload do JWT e retorna dados do usuário
   * Chamado automaticamente após o token ser verificado
   * @param payload - Payload decodificado do JWT
   * @returns Dados do usuário para ser anexado ao request
   * @throws UnauthorizedException - Se o usuário não for encontrado ou estiver inativo
   */
  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido ou usuário não encontrado',
      );
    }

    return user;
  }
}
