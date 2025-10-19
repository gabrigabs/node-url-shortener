import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UrlRepository } from '../urls/repositories/url.repository';
import { Url } from '../urls/entities/url.entity';

/**
 * Serviço responsável pelo redirecionamento de URLs encurtadas
 */
@Injectable()
export class RedirectService {
  constructor(
    private readonly urlRepository: UrlRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Busca URL por código (shortCode ou customAlias) e incrementa contador
   * Usado para redirecionamento público
   * @param code - ShortCode ou customAlias
   * @returns URL encontrada
   * @throws NotFoundException - Se a URL não for encontrada ou estiver deletada
   */
  async findByCodeAndIncrement(code: string): Promise<Url> {
    const cacheKey = `url:${code}`;
    const startTime = Date.now();

    try {
      const cacheStartTime = Date.now();
      let url = (await this.cacheManager.get<Url>(cacheKey)) ?? null;
      const cacheDuration = Date.now() - cacheStartTime;

      if (url) {
        this.logger.info('Cache encontrado para URL', {
          context: 'RedirectService',
          code,
          urlId: url.id,
          cacheDuration: `${cacheDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
      } else {
        this.logger.info(
          'Cache não encontrado para URL, consultando banco de dados',
          {
            context: 'RedirectService',
            code,
            cacheDuration: `${cacheDuration}ms`,
          },
        );

        const dbStartTime = Date.now();
        url = await this.urlRepository.findByCode(code);
        const dbDuration = Date.now() - dbStartTime;

        if (!url) {
          this.logger.warn('URL não encontrada', {
            context: 'RedirectService',
            code,
            dbDuration: `${dbDuration}ms`,
            totalDuration: `${Date.now() - startTime}ms`,
          });
          throw new NotFoundException('URL não encontrada');
        }

        const cacheSetStartTime = Date.now();
        await this.cacheManager.set(cacheKey, url, 3600000);
        const cacheSetDuration = Date.now() - cacheSetStartTime;

        this.logger.info('URL armazenada em cache com sucesso', {
          context: 'RedirectService',
          code,
          urlId: url.id,
          dbDuration: `${dbDuration}ms`,
          cacheSetDuration: `${cacheSetDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
      }

      this.urlRepository.incrementAccessCount(url.id).catch((error: Error) => {
        this.logger.error('Falha ao incrementar contador de acessos', {
          context: 'RedirectService',
          urlId: url.id,
          error: error.message,
        });
      });

      this.logger.info('Redirecionamento de URL', {
        context: 'RedirectService',
        code,
        urlId: url.id,
        originalUrl: url.originalUrl,
        accessCount: url.accessCount,
        totalDuration: `${Date.now() - startTime}ms`,
      });

      return url;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Erro em findByCodeAndIncrement', {
        context: 'RedirectService',
        code,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        totalDuration: `${Date.now() - startTime}ms`,
      });

      throw error;
    }
  }

  /**
   * Invalida cache de uma URL específica
   * Usado quando URL é atualizada ou deletada
   * @param code - ShortCode ou customAlias
   */
  async invalidateCache(code: string): Promise<void> {
    const cacheKey = `url:${code}`;

    try {
      await this.cacheManager.del(cacheKey);

      this.logger.info('Cache invalidado', {
        context: 'RedirectService',
        code,
      });
    } catch (error) {
      this.logger.error('Falha ao invalidar cache', {
        context: 'RedirectService',
        code,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
