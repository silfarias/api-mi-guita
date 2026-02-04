// import {
//   Controller,
//   Post,
//   Get,
//   Patch,
//   Delete,
//   Param,
//   Body,
//   ParseIntPipe,
//   Query,
//   UseGuards,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiParam,
//   ApiBody,
//   ApiOkResponse,
//   ApiBadRequestResponse,
//   ApiNotFoundResponse,
//   ApiUnauthorizedResponse,
//   ApiBearerAuth,
// } from '@nestjs/swagger';
// import { PersonaService } from './persona.service';
// import { CreatePersonaRequestDto } from './dto/create-persona-request.dto';
// import { UpdatePersonaRequestDto } from './dto/update-persona-request.dto';
// import { SearchPersonaRequestDto } from './dto/search-persona-request.dto';
// import { PageDto } from 'src/common/dto/page.dto';
// import { PersonaDTO, PersonaEnrichedDTO } from './dto/persona.dto';
// import { plainToInstance } from 'class-transformer';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @ApiTags('Persona')
// @Controller('persona')
// export class PersonaController {
//   constructor(
//     private personaService: PersonaService,
//   ) { }

//   @Get('search')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('authorization')
//   @ApiOperation({ summary: 'Buscar personas' })
//   @ApiOkResponse({ type: PageDto, description: 'Lista paginada de Personas' })
//   @ApiUnauthorizedResponse({ description: 'No autorizado' })
//   async search(
//     @Query() request: SearchPersonaRequestDto,
//   ): Promise<PageDto<PersonaDTO>> {
//     const req = plainToInstance(SearchPersonaRequestDto, request);
//     return await this.personaService.search(req);
//   }

//   @Post()
//   @ApiOperation({ summary: 'Crear una Persona' })
//   @ApiBody({
//     type: CreatePersonaRequestDto,
//     description: 'Datos de la nueva Persona',
//   })
//   @ApiOkResponse({
//     type: PersonaDTO,
//     description: 'Persona creada correctamente',
//   })
//   @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
//   async create(
//     @Body() createPersonaRequestDto: CreatePersonaRequestDto,
//   ): Promise<PersonaDTO> {
//     return await this.personaService.create(createPersonaRequestDto);
//   }

//   @Patch(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('authorization')
//   @ApiOperation({ summary: 'Actualizar una Persona' })
//   @ApiParam({ name: 'id', required: true, description: 'ID de la Persona' })
//   @ApiBody({
//     type: UpdatePersonaRequestDto,
//     description: 'Datos nuevos de la Persona',
//   })
//   @ApiOkResponse({
//     type: PersonaDTO,
//     description: 'Persona actualizada correctamente',
//   })
//   @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
//   @ApiNotFoundResponse({ description: 'No se encontró la persona' })
//   @ApiUnauthorizedResponse({ description: 'No autorizado' })
//   async update(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() updatePersonaRequestDto: UpdatePersonaRequestDto,
//   ): Promise<PersonaDTO> {
//     return await this.personaService.update(id, updatePersonaRequestDto);
//   }

//   @Get(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('authorization')
//   @ApiOperation({ summary: 'Obtener una entidad Persona' })
//   @ApiParam({ name: 'id', required: true, description: 'ID de Persona' })
//   @ApiOkResponse({
//     type: PersonaEnrichedDTO,
//     description: 'Persona obtenida correctamente con sus usuarios',
//   })
//   @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
//   @ApiNotFoundResponse({ description: 'No se encontró la persona' })
//   @ApiUnauthorizedResponse({ description: 'No autorizado' })
//   async findOne(@Param('id', ParseIntPipe) id: number): Promise<PersonaEnrichedDTO> {
//     return await this.personaService.findOne(id);
//   }

//   @Delete(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('authorization')
//   @ApiOperation({ summary: 'Eliminar Persona' })
//   @ApiParam({ name: 'id', required: true, description: 'ID de la Persona' })
//   @ApiOkResponse({ description: 'Persona eliminada correctamente' })
//   @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
//   @ApiNotFoundResponse({ description: 'No se encontró la persona' })
//   @ApiUnauthorizedResponse({ description: 'No autorizado' })
//   async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
//     return await this.personaService.remove(id);
//   }
// }