import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
import { UrlResponseDto } from '../../urls/dtos/url-response.dto';
import { ErrorResponseDto } from '../../common/dtos/response.dto';

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
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Alias já está em uso',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida ou alias em rota reservada',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas requisições (rate limit excedido)',
    type: ErrorResponseDto,
  })
  async create(
    @Request() req: { user?: { id: string } },
    @Body() createUrlDto: CreateUrlDto,
  ): Promise<UrlResponseDto> {
    if (!req.user && createUrlDto.customAlias) {
      throw new BadRequestException(
        'customAlias não é permitido para usuários não autenticados. Faça login para usar alias personalizados.',
      );
    }

    if (req.user) {
      return this.shortenService.create(req.user.id, createUrlDto);
    }

    return this.shortenService.createAnonymous(createUrlDto.originalUrl);
  }
}
