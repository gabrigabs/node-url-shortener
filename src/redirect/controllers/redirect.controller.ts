import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { RedirectService } from '../redirect.service';

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
  })
  @ApiParam({
    name: 'code',
    description: 'ShortCode ou customAlias da URL',
    example: 'aB3xY9',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento para URL original',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada ou deletada',
  })
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const url = await this.redirectService.findByCodeAndIncrement(code);
    return res.redirect(HttpStatus.FOUND, url.originalUrl);
  }
}
