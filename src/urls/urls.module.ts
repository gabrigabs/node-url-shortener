import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UrlRepository } from './repositories/url.repository';

/**
 * Módulo de recursos compartilhados de URLs
 */
@Module({
  imports: [PrismaModule],
  providers: [UrlRepository],
  exports: [UrlRepository],
})
export class UrlsModule {}
