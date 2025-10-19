import { Module } from '@nestjs/common';
import { RedirectController } from './controllers/redirect.controller';
import { RedirectService } from './redirect.service';
import { UrlsModule } from '../urls/urls.module';

/**
 * Módulo responsável pelo redirecionamento de URLs encurtadas
 */
@Module({
  imports: [UrlsModule],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
