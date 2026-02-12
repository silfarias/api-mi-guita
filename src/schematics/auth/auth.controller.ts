import { Controller, Post, Body, Get, Request, UseGuards, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiCreatedResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';

import { UsuarioDTO } from '../usuario/dto/usuario.dto';
import { LoginUsuarioRequestDto } from '../usuario/dto/login-usuario-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { ChangePasswordRequestDto } from './dto/change-password-request.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { SwaggerSignupRequestDto } from './dto/swagger-usuario-request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseInterceptors(FileInterceptor('fotoPerfil'))
  @ApiConsumes('multipart/form-data')
  @Post('signup')
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario y autenticarlo',
    description: 'Registra un nuevo usuario proporcionando su información personal y lo autentica con un token JWT'
  })
  @ApiBody({
    type: SwaggerSignupRequestDto,
    description: 'Datos del nuevo usuario',
  })
  @ApiCreatedResponse({
    type: SignupResponseDto,
    description: 'Usuario registrado y autenticado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta o usuario ya existe' })
  async signup(
    @Body() signupRequestDto: SignupRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SignupResponseDto> {
    return this.authService.signup(signupRequestDto, file);
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión de usuario',
    description: 'Inicia sesión de usuario proporcionando su email y contraseña'
  })
  @ApiBody({
    type: LoginUsuarioRequestDto,
    description: 'Credenciales de acceso: email y contraseña',
  })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Login exitoso con token JWT',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(
    @Body() loginUsuarioRequestDto: LoginUsuarioRequestDto,
  ): Promise<LoginResponseDto> {
    const usuario = await this.authService.validateUser(
      loginUsuarioRequestDto.nombreUsuario,
      loginUsuarioRequestDto.contrasena,
    );
    return this.authService.login(usuario);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Obtener información del usuario autenticado',
    description: 'Obtiene la información del usuario autenticado proporcionando su token JWT'
  })
  @ApiOkResponse({ 
    type: UsuarioDTO, 
    description: 'Información del usuario autenticado obtenida correctamente' 
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getCurrentUser(
    @Request() req: any
  ): Promise<UsuarioDTO> {
    return await this.authService.getCurrentUser(req.user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Cerrar sesión de usuario',
    description: 'Cierra la sesión del usuario autenticado. Actualiza el último acceso y el cliente debe eliminar el token del almacenamiento local.'
  })
  @ApiOkResponse({ 
    description: 'Sesión cerrada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sesión cerrada exitosamente'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async logout(
    @Request() req: any,
  ): Promise<{ message: string }> {
    return await this.authService.logout(req.user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('authorization')
  @ApiOperation({ 
    summary: 'Cambiar contraseña de usuario',
    description: 'Cambia la contraseña de un usuario proporcionando su email, nueva contraseña y confirmación.'
  })
  @ApiBody({
    type: ChangePasswordRequestDto,
    description: 'Datos para cambiar la contraseña: email, nueva contraseña y confirmación',
  })
  @ApiOkResponse({ 
    description: 'Contraseña cambiada exitosamente',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta: las contraseñas no coinciden o el email no existe' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    return await this.authService.changePassword(changePasswordDto);
  }
}
