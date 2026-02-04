import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaRequestDto } from './dto/create-categoria-request.dto';
import { UpdateCategoriaRequestDto } from './dto/update-categoria-request.dto';
import { SearchCategoriaRequestDto } from './dto/search-categoria-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { CategoriaDTO } from './dto/categoria.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categoría')
@Controller('categoria')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class CategoriaController {
  constructor(
    private categoriaService: CategoriaService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar categorías' })
  @ApiOkResponse({ type: PageDto, description: 'Lista paginada de Categorías' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchCategoriaRequestDto,
  ): Promise<PageDto<CategoriaDTO>> {
    const reqDto = plainToInstance(SearchCategoriaRequestDto, request);
    return await this.categoriaService.search(reqDto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una categoría' })
  @ApiBody({
    type: CreateCategoriaRequestDto,
    description: 'Datos de la nueva categoría',
  })
  @ApiOkResponse({
    type: CategoriaDTO,
    description: 'Categoría creada correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createCategoriaRequestDto: CreateCategoriaRequestDto,
  ): Promise<CategoriaDTO> {
    return await this.categoriaService.create(createCategoriaRequestDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Categoría' })
  @ApiOkResponse({
    type: CategoriaDTO,
    description: 'Categoría obtenida correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la categoría' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoriaDTO> {
    return await this.categoriaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Categoría' })
  @ApiBody({
    type: UpdateCategoriaRequestDto,
    description: 'Datos actualizados de la categoría',
  })
  @ApiOkResponse({
    type: CategoriaDTO,
    description: 'Categoría actualizada correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la categoría' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaRequestDto: UpdateCategoriaRequestDto,
  ): Promise<CategoriaDTO> {
    return await this.categoriaService.update(id, updateCategoriaRequestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Categoría' })
  @ApiOkResponse({ description: 'Categoría eliminada correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la categoría' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.categoriaService.remove(id);
  }
}
