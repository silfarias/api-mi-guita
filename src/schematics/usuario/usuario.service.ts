import { Injectable, HttpException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { UsuarioMapper } from './mappers/usuario.mapper';
import { UsuarioRepository } from './repository/usuario.repository';
import { CreateUsuarioRequestDto } from './dto/create-usuario-request.dto';
import { SwaggerUpdateUsuarioRequestDto } from './dto/swagger-usuario-request.dto';
import { SearchUsuarioRequestDto } from './dto/search-usuario-request.dto';
import { UsuarioDTO } from './dto/usuario.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';
import { ERRORS } from 'src/common/errors/errors-codes';
import { Persona } from '../persona/entities/persona.entity';
import { PersonaService } from '../persona/persona.service';
import { LoginUsuarioRequestDto } from './dto/login-usuario-request.dto';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

const RELATIONS = ['persona'] as const;

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioMapper: UsuarioMapper,
    private readonly usuarioRepository: UsuarioRepository,

    private readonly getEntityService: GetEntityService,
    private readonly errorHandler: ErrorHandlerService,

    private readonly personaService: PersonaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /** Busca un usuario por criterio. Retorna null si no existe o no se pasa criterio. */
  async find(criteria?: FindOptionsWhere<Usuario>): Promise<Usuario | null> {
    if (criteria == null) return null;
    return this.usuarioRepository.findOne({
      where: criteria,
      relations: [...RELATIONS],
    });
  }

  async findById(id: number): Promise<UsuarioDTO> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, id, [
        'persona'
      ]);
      return this.usuarioMapper.entity2DTO(usuario);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async findByEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      relations: [...RELATIONS],
    });
    if (!usuario) this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { email });
    return usuario;
  }

  async findByNombreUsuario(nombreUsuario: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { nombreUsuario },
      relations: [...RELATIONS],
    });
  
    if (!usuario) this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { nombreUsuario });
    return usuario;
  }

  async search(request: SearchUsuarioRequestDto): Promise<PageDto<UsuarioDTO>> {
    try {
      const page = await this.usuarioRepository.search(request);
      return this.usuarioMapper.page2Dto(request, page);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async create(
    request: CreateUsuarioRequestDto,
    file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    let urlFotoPerfil: string | null = null;
    try {
      await this.validateUniqueEmail(request.email);
      await this.validateUniqueNombreUsuario(request.nombreUsuario);

      // Subir foto primero y guardar la URL para poder eliminarla si hay error
      urlFotoPerfil = await this.uploadFotoPerfilIfPresent(file);

      const personaDto = await this.personaService.create({
        nombre: request.nombre,
        apellido: request.apellido,
      });

      const persona = await this.getEntityService.findById(Persona, personaDto.id);
      const newUsuario = await this.usuarioMapper.createDTO2EntityWithPersonaId(
        { ...request, personaId: persona.id }
      );
      newUsuario.fotoPerfil = urlFotoPerfil;
      const usuarioSaved = await this.usuarioRepository.save(newUsuario);

      const withRelations = await this.usuarioRepository.findOne({
        where: { id: usuarioSaved.id },
        relations: [...RELATIONS],
      });
      if (!withRelations) this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { id: usuarioSaved.id });
      return this.usuarioMapper.entity2DTO(withRelations);
    } catch (error) {
      // Si se subió una foto y ocurrió un error, eliminarla de Cloudinary
      if (urlFotoPerfil) {
        try {
          await this.deleteFotoFromUrl(urlFotoPerfil);
        } catch (deleteError) {
          // Log del error pero no fallar por esto
          console.error('Error al eliminar foto de Cloudinary después de fallo:', deleteError);
        }
      }
      if (error instanceof HttpException) throw error;
      this.errorHandler.handleError(error);
    }
  }

  async update(
    id: number,
    request: SwaggerUpdateUsuarioRequestDto,
    usuarioId: number,
    file?: Express.Multer.File,
  ): Promise<UsuarioDTO> {
    let nuevaUrlFotoPerfil: string | null = null;
    let seSubioNuevaFoto = false;
    
    try {
      const usuario = await this.getEntityService.findById(Usuario, id, ['persona']);

      if (Number(usuario.id) !== Number(usuarioId)) {
        this.errorHandler.throwBadRequest(ERRORS.VALIDATION.INVALID_INPUT, 'No tienes permiso para modificar este usuario');
      }

      if (request.email && request.email !== usuario.email) {
        await this.validateUniqueEmail(request.email);
      }

      // Guardar si se va a subir una nueva foto
      seSubioNuevaFoto = !!file;
      
      nuevaUrlFotoPerfil = await this.resolveFotoPerfilOnUpdate(
        usuario,
        request.urlFotoPerfil,
        file,
      );

      if (request.nombre !== undefined || request.apellido !== undefined) {
        if (!usuario.persona) {
          this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { usuarioId: id });
        }
        await this.personaService.update(usuario.persona.id, {
          nombre: request.nombre,
          apellido: request.apellido,
        });
      }
      const updated = await this.usuarioMapper.updateDTO2Entity(usuario, request);
      updated.fotoPerfil = nuevaUrlFotoPerfil;
      await this.usuarioRepository.save(updated);

      const withRelations = await this.usuarioRepository.findOne({
        where: { id },
        relations: [...RELATIONS],
      });
      if (!withRelations) this.errorHandler.throwNotFound(ERRORS.DATABASE.RECORD_NOT_FOUND, { id });
      return this.usuarioMapper.entity2DTO(withRelations);
    } catch (error) {
      // Si se subió una nueva foto y ocurrió un error, eliminarla de Cloudinary
      // para evitar que quede huérfana en la nube
      if (seSubioNuevaFoto && nuevaUrlFotoPerfil) {
        try {
          await this.deleteFotoFromUrl(nuevaUrlFotoPerfil);
        } catch (deleteError) {
          // Log del error pero no fallar por esto
          console.error('Error al eliminar foto de Cloudinary después de fallo:', deleteError);
        }
      }
      this.errorHandler.handleError(error);
    }
  }

  async remove(id: number): Promise<string> {
    try {
      const usuario = await this.getEntityService.findById(Usuario, id, ['persona']);
      if (usuario.persona) {
        await this.personaService.remove(usuario.persona.id);
      }
      await this.usuarioRepository.softRemove(usuario);
      return 'Usuario eliminado correctamente';
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async login(loginDto: LoginUsuarioRequestDto): Promise<UsuarioDTO> {
    try {
      const usuario = await this.findByNombreUsuario(loginDto.nombreUsuario);
      const valid = await bcrypt.compare(loginDto.contrasena, usuario.contrasena);
      if (!valid) {
        this.errorHandler.throwUnauthorized(ERRORS.AUTHENTICATION.INVALID_CREDENTIALS, 'La contraseña es incorrecta');
      }
      return this.usuarioMapper.entity2DTO(usuario);
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  async changePassword(email: string, nuevaContrasena: string): Promise<void> {
    const usuario = await this.findByEmail(email);
    usuario.contrasena = await bcrypt.hash(nuevaContrasena, 10);
    await this.usuarioRepository.save(usuario);
  }

  /** Alias para Auth: obtener usuario por ID como DTO */
  findOne(id: number): Promise<UsuarioDTO> {
    return this.findById(id);
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.getEntityService.findOneBy(Usuario, {
      email,
    } as FindOptionsWhere<Usuario>);
    if (existing) {
      this.errorHandler.throwConflict(ERRORS.USER.EMAIL_ALREADY_EXISTS, { email });
    }
  }

  private async validateUniqueNombreUsuario(nombreUsuario: string): Promise<void> {
    const existing = await this.getEntityService.findOneBy(Usuario, {
      nombreUsuario,
    } as FindOptionsWhere<Usuario>);
    if (existing) {
      this.errorHandler.throwConflict(ERRORS.USER.NOMBRE_USUARIO_ALREADY_EXISTS, { nombreUsuario });
    }
  }

  private async uploadFotoPerfilIfPresent(
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (!file) return null;
    const safeName = file.originalname?.replace(/[^a-zA-Z0-9.-]/g, '_') ?? 'foto-perfil';
    const key = `mi-guita/fotos-perfiles/${safeName}_${Date.now()}`;
    return this.cloudinaryService.uploadImageFromBuffer(file.buffer, key);
  }

  private async resolveFotoPerfilOnUpdate(
    usuario: Usuario,
    urlFotoPerfil?: string,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (file) {
      if (usuario.fotoPerfil) {
        await this.deleteFotoFromUrl(usuario.fotoPerfil);
      }
      return this.uploadFotoPerfilIfPresent(file);
    }
    if (urlFotoPerfil !== undefined) {
      const nueva = urlFotoPerfil?.trim() || null;
      if (nueva === null && usuario.fotoPerfil) {
        await this.deleteFotoFromUrl(usuario.fotoPerfil);
      }
      return nueva;
    }
    if (usuario.fotoPerfil) {
      await this.deleteFotoFromUrl(usuario.fotoPerfil);
    }
    return null;
  }

  private async deleteFotoFromUrl(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
      if (path) await this.cloudinaryService.deleteImage(path);
    } catch {
      // ignorar errores al eliminar archivo remoto
    }
  }
}