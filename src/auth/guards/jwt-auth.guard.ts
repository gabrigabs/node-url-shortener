import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT para proteção de rotas
 * Verifica se o usuário possui um token JWT válido
 * Use @UseGuards(JwtAuthGuard) em controllers ou rotas específicas
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Método para customizar comportamento do guard se necessário
   * Por padrão, delega para AuthGuard('jwt')
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
