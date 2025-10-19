import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MyUrlsService } from '../services/my-urls.service';
import { UpdateUrlDto } from '../dtos/update-url.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Controller de gerenciamento de URLs do usuário autenticado
 */
@ApiTags('my-urls')
@Controller('my-urls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MyUrlsController {
  constructor(private readonly myUrlsService: MyUrlsService) {}

  /**
   * Retorna todas as URLs do usuário autenticado
   * Exclui URLs soft deletadas
   * @param req - Request contendo dados do usuário
   * @returns Lista de URLs do usuário
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas as URLs do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de URLs do usuário',
    schema: {
      example: [
        {
          id: 'uuid-da-url',
          originalUrl: 'https://www.exemplo.com/pagina',
          shortCode: 'aB3xY9',
          customAlias: null,
          userId: 'uuid-do-usuario',
          accessCount: 5,
          createdAt: '2025-10-18T12:00:00.000Z',
          updatedAt: '2025-10-18T12:00:00.000Z',
          deletedAt: null,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  async findAll(@Request() req: { user: { id: string } }) {
    return this.myUrlsService.findAllByUser(req.user.id);
  }

  /**
   * Busca uma URL específica do usuário por ID
   * @param req - Request contendo dados do usuário
   * @param id - ID da URL
   * @returns URL encontrada
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar URL específica do usuário por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID da URL',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'URL encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'URL não pertence ao usuário',
  })
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.myUrlsService.findOneByUser(id, req.user.id);
  }

  /**
   * Atualiza a originalUrl de uma URL do usuário
   * Apenas o proprietário pode atualizar
   * @param req - Request contendo dados do usuário
   * @param id - ID da URL
   * @param updateUrlDto - Novos dados da URL
   * @returns URL atualizada
   */
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar URL do usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID da URL a ser atualizada',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateUrlDto })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'URL não pertence ao usuário',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    return this.myUrlsService.update(id, req.user.id, updateUrlDto);
  }

  /**
   * Soft delete de uma URL do usuário
   * Apenas o proprietário pode deletar
   * @param req - Request contendo dados do usuário
   * @param id - ID da URL
   * @returns Confirmação de exclusão
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar URL do usuário (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID da URL a ser deletada',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 204,
    description: 'URL deletada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'URL não pertence ao usuário',
  })
  @ApiResponse({
    status: 400,
    description: 'URL já foi deletada',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  async remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    await this.myUrlsService.remove(id, req.user.id);
  }
}
