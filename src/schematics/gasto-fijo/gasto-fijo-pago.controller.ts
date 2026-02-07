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
  ApiQuery,
} from '@nestjs/swagger';
import { GastoFijoPagoService } from './gasto-fijo-pago.service';
import { CreateGastoFijoPagoRequestDto } from './dto/create-gasto-fijo-pago-request.dto';
import { UpdateGastoFijoPagoRequestDto } from './dto/update-gasto-fijo-pago-request.dto';
import { SearchGastoFijoPagoRequestDto } from './dto/search-gasto-fijo-pago-request.dto';
import { PorInfoInicialRequestDto } from './dto/por-info-inicial-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { GastoFijoPagoDTO, PagosGastoFijoDTO } from './dto/gasto-fijo-pago.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Gasto Fijo Pago')
@Controller('gasto-fijo-pago')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class GastoFijoPagoController {
  constructor(
    private gastoFijoPagoService: GastoFijoPagoService,
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
    return await this.gastoFijoPagoService.getPagosPorInfoInicial(
      Number(reqDto.infoInicialId),
      req.user.id,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar gastos fijos pagos por usuario autenticado' })
  @ApiOkResponse({
    type: PageDto<GastoFijoPagoDTO>,
    description: 'Lista paginada de Gastos Fijos Pagos del usuario autenticado',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchGastoFijoPagoRequestDto,
    @Request() req: any,
  ): Promise<PageDto<GastoFijoPagoDTO>> {
    const reqDto = plainToInstance(SearchGastoFijoPagoRequestDto, request);
    return await this.gastoFijoPagoService.search(reqDto, req.user.id);
  }

  // @Post()
  // @ApiOperation({ summary: 'Crear un gasto fijo pago (registrar pago de un gasto fijo para un mes)' })
  // @ApiBody({
  //   type: CreateGastoFijoPagoRequestDto,
  //   description: 'Datos del nuevo gasto fijo pago',
  // })
  // @ApiOkResponse({
  //   type: GastoFijoPagoDTO,
  //   description: 'Gasto fijo pago creado correctamente',
  // })
  // @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  // @ApiUnauthorizedResponse({ description: 'No autorizado' })
  // async create(
  //   @Body() createGastoFijoPagoRequestDto: CreateGastoFijoPagoRequestDto,
  //   @Request() req: any,
  // ): Promise<GastoFijoPagoDTO> {
  //   return await this.gastoFijoPagoService.create(createGastoFijoPagoRequestDto, req.user.id);
  // }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener gasto fijo pago por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo Pago' })
  @ApiOkResponse({
    type: GastoFijoPagoDTO,
    description: 'Gasto fijo pago obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<GastoFijoPagoDTO> {
    return await this.gastoFijoPagoService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar gasto fijo pago (marcar como pagado/no pagado)' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo Pago' })
  @ApiBody({
    type: UpdateGastoFijoPagoRequestDto,
    description: 'Datos actualizados del gasto fijo pago',
  })
  @ApiOkResponse({
    type: GastoFijoPagoDTO,
    description: 'Gasto fijo pago actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGastoFijoPagoRequestDto: UpdateGastoFijoPagoRequestDto,
    @Request() req: any,
  ): Promise<GastoFijoPagoDTO> {
    return await this.gastoFijoPagoService.update(id, updateGastoFijoPagoRequestDto, req.user.id);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Eliminar gasto fijo pago' })
  // @ApiParam({ name: 'id', required: true, description: 'ID del Gasto Fijo Pago' })
  // @ApiOkResponse({ description: 'Gasto fijo pago eliminado correctamente' })
  // @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  // @ApiNotFoundResponse({ description: 'No se encontró el gasto fijo pago' })
  // @ApiUnauthorizedResponse({ description: 'No autorizado' })
  // async delete(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Request() req: any,
  // ): Promise<any> {
  //   return await this.gastoFijoPagoService.remove(id, req.user.id);
  // }
}
