import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PageDto } from 'src/common/dto/page.dto';

import { UsuarioService } from './usuario.service';

import { UsuarioDTO } from './dto/usuario.dto';
import { CreateUsuarioRequestDto } from './dto/create-usuario-request.dto';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { SwaggerCreateUsuarioRequestDto, SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';


@ApiTags('Usuario')
@Controller('usuario')
export class UsuarioController {

  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Buscar usuarios',
    description: 'Permite buscar usuarios por nombre de usuario, email o estado activo y retorna una lista paginada de usuarios'
  })
  @ApiOkResponse({ 
    description: 'Lista paginada de usuarios',
    type: PageDto<UsuarioDTO>
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async search(
    @Query() request: SearchUsuarioRequestDto,
  ): Promise<PageDto<UsuarioDTO>> {
    const req = plainToInstance(SearchUsuarioRequestDto, request);
    return this.usuarioService.search(req);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Obtener usuario por ID',
    description: 'Permite obtener un usuario por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({ 
    description: 'Usuario encontrado',
    type: UsuarioDTO
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<UsuarioDTO> {
    return this.usuarioService.findById(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Crear usuario (con datos de persona)',
    description: 'Permite crear un nuevo usuario incluyendo datos de persona'
  })
  @ApiBody({ type: SwaggerCreateUsuarioRequestDto })
  @ApiOkResponse({ 
    description: 'Usuario creado con éxito',
    type: UsuarioDTO 
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  async create(
    @Body() createDto: CreateUsuarioRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    return this.usuarioService.create(createDto, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Actualizar usuario',
    description: 'Permite actualizar los datos de un usuario existente'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiBody({ type: SwaggerUpdateUsuarioRequestDto })
  @ApiOkResponse({ 
    description: 'Usuario actualizado con éxito',
    type: UsuarioDTO 
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos de entrada no válidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async update(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: SwaggerUpdateUsuarioRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    return this.usuarioService.update(id, updateDto, req.user.id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Eliminar usuario (soft delete)',
    description: 'Permite eliminar un usuario de forma lógica'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({ 
    description: 'Usuario eliminado correctamente'
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<string> {
    return this.usuarioService.remove(id);
  }
}