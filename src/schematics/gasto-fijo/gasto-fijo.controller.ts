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
import { GastoFijoService } from './gasto-fijo.service';
import { CreateGastoFijoRequestDto } from './dto/create-gasto-fijo-request.dto';
import { UpdateGastoFijoRequestDto } from './dto/update-gasto-fijo-request.dto';
import { CreateGastoFijoBulkRequestDto } from './dto/create-gasto-fijo-bulk-request.dto';
import { SearchGastoFijoRequestDto } from './dto/search-gasto-fijo-request.dto';
import { GastoFijoDTO, MisGastosFijosResponseDTO } from './dto/gasto-fijo.dto';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Gasto Fijo')
@Controller('gasto-fijo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class GastoFijoController {
  constructor(
    private gastoFijoService: GastoFijoService,
  ) {}

  @Get('mis-gastos-fijos')
  @ApiOperation({ summary: 'Buscar gastos fijos por usuario autenticado' })
  @ApiOkResponse({ 
    type: MisGastosFijosResponseDTO, 
    description: 'Gastos fijos del usuario autenticado agrupados con usuario en cabecera' 
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getMisGastosFijos(
    @Query() request: SearchGastoFijoRequestDto,
    @Request() req: any,
  ): Promise<MisGastosFijosResponseDTO> {
    const reqDto = plainToInstance(SearchGastoFijoRequestDto, request, { enableImplicitConversion: true });
    return this.gastoFijoService.getMisGastosFijos(reqDto, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un gasto fijo' })
  @ApiBody({
    type: CreateGastoFijoRequestDto,
    description: 'Datos del nuevo gasto fijo',
  })
  @ApiOkResponse({
    type: GastoFijoDTO,
    description: 'Gasto fijo creado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createGastoFijoRequestDto: CreateGastoFijoRequestDto,
    @Request() req: any,
  ): Promise<GastoFijoDTO> {
    return await this.gastoFijoService.create(createGastoFijoRequestDto, req.user.id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Crear múltiples gastos fijos en una sola solicitud' })
  @ApiBody({
    type: CreateGastoFijoBulkRequestDto,
    description: 'Array de gastos fijos a crear',
  })
  @ApiOkResponse({
    type: [GastoFijoDTO],
    description: 'Gastos fijos creados correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async createBulk(
    @Body() createGastoFijoBulkRequestDto: CreateGastoFijoBulkRequestDto,
    @Request() req: any,
  ): Promise<GastoFijoDTO[]> {
    return await this.gastoFijoService.createBulk(createGastoFijoBulkRequestDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener gasto fijo por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo' })
  @ApiOkResponse({
    type: GastoFijoDTO,
    description: 'Gasto fijo obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<GastoFijoDTO> {
    return await this.gastoFijoService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar gasto fijo' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo' })
  @ApiBody({
    type: UpdateGastoFijoRequestDto,
    description: 'Datos actualizados del gasto fijo',
  })
  @ApiOkResponse({
    type: GastoFijoDTO,
    description: 'Gasto fijo actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGastoFijoRequestDto: UpdateGastoFijoRequestDto,
    @Request() req: any,
  ): Promise<GastoFijoDTO> {
    return await this.gastoFijoService.update(id, updateGastoFijoRequestDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar gasto fijo' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo' })
  @ApiOkResponse({ description: 'Gasto fijo eliminado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { id: number } },
  ): Promise<string> {
    return this.gastoFijoService.remove(id, req.user.id);
  }
}
