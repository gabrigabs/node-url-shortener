import {
  Injectable,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
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

  /**
   * Gerador de IDs criptograficamente seguro usando nanoid
   * Usa apenas caracteres alfanuméricos (a-z, A-Z, 0-9)
   */
  private readonly nanoid = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    this.SHORT_CODE_LENGTH,
  );

  constructor(
    private readonly urlRepository: UrlRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Cria uma nova URL encurtada para o usuário autenticado
   * @param userId - ID do usuário autenticado
   * @param createUrlDto - Dados da URL a ser criada
   * @returns URL criada
   * @throws ConflictException - Se o customAlias já existir
   */
  async create(userId: string, createUrlDto: CreateUrlDto): Promise<Url> {
    const { originalUrl, customAlias } = createUrlDto;
    const startTime = Date.now();

    this.logger.info('Creating authenticated URL', {
      context: 'ShortenService',
      userId,
      hasCustomAlias: !!customAlias,
      originalUrl,
    });

    if (customAlias) {
      if (this.isReservedRoute(customAlias)) {
        this.logger.warn('Attempted to use reserved route as alias', {
          context: 'ShortenService',
          customAlias,
          userId,
          originalUrl,
        });
        throw new BadRequestException(
          `O alias '${customAlias}' é uma rota reservada e não pode ser usado`,
        );
      }

      const aliasExists =
        await this.urlRepository.customAliasExists(customAlias);
      if (aliasExists) {
        this.logger.warn('Attempted to use existing alias', {
          context: 'ShortenService',
          customAlias,
          userId,
          originalUrl,
        });
        throw new ConflictException(this.ALIAS_ALREADY_EXISTS_MESSAGE);
      }
    }

    const shortCodeStartTime = Date.now();
    const shortCode = await this.generateUniqueShortCode();
    const shortCodeDuration = Date.now() - shortCodeStartTime;

    const url = await this.urlRepository.create({
      originalUrl,
      shortCode,
      customAlias: customAlias ?? null,
      userId,
    });

    const totalDuration = Date.now() - startTime;
    this.logger.info('URL created successfully', {
      context: 'ShortenService',
      urlId: url.id,
      shortCode: url.shortCode,
      customAlias: url.customAlias,
      userId,
      shortCodeGenerationTime: `${shortCodeDuration}ms`,
      totalDuration: `${totalDuration}ms`,
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
    const startTime = Date.now();

    this.logger.info('Creating anonymous URL', {
      context: 'ShortenService',
      originalUrl,
    });

    const shortCodeStartTime = Date.now();
    const shortCode = await this.generateUniqueShortCode();
    const shortCodeDuration = Date.now() - shortCodeStartTime;

    const url = await this.urlRepository.createAnonymous({
      originalUrl,
      shortCode,
    });

    const totalDuration = Date.now() - startTime;
    this.logger.info('Anonymous URL created successfully', {
      context: 'ShortenService',
      urlId: url.id,
      shortCode: url.shortCode,
      shortCodeGenerationTime: `${shortCodeDuration}ms`,
      totalDuration: `${totalDuration}ms`,
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
   * Gera um código aleatório criptograficamente seguro de 6 caracteres
   * Usa nanoid com letras maiúsculas, minúsculas e números
   * @returns Código aleatório seguro
   */
  private generateRandomCode(): string {
    return this.nanoid();
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
