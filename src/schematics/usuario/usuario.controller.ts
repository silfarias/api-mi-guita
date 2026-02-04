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
  UseInterceptors,
  UploadedFile,
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
  ApiForbiddenResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioRequestDto, CreateUsuarioRequestDtoWithPersonaId } from './dto/create-usuario-request.dto';
import { UpdateUsuarioRequestDto } from './dto/update-usuario-request.dto';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { UsuarioDTO } from './dto/usuario.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SwaggerCreateUsuarioRequestDto, SwaggerCreateUsuarioRequestDtoWithPersonaId, SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';

@ApiTags('Usuario')
@Controller('usuario')
export class UsuarioController {
  constructor(
    private usuarioService: UsuarioService,
  ) { }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Buscar usuarios' })
  @ApiOkResponse({ type: PageDto, description: 'Lista paginada de Usuarios' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchUsuarioRequestDto,
  ): Promise<PageDto<UsuarioDTO>> {
    const req = plainToInstance(SearchUsuarioRequestDto, request);
    return await this.usuarioService.search(req);
  }

  @Post()
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Crear un Usuario' })
  @ApiBody({
    type: SwaggerCreateUsuarioRequestDto,
    description: 'Datos del nuevo Usuario',
  })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Usuario creado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  async create(
    @Body() createUsuarioRequestDto: CreateUsuarioRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    return await this.usuarioService.create(createUsuarioRequestDto, file);
  }

  // @Post('with-id')
  // @UseInterceptors(FileInterceptor('fotoPerfil'))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({ 
  //   summary: 'Crear un Usuario con ID de Persona',
  //   description: 'Crea un nuevo usuario proporcionando su información personal y el ID de la persona'
  // })
  // @ApiBody({
  //   type: SwaggerCreateUsuarioRequestDtoWithPersonaId,
  //   description: 'Datos del nuevo Usuario proporcionando su información personal y el ID de la persona',
  // })
  // @ApiOkResponse({
  //   type: UsuarioDTO,
  //   description: 'Usuario creado correctamente',
  // })
  // @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  // async createWithPersonaId(
  //   @Body() createUsuarioRequestDtoWithPersonaId: CreateUsuarioRequestDtoWithPersonaId,
  //   @UploadedFile() file?: Express.Multer.File,
  // ): Promise<UsuarioDTO> {
  //   return await this.usuarioService.createWithPersonaId(createUsuarioRequestDtoWithPersonaId, file);
  // }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Actualizar un Usuario',
    description: 'Permite actualizar los datos del usuario, incluyendo foto de perfil opcional.'
  })
  @ApiParam({ name: 'id', required: true, description: 'ID del Usuario' })
  @ApiBody({
    type: SwaggerUpdateUsuarioRequestDto,
    description: 'Datos nuevos del Usuario',
  })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Usuario actualizado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioRequestDto: SwaggerUpdateUsuarioRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    return await this.usuarioService.update(id, updateUsuarioRequestDto, req.user.id, file);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Obtener una entidad Usuario' })
  @ApiParam({ name: 'id', required: true, description: 'ID de Usuario' })
  @ApiOkResponse({
    type: UsuarioDTO,
    description: 'Usuario obtenido correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UsuarioDTO> {
    return await this.usuarioService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ summary: 'Eliminar Usuario' })
  @ApiParam({ name: 'id', required: true, description: 'ID del Usuario' })
  @ApiOkResponse({ description: 'Usuario eliminado correctamente' })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.usuarioService.remove(id);
  }
}