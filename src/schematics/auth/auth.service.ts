import { Injectable, Inject, forwardRef, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { UsuarioDTO } from '../usuario/dto/usuario.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UsuarioService))
        private usuarioService: UsuarioService,
        private jwtService: JwtService,
    ) { }

    async validateUser(nombreUsuario: string, contrasena: string): Promise<UsuarioDTO> {
        return await this.usuarioService.login({ nombreUsuario, contrasena });
    }

    async login(usuario: UsuarioDTO) {
        const payload = {
            sub: usuario.id,
            nombreUsuario: usuario.nombreUsuario
        };

        return {
            access_token: this.jwtService.sign(payload),
            usuario: usuario
        };
    }

    async signup(signupDto: SignupRequestDto, file?: Express.Multer.File): Promise<SignupResponseDto> {
        const nuevoUsuario = await this.usuarioService.create(signupDto, file);
        
        // Actualizar último acceso (primer acceso al registrarse y autenticarse)
        await this.usuarioService.updateUltimoAcceso(nuevoUsuario.id);
        
        // Buscar el usuario actualizado para retornarlo con ultimoAcceso actualizado
        const usuarioActualizado = await this.usuarioService.findOne(nuevoUsuario.id);
        
        const payload = {
            sub: usuarioActualizado.id,
            nombreUsuario: usuarioActualizado.nombreUsuario
        };

        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            usuario: usuarioActualizado,
            message: 'Usuario registrado y autenticado exitosamente'
        };
    }

    async getCurrentUser(userId: number): Promise<UsuarioDTO> {
        return await this.usuarioService.findOne(userId);
    }

    async changePassword(changePasswordDto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
        // Validar que las contraseñas coincidan
        if (changePasswordDto.contrasena !== changePasswordDto.confirmarContrasena) {
            throw new BadRequestException({
                code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
                message: 'Las contraseñas no coinciden',
                details: 'La contraseña y su confirmación deben ser iguales',
            });
        }

        // Cambiar la contraseña usando el email proporcionado
        await this.usuarioService.changePassword(
            changePasswordDto.email,
            changePasswordDto.contrasena
        );

        // Buscar el usuario actualizado para retornarlo
        const usuarioEntity = await this.usuarioService.findByEmail(changePasswordDto.email);
        const usuarioDTO = await this.usuarioService.findOne(usuarioEntity.id);

        return {
            message: 'Contraseña cambiada exitosamente',
            usuario: usuarioDTO
        };
    }

    async logout(userId: number): Promise<{ message: string }> {
        // Actualizar último acceso del usuario al cerrar sesión
        await this.usuarioService.updateUltimoAcceso(userId);
        
        return {
            message: 'Sesión cerrada exitosamente'
        };
    }
} 