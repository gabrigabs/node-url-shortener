import { Module } from '@nestjs/common';
import { ShortenController } from './controllers/shorten.controller';
import { ShortenService } from './shorten.service';
import { UrlsModule } from '../urls/urls.module';

/**
 * Módulo responsável pela criação de URLs encurtadas
 */
@Module({
  imports: [UrlsModule],
  controllers: [ShortenController],
  providers: [ShortenService],
})
export class ShortenModule {}
