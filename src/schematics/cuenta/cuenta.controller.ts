import {
  Controller,
  Get,
  Post,
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
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PageDto } from 'src/common/dto/page.dto';
import { CuentaService } from './cuenta.service';
import { CuentaDTO } from './dto/cuenta.dto';
import { CreateCuentaRequestDto } from './dto/create-cuenta-request.dto';
import { CreateCuentaBulkRequestDto } from './dto/create-cuenta-bulk-request.dto';
import { UpdateCuentaRequestDto } from './dto/update-cuenta-request.dto';
import { SearchCuentaRequestDto } from './dto/search-cuenta-request.dto';

@ApiTags('Cuenta')
@Controller('cuenta')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class CuentaController {
  constructor(private readonly cuentaService: CuentaService) {}

  @Get('list')
  @ApiOperation({ summary: 'Listar todas las cuentas del usuario' })
  @ApiOkResponse({ description: 'Lista de cuentas del usuario', type: [CuentaDTO] })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async list(@Request() req: any): Promise<CuentaDTO[]> {
    return this.cuentaService.findAllByUsuario(req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar cuentas del usuario' })
  @ApiOkResponse({ description: 'Lista paginada de cuentas', type: PageDto })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchCuentaRequestDto,
    @Request() req: any,
  ): Promise<PageDto<CuentaDTO>> {
    const reqDto = plainToInstance(SearchCuentaRequestDto, request, {
      enableImplicitConversion: true,
    });
    return this.cuentaService.search(reqDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuenta por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiOkResponse({ type: CuentaDTO })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<CuentaDTO> {
    return this.cuentaService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuenta' })
  @ApiBody({ type: CreateCuentaRequestDto })
  @ApiOkResponse({ type: CuentaDTO })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createCuentaRequestDto: CreateCuentaRequestDto,
    @Request() req: any,
  ): Promise<CuentaDTO> {
    return this.cuentaService.create(createCuentaRequestDto, req.user.id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Crear varias cuentas en una sola solicitud' })
  @ApiBody({ type: CreateCuentaBulkRequestDto })
  @ApiOkResponse({ description: 'Cuentas creadas', type: [CuentaDTO] })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async createBulk(
    @Body() createCuentaBulkRequestDto: CreateCuentaBulkRequestDto,
    @Request() req: any,
  ): Promise<CuentaDTO[]> {
    return this.cuentaService.createBulk(createCuentaBulkRequestDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiBody({ type: UpdateCuentaRequestDto })
  @ApiOkResponse({ type: CuentaDTO })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCuentaRequestDto: UpdateCuentaRequestDto,
    @Request() req: any,
  ): Promise<CuentaDTO> {
    return this.cuentaService.update(id, updateCuentaRequestDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiOkResponse({ description: 'Cuenta eliminada correctamente' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<string> {
    return this.cuentaService.remove(id, req.user.id);
  }
}
