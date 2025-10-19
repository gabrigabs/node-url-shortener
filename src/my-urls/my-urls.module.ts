import { Module } from '@nestjs/common';
import { MyUrlsController } from './controllers/my-urls.controller';
import { MyUrlsService } from './services/my-urls.service';
import { UrlsModule } from '../urls/urls.module';

/**
 * Módulo de gerenciamento de URLs do usuário autenticado
 */
@Module({
  imports: [UrlsModule],
  controllers: [MyUrlsController],
  providers: [MyUrlsService],
})
export class MyUrlsModule {}
