import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UrlRepository } from '../../urls/repositories/url.repository';
import { UpdateUrlDto } from '../dtos/update-url.dto';
import { Url } from '../../urls/entities/url.entity';

/**
 * Serviço de gerenciamento de URLs do usuário autenticado
 */
@Injectable()
export class MyUrlsService {
  private readonly URL_NOT_FOUND_MESSAGE = 'URL não encontrada';
  private readonly URL_NOT_BELONGS_TO_USER_MESSAGE =
    'Esta URL não pertence a você';
  private readonly ALREADY_DELETED_MESSAGE = 'URL já foi deletada';

  constructor(private readonly urlRepository: UrlRepository) {}

  /**
   * Retorna todas as URLs do usuário autenticado
   * Filtra URLs soft deletadas
   * @param userId - ID do usuário autenticado
   * @returns Lista de URLs do usuário
   */
  async findAllByUser(userId: string): Promise<Url[]> {
    return this.urlRepository.findByUserId(userId);
  }

  /**
   * Busca uma URL específica do usuário por ID
   * @param id - ID da URL
   * @param userId - ID do usuário autenticado
   * @returns URL encontrada
   * @throws NotFoundException - Se a URL não for encontrada
   * @throws ForbiddenException - Se a URL não pertencer ao usuário
   */
  async findOneByUser(id: string, userId: string): Promise<Url> {
    const url = await this.urlRepository.findById(id);

    if (!url || url.isDeleted()) {
      throw new NotFoundException(this.URL_NOT_FOUND_MESSAGE);
    }

    if (!url.belongsToUser(userId)) {
      throw new ForbiddenException(this.URL_NOT_BELONGS_TO_USER_MESSAGE);
    }

    return url;
  }

  /**
   * Atualiza a originalUrl de uma URL do usuário
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
  ): Promise<Url> {
    await this.findOneByUser(id, userId);

    const updatedUrl = await this.urlRepository.update(id, {
      originalUrl: updateUrlDto.originalUrl,
    });

    return updatedUrl;
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

    await this.urlRepository.softDelete(id);
  }
}
