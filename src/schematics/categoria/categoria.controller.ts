import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PageDto } from 'src/common/dto/page.dto';

import { CategoriaService } from './categoria.service';

import { CategoriaDTO } from './dto/categoria.dto';
import { CreateCategoriaRequestDto } from './dto/create-categoria-request.dto';
import { UpdateCategoriaRequestDto } from './dto/update-categoria-request.dto';
import { SearchCategoriaRequestDto } from './dto/search-categoria-request.dto';

@ApiTags('Categoría')
@Controller('categoria')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Buscar categorías',
    description: 'Permite buscar categorías por nombre o estado activo y retorna una lista paginada',
  })
  @ApiOkResponse({
    description: 'Lista paginada de categorías',
    type: PageDto,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(@Query() request: SearchCategoriaRequestDto): Promise<PageDto<CategoriaDTO>> {
    const reqDto = plainToInstance(SearchCategoriaRequestDto, request, {
      enableImplicitConversion: true,
    });
    return this.categoriaService.search(reqDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Permite obtener una categoría por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOkResponse({ description: 'Categoría encontrada', type: CategoriaDTO })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoriaDTO> {
    return this.categoriaService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear categoría',
    description: 'Permite crear una nueva categoría',
  })
  @ApiBody({ type: CreateCategoriaRequestDto, description: 'Datos de la nueva categoría' })
  @ApiOkResponse({ description: 'Categoría creada correctamente', type: CategoriaDTO })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(@Body() body: CreateCategoriaRequestDto): Promise<CategoriaDTO> {
    return this.categoriaService.create(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar categoría',
    description: 'Permite actualizar los datos de una categoría existente',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiBody({ type: UpdateCategoriaRequestDto, description: 'Datos a actualizar' })
  @ApiOkResponse({ description: 'Categoría actualizada correctamente', type: CategoriaDTO })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoriaRequestDto,
  ): Promise<CategoriaDTO> {
    return this.categoriaService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar categoría',
    description: 'Elimina una categoría de forma lógica (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiOkResponse({ description: 'Categoría eliminada correctamente' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<string> {
    return this.categoriaService.remove(id);
  }
}
