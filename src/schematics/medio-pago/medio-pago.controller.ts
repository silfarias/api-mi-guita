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

import { MedioPagoService } from './medio-pago.service';
import { MedioPagoDTO } from './dto/medio-pago.dto';
import { CreateMedioPagoRequestDto } from './dto/create-medio-pago-request.dto';
import { UpdateMedioPagoRequestDto } from './dto/update-medio-pago-request.dto';
import { SearchMedioPagoRequestDto } from './dto/search-medio-pago-request.dto';

@ApiTags('Medio de Pago')
@Controller('medio-pago')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MedioPagoController {
  constructor(private readonly medioPagoService: MedioPagoService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Buscar medios de pago',
    description: 'Permite buscar medios de pago por nombre o tipo y retorna una lista paginada',
  })
  @ApiOkResponse({
    description: 'Lista paginada de medios de pago',
    type: PageDto,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(@Query() request: SearchMedioPagoRequestDto): Promise<PageDto<MedioPagoDTO>> {
    const reqDto = plainToInstance(SearchMedioPagoRequestDto, request, {
      enableImplicitConversion: true,
    });
    return this.medioPagoService.search(reqDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener medio de pago por ID',
    description: 'Permite obtener un medio de pago por su ID',
  })
  @ApiParam({ name: 'id', description: 'ID del medio de pago' })
  @ApiOkResponse({ description: 'Medio de pago encontrado', type: MedioPagoDTO })
  @ApiNotFoundResponse({ description: 'Medio de pago no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MedioPagoDTO> {
    return this.medioPagoService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear medio de pago',
    description: 'Permite crear un nuevo medio de pago (billetera virtual o banco)',
  })
  @ApiBody({ type: CreateMedioPagoRequestDto, description: 'Datos del nuevo medio de pago' })
  @ApiOkResponse({ description: 'Medio de pago creado correctamente', type: MedioPagoDTO })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(@Body() body: CreateMedioPagoRequestDto): Promise<MedioPagoDTO> {
    return this.medioPagoService.create(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar medio de pago',
    description: 'Permite actualizar los datos de un medio de pago existente',
  })
  @ApiParam({ name: 'id', description: 'ID del medio de pago' })
  @ApiBody({ type: UpdateMedioPagoRequestDto, description: 'Datos a actualizar' })
  @ApiOkResponse({ description: 'Medio de pago actualizado correctamente', type: MedioPagoDTO })
  @ApiNotFoundResponse({ description: 'Medio de pago no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMedioPagoRequestDto,
  ): Promise<MedioPagoDTO> {
    return this.medioPagoService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar medio de pago',
    description: 'Elimina un medio de pago de forma lógica (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID del medio de pago' })
  @ApiOkResponse({ description: 'Medio de pago eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Medio de pago no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<string> {
    return this.medioPagoService.remove(id);
  }
}
