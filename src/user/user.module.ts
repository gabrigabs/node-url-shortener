import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';

/**
 * Módulo de Usuários
 */
@Module({
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
