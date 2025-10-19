import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ShortenService } from '../shorten.service';
import { CreateUrlDto } from '../dtos/create-url.dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';

/**
 * Controller responsável pela criação de URLs encurtadas
 * Gerencia tanto URLs públicas quanto autenticadas
 */
@ApiTags('shorten')
@Controller('shorten')
export class ShortenController {
  constructor(private readonly shortenService: ShortenService) {}

  /**
   * Cria uma nova URL encurtada
   * Se autenticado: permite customAlias e associa ao usuário
   * Se anônimo: cria URL pública apenas com shortCode
   * @param req - Request que pode ou não conter dados do usuário
   * @param createUrlDto - Dados da URL a ser criada
   * @returns URL criada com shortCode gerado
   */
  @Post()
  @Throttle({ short: { limit: 3, ttl: 1000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar nova URL encurtada (pública ou autenticada)',
  })
  @ApiBearerAuth()
  @ApiBody({ type: CreateUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL encurtada criada com sucesso',
    schema: {
      example: {
        id: 'uuid-da-url',
        originalUrl: 'https://www.exemplo.com/pagina-longa',
        shortCode: 'aB3xY9',
        customAlias: 'meu-link',
        userId: 'uuid-do-usuario',
        accessCount: 0,
        createdAt: '2025-10-18T12:00:00.000Z',
        updatedAt: '2025-10-18T12:00:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Alias já está em uso',
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida ou alias em rota reservada',
  })
  async create(
    @Request() req: { user?: { id: string } },
    @Body() createUrlDto: CreateUrlDto,
  ) {
    if (req.user) {
      return this.shortenService.create(req.user.id, createUrlDto);
    }

    return this.shortenService.createAnonymous(createUrlDto.originalUrl);
  }
}
