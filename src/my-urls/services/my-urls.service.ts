import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UrlRepository } from '../../urls/repositories/url.repository';
import { UpdateUrlDto } from '../dtos/update-url.dto';
import { Url } from '../../urls/entities/url.entity';
import { UrlResponseDto } from '../../urls/dtos/url-response.dto';

/**
 * Serviço de gerenciamento de URLs do usuário autenticado
 */
@Injectable()
export class MyUrlsService {
  private readonly URL_NOT_FOUND_MESSAGE = 'URL não encontrada';
  private readonly URL_NOT_BELONGS_TO_USER_MESSAGE =
    'Esta URL não pertence a você';
  private readonly ALREADY_DELETED_MESSAGE = 'URL já foi deletada';
  private readonly baseUrl: string;

  constructor(
    private readonly urlRepository: UrlRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Retorna todas as URLs do usuário autenticado
   * Filtra URLs soft deletadas
   * @param userId - ID do usuário autenticado
   * @returns Lista de URLs do usuário
   */
  async findAllByUser(userId: string): Promise<UrlResponseDto[]> {
    const startTime = Date.now();

    this.logger.info('Listando URLs do usuário', {
      context: 'MyUrlsService',
      userId,
    });

    const urls = await this.urlRepository.findByUserId(userId);
    const duration = Date.now() - startTime;

    this.logger.info('URLs listadas com sucesso', {
      context: 'MyUrlsService',
      userId,
      count: urls.length,
      duration: `${duration}ms`,
    });

    return urls.map((url) => this.mapToResponseDto(url));
  }

  /**
   * Busca uma URL específica do usuário por ID
   * @param id - ID da URL
   * @param userId - ID do usuário autenticado
   * @returns URL encontrada
   * @throws NotFoundException - Se a URL não for encontrada
   * @throws ForbiddenException - Se a URL não pertencer ao usuário
   */
  async findOneByUser(id: string, userId: string): Promise<UrlResponseDto> {
    const url = await this.urlRepository.findById(id);

    if (!url || url.isDeleted()) {
      throw new NotFoundException(this.URL_NOT_FOUND_MESSAGE);
    }

    if (!url.belongsToUser(userId)) {
      throw new ForbiddenException(this.URL_NOT_BELONGS_TO_USER_MESSAGE);
    }

    return this.mapToResponseDto(url);
  }

  /**
   * Atualiza a originalUrl de uma URL do usuário
   * Invalida cache após atualização
   * @param id - ID da URL
   * @param userId - ID do usuário autenticado
   * @param updateUrlDto - Novos dados da URL
   * @returns URL atualizada
   * @throws NotFoundException - Se a URL não for encontrada
   * @throws ForbiddenException - Se a URL não pertencer ao usuário
   */
  async update(
    id: string,
    userId: string,
    updateUrlDto: UpdateUrlDto,
  ): Promise<UrlResponseDto> {
    const startTime = Date.now();

    const urlBeforeUpdate = await this.urlRepository.findById(id);

    if (!urlBeforeUpdate || urlBeforeUpdate.isDeleted()) {
      throw new NotFoundException(this.URL_NOT_FOUND_MESSAGE);
    }

    if (!urlBeforeUpdate.belongsToUser(userId)) {
      throw new ForbiddenException(this.URL_NOT_BELONGS_TO_USER_MESSAGE);
    }

    this.logger.info('Atualizando URL', {
      context: 'MyUrlsService',
      urlId: id,
      userId,
      oldUrl: urlBeforeUpdate.originalUrl,
      newUrl: updateUrlDto.originalUrl,
    });

    const updatedUrl = await this.urlRepository.update(id, {
      originalUrl: updateUrlDto.originalUrl,
    });

    await this.invalidateUrlCache(urlBeforeUpdate);

    const duration = Date.now() - startTime;
    this.logger.info('URL atualizada com sucesso', {
      context: 'MyUrlsService',
      urlId: id,
      userId,
      duration: `${duration}ms`,
    });

    return this.mapToResponseDto(updatedUrl);
  }

  /**
   * Soft delete de uma URL do usuário
   * @param id - ID da URL
   * @param userId - ID do usuário autenticado
   * @throws NotFoundException - Se a URL não for encontrada
   * @throws ForbiddenException - Se a URL não pertencer ao usuário
   * @throws BadRequestException - Se a URL já foi deletada
   */
  async remove(id: string, userId: string): Promise<void> {
    const startTime = Date.now();
    const url = await this.urlRepository.findById(id);

    if (!url) {
      throw new NotFoundException(this.URL_NOT_FOUND_MESSAGE);
    }

    if (!url.belongsToUser(userId)) {
      throw new ForbiddenException(this.URL_NOT_BELONGS_TO_USER_MESSAGE);
    }

    if (url.isDeleted()) {
      throw new BadRequestException(this.ALREADY_DELETED_MESSAGE);
    }

    this.logger.info('Deletando URL', {
      context: 'MyUrlsService',
      urlId: id,
      userId,
      shortCode: url.shortCode,
      customAlias: url.customAlias,
    });

    await this.urlRepository.softDelete(id);

    await this.invalidateUrlCache(url);

    const duration = Date.now() - startTime;
    this.logger.info('URL deletada com sucesso', {
      context: 'MyUrlsService',
      urlId: id,
      userId,
      duration: `${duration}ms`,
    });
  }

  /**
   * Invalida cache de uma URL (shortCode e customAlias)
   * @param url - URL a ter cache invalidado
   */
  private async invalidateUrlCache(url: Url): Promise<void> {
    try {
      await this.cacheManager.del(`url:${url.shortCode}`);

      if (url.customAlias) {
        await this.cacheManager.del(`url:${url.customAlias}`);
      }

      this.logger.info('Cache invalidado', {
        context: 'MyUrlsService',
        shortCode: url.shortCode,
        customAlias: url.customAlias,
      });
    } catch (error) {
      this.logger.error('Falha ao invalidar cache', {
        context: 'MyUrlsService',
        urlId: url.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Mapeia entidade Url para UrlResponseDto com shortUrl completa
   * @param url - Entidade URL
   * @returns DTO de resposta com shortUrl
   */
  private mapToResponseDto(url: Url): UrlResponseDto {
    const code = url.customAlias || url.shortCode;
    const shortUrl = `${this.baseUrl}/${code}`;

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      customAlias: url.customAlias,
      shortUrl,
      userId: url.userId,
      accessCount: url.accessCount,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
      deletedAt: url.deletedAt,
    };
  }
}
