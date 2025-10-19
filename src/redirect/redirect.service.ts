import { Injectable, NotFoundException } from '@nestjs/common';
import { UrlRepository } from '../urls/repositories/url.repository';
import { Url } from '../urls/entities/url.entity';

/**
 * Serviço responsável pelo redirecionamento de URLs encurtadas
 */
@Injectable()
export class RedirectService {
  constructor(private readonly urlRepository: UrlRepository) {}

  /**
   * Busca URL por código (shortCode ou customAlias) e incrementa contador
   * Usado para redirecionamento público
   * @param code - ShortCode ou customAlias
   * @returns URL encontrada
   * @throws NotFoundException - Se a URL não for encontrada ou estiver deletada
   */
  async findByCodeAndIncrement(code: string): Promise<Url> {
    const url = await this.urlRepository.findByCode(code);

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    await this.urlRepository.incrementAccessCount(url.id);

    return url;
  }
}
