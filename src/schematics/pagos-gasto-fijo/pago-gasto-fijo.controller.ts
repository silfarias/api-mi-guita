import {
  Controller,
  Get,
  Patch,
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
  ApiQuery,
} from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PageDto } from 'src/common/dto/page.dto';

import { PagoGastoFijoService } from './pago-gasto-fijo.service';
import { PagoGastoFijoDTO, PagosGastoFijoDTO } from './dto/pago-gasto-fijo.dto';
import { UpdatePagoGastoFijoRequestDto } from './dto/update-pago-gasto-fijo-request.dto';
import { SearchPagoGastoFijoRequestDto } from './dto/search-pago-gasto-fijo-request.dto';
import { PorInfoInicialRequestDto } from './dto/por-info-inicial-request.dto';

@ApiTags('Pago Gasto Fijo')
@Controller('pago-gasto-fijo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class PagoGastoFijoController {
  constructor(
    private readonly pagoGastoFijoService: PagoGastoFijoService,
  ) {}

  @Get('por-info-inicial')
  @ApiOperation({ summary: 'Obtener gastos fijos y pagos por información inicial (mes/año)' })
  @ApiQuery({
    name: 'infoInicialId',
    type: Number,
    required: true,
    description: 'ID de la información inicial (mes/año)',
  })
  @ApiOkResponse({
    type: PagosGastoFijoDTO,
    description: 'Información inicial con gastos fijos y sus pagos del mes',
  })
  @ApiBadRequestResponse({ description: 'infoInicialId es requerido' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getPagosPorInfoInicial(
    @Query() query: PorInfoInicialRequestDto,
    @Request() req: any,
  ): Promise<PagosGastoFijoDTO> {
    const reqDto = plainToInstance(PorInfoInicialRequestDto, query, {
      enableImplicitConversion: true,
    });
    return await this.pagoGastoFijoService.getPagosPorInfoInicial(
      Number(reqDto.infoInicialId),
      req.user.id,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar pagos de gasto fijo por usuario autenticado' })
  @ApiOkResponse({
    type: PageDto<PagoGastoFijoDTO>,
    description: 'Lista paginada de Pagos Gasto Fijo del usuario autenticado',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchPagoGastoFijoRequestDto,
    @Request() req: any,
  ): Promise<PageDto<PagoGastoFijoDTO>> {
    const reqDto = plainToInstance(SearchPagoGastoFijoRequestDto, request, { enableImplicitConversion: true });
    return this.pagoGastoFijoService.search(reqDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pago gasto fijo por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Pago Gasto Fijo' })
  @ApiOkResponse({
    type: PagoGastoFijoDTO,
    description: 'Pago gasto fijo obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el pago gasto fijo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<PagoGastoFijoDTO> {
    return await this.pagoGastoFijoService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar pago gasto fijo (marcar como pagado/no pagado)' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Pago Gasto Fijo' })
  @ApiBody({
    type: UpdatePagoGastoFijoRequestDto,
    description: 'Datos actualizados del pago gasto fijo',
  })
  @ApiOkResponse({
    type: PagoGastoFijoDTO,
    description: 'Pago gasto fijo actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el pago gasto fijo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagoGastoFijoRequestDto: UpdatePagoGastoFijoRequestDto,
    @Request() req: any,
  ): Promise<PagoGastoFijoDTO> {
    return await this.pagoGastoFijoService.update(id, updatePagoGastoFijoRequestDto, req.user.id);
  }
}
