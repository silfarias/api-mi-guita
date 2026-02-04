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
  Request,
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
import { MovimientoService } from './movimiento.service';
import { CreateMovimientoRequestDto } from './dto/create-movimiento-request.dto';
import { UpdateMovimientoRequestDto } from './dto/update-movimiento-request.dto';
import { SearchMovimientoRequestDto } from './dto/search-movimiento-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { MovimientoDTO, MovimientoAgrupadoDTO } from './dto/movimiento.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Movimiento')
@Controller('movimiento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MovimientoController {
  constructor(
    private movimientoService: MovimientoService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar movimientos agrupados por información inicial' })
  @ApiOkResponse({ 
    type: PageDto<MovimientoAgrupadoDTO>, 
    description: 'Lista paginada de Movimientos agrupados por información inicial del usuario autenticado' 
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchMovimientoRequestDto,
    @Request() req: any,
  ): Promise<PageDto<MovimientoAgrupadoDTO>> {
    const reqDto = plainToInstance(SearchMovimientoRequestDto, request);
    return await this.movimientoService.searchAgrupado(reqDto, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un movimiento' })
  @ApiBody({
    type: CreateMovimientoRequestDto,
    description: 'Datos del nuevo movimiento',
  })
  @ApiOkResponse({
    type: MovimientoDTO,
    description: 'Movimiento creado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createMovimientoRequestDto: CreateMovimientoRequestDto,
    @Request() req: any,
  ): Promise<MovimientoDTO> {
    return await this.movimientoService.create(createMovimientoRequestDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Movimiento' })
  @ApiOkResponse({
    type: MovimientoDTO,
    description: 'Movimiento obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el movimiento' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MovimientoDTO> {
    return await this.movimientoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar movimiento' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Movimiento' })
  @ApiBody({
    type: UpdateMovimientoRequestDto,
    description: 'Datos actualizados del movimiento',
  })
  @ApiOkResponse({
    type: MovimientoDTO,
    description: 'Movimiento actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el movimiento' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovimientoRequestDto: UpdateMovimientoRequestDto,
    @Request() req: any,
  ): Promise<MovimientoDTO> {
    return await this.movimientoService.update(id, updateMovimientoRequestDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar movimiento' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Movimiento' })
  @ApiOkResponse({ description: 'Movimiento eliminado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el movimiento' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<any> {
    return await this.movimientoService.remove(id, req.user.id);
  }
}
