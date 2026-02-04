import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUsuarioRequestDto, CreateUsuarioRequestDtoWithPersonaId } from './dto/create-usuario-request.dto';
import { UpdateUsuarioRequestDto } from './dto/update-usuario-request.dto';
import { SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { LoginUsuarioRequestDto } from './dto/login-usuario-request.dto';
import { UsuarioDTO } from './dto/usuario.dto';

import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { PageDto } from 'src/common/dto/page.dto';
import { Usuario } from './entities/usuario.entity';
import { ERRORS } from 'src/common/errors/errors-codes';
import { PersonaRepository } from '../persona/repository/persona.repository';
import { PersonaMapper } from '../persona/mappers/persona.mapper';
import { CloudinaryService } from 'src/common/services/cloudinary.service';


@Injectable()
export class UsuarioService {
  constructor(
    private usuarioMapper: UsuarioMapper,
    private usuarioRepository: UsuarioRepository,

    private personaMapper: PersonaMapper,
    private personaRepository: PersonaRepository,
    private cloudinaryService: CloudinaryService,
  ) { }

  async find(criteria?: any): Promise<Usuario> {
    const findOptions = {
      ...criteria,
      relations: ['persona'],
    };
    const usuario = await this.usuarioRepository.findOne(findOptions);
    if (!usuario) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify(criteria),
      });
    }
    return usuario;
  }

  public async findByNombreUsuario(nombreUsuario: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { nombreUsuario: nombreUsuario },
      relations: ['persona'],
    });
    if (!usuario) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ nombreUsuario }),
      });
    }
    return usuario;
  }

  public async findByEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email: email },
      relations: ['persona'],
    });
    if (!usuario) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ email }),
      });
    }
    return usuario;
  }

  async findOne(id: number): Promise<UsuarioDTO> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      relations: ['persona'],
    });

    if (!usuario) {
      throw new NotFoundException({
        code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
        message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
        details: JSON.stringify({ id }),
      });
    }

    return await this.usuarioMapper.entity2DTO(usuario);
  }

  async search(request: SearchUsuarioRequestDto): Promise<PageDto<UsuarioDTO>> {
    const usuarioPage = await this.usuarioRepository.search(request);
    return this.usuarioMapper.page2Dto(request, usuarioPage);
  }

  async create(request: CreateUsuarioRequestDto, file?: Express.Multer.File): Promise<UsuarioDTO> {
    try {
      // Validar que el nombre de usuario no exista
      await this.validateUniqueUserName(request.nombreUsuario);
      await this.validateUniqueEmail(request.email);

      let urlFotoPerfil: string | null = null;

      // Paso 1: Subir foto de perfil si se proporciona
      if (file) {
        const timestamp = Date.now();
        const nombreArchivoLimpio = file.originalname
          ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
          : 'foto-perfil';
        const publicId = `mi-guita/fotos-perfiles/${nombreArchivoLimpio}_${timestamp}`;

        urlFotoPerfil = await this.cloudinaryService.uploadImageFromBuffer(
          file.buffer,
          publicId,
        );
      }

      // Paso 2: Crear y guardar la Persona
      const newPersona = await this.personaMapper.createDTO2Entity({
        nombre: request.nombre,
        apellido: request.apellido,
      });
      const personaSaved = await this.personaRepository.save(newPersona);

      // Paso 3: Crear el Usuario y asignarle la Persona guardada y la foto de perfil
      const newUsuario = await this.usuarioMapper.createDTO2Entity(request, personaSaved);
      newUsuario.fotoPerfil = urlFotoPerfil;
      const usuarioSaved = await this.usuarioRepository.save(newUsuario);

      // Paso 4: Buscar el usuario guardado con la relación de Persona
      const searchUsuario = await this.usuarioRepository.findOne({
        where: { id: usuarioSaved.id },
        relations: ['persona'],
      });

      if (!searchUsuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: usuarioSaved.id }),
        });
      }

      return this.usuarioMapper.entity2DTO(searchUsuario);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async createWithPersonaId(request: CreateUsuarioRequestDtoWithPersonaId, file?: Express.Multer.File): Promise<UsuarioDTO> {
    try {
      // Validar que el nombre de usuario no exista
      await this.validateUniqueUserName(request.nombreUsuario);
      await this.validateUniqueEmail(request.email);

      let urlFotoPerfil: string | null = null;

      // Paso 1: Subir foto de perfil si se proporciona
      if (file) {
        const timestamp = Date.now();
        const nombreArchivoLimpio = file.originalname
          ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
          : 'foto-perfil';
        const publicId = `mi-guita/fotos-perfiles/${nombreArchivoLimpio}_${timestamp}`;

        urlFotoPerfil = await this.cloudinaryService.uploadImageFromBuffer(
          file.buffer,
          publicId,
        );
      }

      // Paso 2: Buscar la persona completa
      const persona = await this.personaRepository.findOneById(request.personaId);
      
      // Paso 3: Crear el Usuario con la persona completa y la foto de perfil
      const newUsuario = await this.usuarioMapper.createDTO2EntityWithPersonaId(request, persona);
      newUsuario.fotoPerfil = urlFotoPerfil;
      const usuarioSaved = await this.usuarioRepository.save(newUsuario);

      // Paso 4: Buscar el usuario guardado con la relación de Persona cargada
      const searchUsuario = await this.usuarioRepository.findOne({
        where: { id: usuarioSaved.id },
        relations: ['persona'],
      });

      if (!searchUsuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id: usuarioSaved.id }),
        });
      }

      return this.usuarioMapper.entity2DTO(searchUsuario);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async update(
    id: number,
    request: SwaggerUpdateUsuarioRequestDto,
    usuarioId: number,
    file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    try {
      // 1. Verificar que el usuario existe y que el usuario autenticado solo puede actualizar su propio perfil
      const usuario = await this.find({ where: { id: id } });

      if (usuario.id !== usuarioId) {
        throw new BadRequestException({
          code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
          message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
          details: 'No tienes permiso para modificar este usuario',
        });
      }

      // Validar que el nombre de usuario no exista (si se está actualizando)
      if (
        request.nombreUsuario && request.nombreUsuario !== usuario.nombreUsuario
      ) {
        await this.validateUniqueUserName(request.nombreUsuario);
      }

      if (request.email && request.email !== usuario.email) {
        await this.validateUniqueEmail(request.email);
      }

      // 2. Manejar la foto de perfil
      // Prioridad de manejo:
      // 1. Si se envía file: se sube nueva imagen (se ignora urlFotoPerfil si también se envía)
      // 2. Si solo se envía urlFotoPerfil: se mantiene esa URL o se elimina si está vacía
      // 3. Si no se envía nada: se elimina la imagen de Cloudinary y la BD
      let nuevaUrlFotoPerfil: string | null = usuario.fotoPerfil;

      if (file) {
        // Si se envía un archivo nuevo, subirlo y eliminar la imagen anterior
        // IMPORTANTE: Si también se envía urlFotoPerfil, se ignora porque el archivo tiene prioridad
        const fotoAnteriorUrl: string | null = usuario.fotoPerfil;

        const timestamp = Date.now();
        const nombreArchivoLimpio = file.originalname
          ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
          : 'foto-perfil';
        const publicId = `mi-guita/fotos-perfiles/${nombreArchivoLimpio}_${timestamp}`;

        nuevaUrlFotoPerfil = await this.cloudinaryService.uploadImageFromBuffer(
          file.buffer,
          publicId,
        );

        // Eliminar la imagen anterior de Cloudinary si existe
        if (fotoAnteriorUrl) {
          try {
            await this.cloudinaryService.deleteImage(fotoAnteriorUrl);
          } catch (error) {
            console.warn(`No se pudo eliminar la imagen anterior: ${error.message}`);
          }
        }
      } else if (request.urlFotoPerfil !== undefined) {
        // Si se envía la URL de la imagen actual, mantenerla o eliminar si está vacía
        nuevaUrlFotoPerfil =
          request.urlFotoPerfil && request.urlFotoPerfil.trim() !== ''
            ? request.urlFotoPerfil.trim()
            : null;

        // Si se está eliminando la imagen (null) y había una anterior, eliminarla de Cloudinary
        if (nuevaUrlFotoPerfil === null && usuario.fotoPerfil) {
          try {
            await this.cloudinaryService.deleteImage(usuario.fotoPerfil);
          } catch (error) {
            console.warn(`No se pudo eliminar la imagen anterior: ${error.message}`);
          }
        }
      } else {
        // Si no se envía ni archivo ni URL, eliminar la imagen
        if (usuario.fotoPerfil) {
          try {
            await this.cloudinaryService.deleteImage(usuario.fotoPerfil);
          } catch (error) {
            console.warn(`No se pudo eliminar la imagen anterior: ${error.message}`);
          }
        }
        nuevaUrlFotoPerfil = null;
      }

      // 3. Actualizar la persona si se proporcionan campos de persona
      if (request.nombre !== undefined || request.apellido !== undefined) {
        if (!usuario.persona) {
          throw new NotFoundException({
            code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
            message: 'La persona asociada al usuario no fue encontrada',
            details: JSON.stringify({ usuarioId: id }),
          });
        }

        const personaActualizada = await this.personaMapper.updateDTO2Entity(
          usuario.persona,
          {
            nombre: request.nombre,
            apellido: request.apellido,
          },
        );
        await this.personaRepository.save(personaActualizada);
      }

      // 4. Actualizar el usuario
      const updateUsuario = await this.usuarioMapper.updateDTO2Entity(
        usuario,
        request,
      );
      updateUsuario.fotoPerfil = nuevaUrlFotoPerfil;
      await this.usuarioRepository.save(updateUsuario);

      // 5. Buscar el usuario actualizado
      const searchUsuario = await this.usuarioRepository.findOne({
        where: { id: id },
        relations: ['persona'],
      });

      if (!searchUsuario) {
        throw new NotFoundException({
          code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
          message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
          details: JSON.stringify({ id }),
        });
      }

      return this.usuarioMapper.entity2DTO(searchUsuario);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException({
        code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
        message: ERRORS.VALIDATION.INVALID_INPUT.MESSAGE,
        details: error.message,
      });
    }
  }

  async remove(id: number): Promise<string> {
    const usuario = await this.find({ where: { id: id }, relations: ['persona'] });
    
    // Eliminar la persona asociada (soft delete)
    if (usuario.persona) {
      await this.personaRepository.softRemove(usuario.persona);
    }
    
    // Eliminar el usuario (soft delete)
    await this.usuarioRepository.softRemove(usuario);
    return 'Usuario eliminado junto con su persona asociada';
  }

  private async validateUniqueUserName(nombreUsuario: string): Promise<void> {
    const existingUsuario = await this.usuarioRepository.findOne({
      where: { nombreUsuario: nombreUsuario },
    });
    if (existingUsuario) {
      throw new BadRequestException({
        code: ERRORS.ENTITY.NAME_ALREADY_EXISTS.CODE,
        message: 'El nombre de usuario ya está en uso por otra persona.',
        details: `El nombre de usuario "${nombreUsuario}" ya está registrado`,
      });
    }
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existingUsuario = await this.usuarioRepository.findOne({
      where: { email: email },
    });
    if (existingUsuario) {
      throw new BadRequestException({
        code: ERRORS.USER.EMAIL_ALREADY_EXISTS.CODE,
        message: ERRORS.USER.EMAIL_ALREADY_EXISTS.MESSAGE,
        details: `El email "${email}" ya está registrado`,
      });
    }
  }

  async login(loginDto: LoginUsuarioRequestDto): Promise<UsuarioDTO> {
    const usuario = await this.findByNombreUsuario(loginDto.nombreUsuario);

    const isPasswordValid = await bcrypt.compare(
      loginDto.contrasena,
      usuario.contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ERRORS.AUTHENTICATION.INVALID_CREDENTIALS.CODE,
        message: 'Credenciales inválidas',
        details: 'La contraseña es incorrecta',
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      throw new UnauthorizedException({
        code: ERRORS.AUTHENTICATION.ACCOUNT_DISABLED.CODE,
        message: 'La cuenta está deshabilitada',
      });
    }

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await this.usuarioRepository.save(usuario);

    return this.usuarioMapper.entity2DTO(usuario);
  }

  async updateUltimoAcceso(userId: number): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });
    if (usuario) {
      usuario.ultimoAcceso = new Date();
      await this.usuarioRepository.save(usuario);
    }
  }

  async changePassword(email: string, nuevaContrasena: string): Promise<void> {
    const usuario = await this.findByEmail(email);
    usuario.contrasena = await bcrypt.hash(nuevaContrasena, 10);
    await this.usuarioRepository.save(usuario);
  }
}
