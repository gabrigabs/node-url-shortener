import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UrlRepository } from '../urls/repositories/url.repository';
import { CreateUrlDto } from './dtos/create-url.dto';
import { Url } from '../urls/entities/url.entity';

/**
 * Serviço responsável pela criação de URLs encurtadas
 */
@Injectable()
export class ShortenService {
  private readonly SHORT_CODE_LENGTH = 6;
  private readonly ALIAS_ALREADY_EXISTS_MESSAGE = 'Este alias já está em uso';
  private readonly RESERVED_ROUTES = [
    'auth',
    'docs',
    'my-urls',
    'shorten',
    'healthcheck',
    'api',
    'swagger',
  ];

  constructor(private readonly urlRepository: UrlRepository) {}

  /**
   * Cria uma nova URL encurtada para o usuário autenticado
   * @param userId - ID do usuário autenticado
   * @param createUrlDto - Dados da URL a ser criada
   * @returns URL criada
   * @throws ConflictException - Se o customAlias já existir
   */
  async create(userId: string, createUrlDto: CreateUrlDto): Promise<Url> {
    const { originalUrl, customAlias } = createUrlDto;

    if (customAlias) {
      if (this.isReservedRoute(customAlias)) {
        throw new BadRequestException(
          `O alias '${customAlias}' é uma rota reservada e não pode ser usado`,
        );
      }

      const aliasExists =
        await this.urlRepository.customAliasExists(customAlias);
      if (aliasExists) {
        throw new ConflictException(this.ALIAS_ALREADY_EXISTS_MESSAGE);
      }
    }

    const shortCode = await this.generateUniqueShortCode();

    const url = await this.urlRepository.create({
      originalUrl,
      shortCode,
      customAlias: customAlias ?? null,
      userId,
    });

    return url;
  }

  /**
   * Cria uma nova URL encurtada anônima (sem autenticação)
   * URLs anônimas não podem ter customAlias
   * @param originalUrl - URL original a ser encurtada
   * @returns URL criada
   */
  async createAnonymous(originalUrl: string): Promise<Url> {
    const shortCode = await this.generateUniqueShortCode();

    const url = await this.urlRepository.createAnonymous({
      originalUrl,
      shortCode,
    });

    return url;
  }

  /**
   * Gera um shortCode único
   * Tenta gerar até encontrar um código que não exista no banco
   * @returns ShortCode único
   */
  private async generateUniqueShortCode(): Promise<string> {
    let shortCode: string;
    let exists: boolean;

    do {
      shortCode = this.generateRandomCode();
      exists = await this.urlRepository.shortCodeExists(shortCode);
    } while (exists);

    return shortCode;
  }

  /**
   * Gera um código aleatório de 6 caracteres
   * Usa letras maiúsculas, minúsculas e números
   * @returns Código aleatório
   */
  private generateRandomCode(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < this.SHORT_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  }

  /**
   * Verifica se o alias é uma rota reservada
   * @param alias - Alias a verificar
   * @returns true se for rota reservada
   */
  private isReservedRoute(alias: string): boolean {
    return this.RESERVED_ROUTES.includes(alias.toLowerCase());
  }
}
