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
import { PresupuestoService } from './presupuesto.service';
import { PresupuestoDTO } from './dto/presupuesto.dto';
import { CreatePresupuestoRequestDto } from './dto/create-presupuesto-request.dto';
import { UpdatePresupuestoRequestDto } from './dto/update-presupuesto-request.dto';
import { SearchPresupuestoRequestDto } from './dto/search-presupuesto-request.dto';

@ApiTags('Presupuesto')
@Controller('presupuesto')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos por mes y año' })
  @ApiOkResponse({ description: 'Lista de presupuestos', type: [PresupuestoDTO] })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async list(
    @Query() query: SearchPresupuestoRequestDto,
    @Request() req: any,
  ): Promise<PresupuestoDTO[]> {
    const request = plainToInstance(SearchPresupuestoRequestDto, query, {
      enableImplicitConversion: true,
    });
    return this.presupuestoService.list(request, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener presupuesto por ID' })
  @ApiParam({ name: 'id', description: 'ID del presupuesto' })
  @ApiOkResponse({ type: PresupuestoDTO })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<PresupuestoDTO> {
    return this.presupuestoService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear presupuesto' })
  @ApiBody({ type: CreatePresupuestoRequestDto })
  @ApiOkResponse({ type: PresupuestoDTO })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() dto: CreatePresupuestoRequestDto,
    @Request() req: any,
  ): Promise<PresupuestoDTO> {
    return this.presupuestoService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar presupuesto' })
  @ApiParam({ name: 'id', description: 'ID del presupuesto' })
  @ApiBody({ type: UpdatePresupuestoRequestDto })
  @ApiOkResponse({ type: PresupuestoDTO })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresupuestoRequestDto,
    @Request() req: any,
  ): Promise<PresupuestoDTO> {
    return this.presupuestoService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar presupuesto' })
  @ApiParam({ name: 'id', description: 'ID del presupuesto' })
  @ApiOkResponse({ description: 'Presupuesto eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<string> {
    return this.presupuestoService.remove(id, req.user.id);
  }
}
