import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { UsuarioDTO } from '../usuario/dto/usuario.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ERRORS } from 'src/common/errors/errors-codes';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private usuarioService: UsuarioService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    private getAccessTokenSecret(): string {
        return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';
    }

    private getRefreshTokenSecret(): string {
        return process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'tu_refresh_secreto';
    }

    private getAccessTokenExpiresIn(): string {
        return process.env.ACCESS_TOKEN_EXPIRES_IN || '1d';
    }

    private getRefreshTokenExpiresIn(): string {
        return process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    }

    /** Genera el payload común para access y refresh (solo sub para refresh, para mantenerlo ligero). */
    private buildPayload(usuario: UsuarioDTO) {
        return {
            sub: usuario.id,
            nombre: usuario.persona?.nombre,
            apellido: usuario.persona?.apellido,
            nombreUsuario: usuario.nombreUsuario,
            email: usuario.email,
        };
    }

    /** Genera access token (corto) y refresh token (largo) para el usuario. */
    private generateTokenPair(usuario: UsuarioDTO): { access_token: string; refresh_token: string } {
        const payload = this.buildPayload(usuario);
        const access_token = this.jwtService.sign(payload, {
            secret: this.getAccessTokenSecret(),
            expiresIn: this.getAccessTokenExpiresIn() as any,
        });
        const refresh_token = this.jwtService.sign(
            { sub: usuario.id },
            {
                secret: this.getRefreshTokenSecret(),
                expiresIn: this.getRefreshTokenExpiresIn() as any,
            },
        );
        return { access_token, refresh_token };
    }

    async validateUser(nombreUsuario: string, contrasena: string): Promise<UsuarioDTO> {
        return await this.usuarioService.login({ nombreUsuario, contrasena });
    }

    async login(usuario: UsuarioDTO) {
        const { access_token, refresh_token } = this.generateTokenPair(usuario);
        return {
            access_token,
            refresh_token,
            expires_in: this.getAccessTokenExpiresIn(),
            usuario,
        };
    }

    /** Intercambia un refresh token válido por un nuevo par de tokens (y datos de usuario). */
    async refreshTokens(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: string; usuario: UsuarioDTO }> {
        if (!refreshToken?.trim()) {
            throw new UnauthorizedException({
                code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
                message: 'Refresh token es requerido',
            });
        }
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.getRefreshTokenSecret(),
            }) as { sub: number };
            const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
            if (Number.isNaN(userId)) {
                throw new UnauthorizedException('Refresh token inválido');
            }
            const usuario = await this.usuarioService.findOne(userId);
            if (!usuario) {
                throw new UnauthorizedException('Usuario ya no existe');
            }
            const { access_token, refresh_token } = this.generateTokenPair(usuario);
            return {
                access_token,
                refresh_token,
                expires_in: this.getAccessTokenExpiresIn(),
                usuario,
            };
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            throw new UnauthorizedException({
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh token inválido o expirado',
            });
        }
    }

    async signup(signupDto: SignupRequestDto, file?: Express.Multer.File): Promise<SignupResponseDto> {
        const nuevoUsuario = await this.usuarioService.create(signupDto, file);
        const usuarioActualizado = await this.usuarioService.findOne(nuevoUsuario.id);
        const { access_token, refresh_token } = this.generateTokenPair(usuarioActualizado);
        // Envío de código de verificación en segundo plano (no bloquea la respuesta)
        this.sendVerificationEmailAfterSignup(usuarioActualizado.id, usuarioActualizado.email).catch((err) => {
            console.error('[AuthService] Error al enviar email de verificación tras signup:', err);
        });
        return {
            access_token,
            refresh_token,
            expires_in: this.getAccessTokenExpiresIn(),
            usuario: usuarioActualizado,
            message: 'Usuario registrado y autenticado exitosamente',
        };
    }

    private async sendVerificationEmailAfterSignup(usuarioId: number, email: string): Promise<void> {
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
        await this.usuarioService.setVerificationCode(usuarioId, codigo, expiraEn);
        await this.emailService.sendVerificationEmail(email, codigo);
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

        // No permitir cambiar contraseña si el email no está verificado (recuperación por email)
        const usuarioEntity = await this.usuarioService.findByEmail(changePasswordDto.email);
        if (!usuarioEntity.emailVerificado) {
            throw new BadRequestException({
                code: ERRORS.VALIDATION.INVALID_INPUT.CODE,
                message: 'Verificá tu correo primero para poder cambiar tu contraseña',
                details: 'Usá la opción "Verificar correo" en Mi cuenta o Perfil.',
            });
        }

        // Cambiar la contraseña usando el email proporcionado
        await this.usuarioService.changePassword(
            changePasswordDto.email,
            changePasswordDto.contrasena
        );

        // Buscar el usuario actualizado para retornarlo
        const usuarioEntity2 = await this.usuarioService.findByEmail(changePasswordDto.email);
        const usuarioDTO = await this.usuarioService.findOne(usuarioEntity2.id);

        return {
            message: 'Contraseña cambiada exitosamente',
            usuario: usuarioDTO
        };
    }

    async verifyEmail(userId: number, codigo: string): Promise<{ message: string; usuario: UsuarioDTO }> {
        const usuario = await this.usuarioService.verifyCode(userId, codigo);
        return {
            message: 'Correo verificado correctamente',
            usuario,
        };
    }

    async resendVerificationEmail(userId: number): Promise<{ message: string }> {
        const { email, codigo } = await this.usuarioService.resendVerificationCode(userId);
        await this.emailService.sendVerificationEmail(email, codigo);
        return { message: 'Código de verificación reenviado a tu correo' };
    }

    async logout(userId: number): Promise<{ message: string }> {
        return {
            message: 'Sesión cerrada exitosamente'
        };
    }
} 