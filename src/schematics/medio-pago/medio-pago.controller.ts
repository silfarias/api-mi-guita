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
import { MedioPagoService } from './medio-pago.service';
import { CreateMedioPagoRequestDto } from './dto/create-medio-pago-request.dto';
import { UpdateMedioPagoRequestDto } from './dto/update-medio-pago-request.dto';
import { SearchMedioPagoRequestDto } from './dto/search-medio-pago-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { MedioPagoDTO } from './dto/medio-pago.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Medio de Pago')
@Controller('medio-pago')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class MedioPagoController {
  constructor(
    private medioPagoService: MedioPagoService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar medios de pago' })
  @ApiOkResponse({ type: PageDto, description: 'Lista paginada de Medios de Pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchMedioPagoRequestDto,
  ): Promise<PageDto<MedioPagoDTO>> {
    const reqDto = plainToInstance(SearchMedioPagoRequestDto, request);
    return await this.medioPagoService.search(reqDto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un medio de pago' })
  @ApiBody({
    type: CreateMedioPagoRequestDto,
    description: 'Datos del nuevo medio de pago (billetera virtual o banco)',
  })
  @ApiOkResponse({
    type: MedioPagoDTO,
    description: 'Medio de pago creado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createMedioPagoRequestDto: CreateMedioPagoRequestDto,
  ): Promise<MedioPagoDTO> {
    return await this.medioPagoService.create(createMedioPagoRequestDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener medio de pago por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Medio de Pago' })
  @ApiOkResponse({
    type: MedioPagoDTO,
    description: 'Medio de pago obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el medio de pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MedioPagoDTO> {
    return await this.medioPagoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar medio de pago' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Medio de Pago' })
  @ApiBody({
    type: UpdateMedioPagoRequestDto,
    description: 'Datos actualizados del medio de pago',
  })
  @ApiOkResponse({
    type: MedioPagoDTO,
    description: 'Medio de pago actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el medio de pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMedioPagoRequestDto: UpdateMedioPagoRequestDto,
  ): Promise<MedioPagoDTO> {
    return await this.medioPagoService.update(id, updateMedioPagoRequestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar medio de pago' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Medio de Pago' })
  @ApiOkResponse({ description: 'Medio de pago eliminado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el medio de pago' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.medioPagoService.remove(id);
  }
}
