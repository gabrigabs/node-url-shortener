import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { RedirectService } from '../redirect.service';
import { ErrorResponseDto } from '../../common/dtos/response.dto';

/**
 * Controller responsável pelo redirecionamento de URLs encurtadas
 */
@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  /**
   * Redireciona para a URL original baseado no shortCode ou customAlias
   * Incrementa o contador de acessos
   * IMPORTANTE: Esta rota deve estar por último pois captura qualquer código
   * @param code - ShortCode ou customAlias
   * @param res - Response do Express para redirecionamento
   * @returns Redirecionamento HTTP 302
   */
  @Get(':code')
  @ApiOperation({
    summary: 'Redirecionar para URL original',
    description:
      'Busca URL por shortCode ou customAlias, incrementa contador de acessos e redireciona',
  })
  @ApiParam({
    name: 'code',
    description: 'ShortCode ou customAlias da URL',
    example: 'aB3xY9',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento para URL original',
    headers: {
      Location: {
        description: 'URL original para onde redirecionar',
        schema: {
          type: 'string',
          example: 'https://www.exemplo.com/pagina-destino',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada ou deletada',
    type: ErrorResponseDto,
  })
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const url = await this.redirectService.findByCodeAndIncrement(code);
    return res.redirect(HttpStatus.FOUND, url.originalUrl);
  }
}
