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
import { InfoInicialService } from './info-inicial.service';
import { CreateInfoInicialRequestDto } from './dto/create-info-inicial-request.dto';
import { UpdateInfoInicialRequestDto } from './dto/update-info-inicial-request.dto';
import { SearchInfoInicialRequestDto } from './dto/search-info-inicial-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { InfoInicialDTO } from './dto/info-inicial.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Info Inicial')
@Controller('info-inicial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class InfoInicialController {
  constructor(
    private infoInicialService: InfoInicialService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar información inicial' })
  @ApiOkResponse({ 
    type: PageDto<InfoInicialDTO>, 
    description: 'Lista paginada de Información Inicial con datos del usuario' 
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchInfoInicialRequestDto
  ): Promise<PageDto<InfoInicialDTO>> {
    const reqDto = plainToInstance(SearchInfoInicialRequestDto, request);
    return await this.infoInicialService.search(reqDto);
  }

  @Get('por-usuario')
  @ApiOperation({ summary: 'Obtener información inicial del usuario autenticado' })
  @ApiOkResponse({ 
    type: PageDto<InfoInicialDTO>, 
    description: 'Lista paginada de Información Inicial del usuario autenticado con datos del usuario' 
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findByUsuarioAutenticado(
    @Request() req: any,
  ): Promise<PageDto<InfoInicialDTO>> {
    return await this.infoInicialService.findByUsuarioAutenticado(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear información inicial' })
  @ApiBody({
    type: CreateInfoInicialRequestDto,
    description: 'Datos de la información inicial del mes',
  })
  @ApiOkResponse({
    type: InfoInicialDTO,
    description: 'Información inicial creada correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async create(
    @Body() createInfoInicialRequestDto: CreateInfoInicialRequestDto,
    @Request() req: any,
  ): Promise<InfoInicialDTO> {
    return await this.infoInicialService.create(createInfoInicialRequestDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información inicial por ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Información Inicial' })
  @ApiOkResponse({
    type: InfoInicialDTO,
    description: 'Información inicial obtenida correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la información inicial' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InfoInicialDTO> {
    return await this.infoInicialService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información inicial' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Información Inicial' })
  @ApiBody({
    type: UpdateInfoInicialRequestDto,
    description: 'Datos actualizados de la información inicial',
  })
  @ApiOkResponse({
    type: InfoInicialDTO,
    description: 'Información inicial actualizada correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la información inicial' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInfoInicialRequestDto: UpdateInfoInicialRequestDto,
    @Request() req: any,
  ): Promise<InfoInicialDTO> {
    return await this.infoInicialService.update(id, updateInfoInicialRequestDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar información inicial' })
  @ApiParam({ name: 'id', required: true, description: 'ID de la Información Inicial' })
  @ApiOkResponse({ description: 'Información inicial eliminada correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró la información inicial' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<any> {
    return await this.infoInicialService.remove(id, req.user.id);
  }
}
