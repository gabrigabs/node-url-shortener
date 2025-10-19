import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT Opcional
 * Permite que a requisição prossiga mesmo sem token JWT
 * Se o token existir e for válido, popula req.user
 * Se não existir ou for inválido, req.user fica undefined
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override do método handleRequest para não lançar erro
   * quando não há autenticação
   */
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      return null;
    }
    return user;
  }

  /**
   * Sempre permite a ativação do guard
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
