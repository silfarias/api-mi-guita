import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
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
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PageDto } from 'src/common/dto/page.dto';

import { InfoInicialService } from './info-inicial.service';
import { InfoInicialDTO } from './dto/info-inicial.dto';
import { SaldosActualesDTO } from './dto/saldos-actuales.dto';
import { CreateInfoInicialRequestDto } from './dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from './dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from './dto/search-info-inicial-request.dto';

@ApiTags('Info Inicial')
@Controller('info-inicial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class InfoInicialController {
  constructor(private readonly infoInicialService: InfoInicialService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Buscar información inicial',
    description: 'Permite buscar información inicial por usuario, año o mes y retorna una lista paginada',
  })
  @ApiOkResponse({ description: 'Lista paginada de información inicial', type: PageDto })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(@Query() request: SearchInfoInicialRequestDto): Promise<PageDto<InfoInicialDTO>> {
    const reqDto = plainToInstance(SearchInfoInicialRequestDto, request, {
      enableImplicitConversion: true,
    });
    return this.infoInicialService.search(reqDto);
  }

  @Get('por-usuario')
  @ApiOperation({
    summary: 'Obtener información inicial del usuario autenticado',
    description: 'Retorna la lista paginada de información inicial del usuario autenticado',
  })
  @ApiOkResponse({ description: 'Lista paginada de información inicial del usuario', type: PageDto })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findByUsuarioAutenticado(@Request() req: { user: { id: number } }): Promise<PageDto<InfoInicialDTO>> {
    return this.infoInicialService.findByUsuarioAutenticado(req.user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear información inicial',
    description: 'Crea la información inicial del mes (medios de pago con montos, gastos fijos, resumen)',
  })
  @ApiBody({ type: CreateInfoInicialRequestDto, description: 'Datos de la información inicial del mes' })
  @ApiOkResponse({ description: 'Información inicial creada correctamente', type: InfoInicialDTO })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() body: CreateInfoInicialRequestDto,
    @Request() req: { user: { id: number } },
  ): Promise<InfoInicialDTO> {
    return this.infoInicialService.create(body, req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener información inicial por ID',
    description: 'Permite obtener una información inicial por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la información inicial' })
  @ApiOkResponse({ description: 'Información inicial encontrada', type: InfoInicialDTO })
  @ApiNotFoundResponse({ description: 'Información inicial no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InfoInicialDTO> {
    return this.infoInicialService.findOne(id);
  }

  @Get(':id/saldos')
  @ApiOperation({
    summary: 'Obtener saldos actuales por medio de pago',
    description: 'Calcula los saldos actuales por medio de pago para la información inicial',
  })
  @ApiParam({ name: 'id', description: 'ID de la información inicial' })
  @ApiOkResponse({ description: 'Saldos actuales calculados', type: SaldosActualesDTO })
  @ApiNotFoundResponse({ description: 'Información inicial no encontrada' })
  @ApiBadRequestResponse({ description: 'Sin permiso para ver los saldos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async calcularSaldosActuales(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ): Promise<SaldosActualesDTO> {
    return this.infoInicialService.calcularSaldosActuales(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar información inicial',
    description: 'Permite actualizar los datos de una información inicial existente',
  })
  @ApiParam({ name: 'id', description: 'ID de la información inicial' })
  @ApiBody({ type: UpdateInfoInicialRequestDto, description: 'Datos a actualizar' })
  @ApiOkResponse({ description: 'Información inicial actualizada correctamente', type: InfoInicialDTO })
  @ApiNotFoundResponse({ description: 'Información inicial no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInfoInicialRequestDto,
    @Request() req: { user: { id: number } },
  ): Promise<InfoInicialDTO> {
    return this.infoInicialService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar información inicial',
    description: 'Elimina una información inicial de forma lógica (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID de la información inicial' })
  @ApiOkResponse({ description: 'Información inicial eliminada correctamente' })
  @ApiNotFoundResponse({ description: 'Información inicial no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ): Promise<string> {
    return this.infoInicialService.remove(id, req.user.id);
  }
}
