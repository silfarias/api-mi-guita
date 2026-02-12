import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
    imports: [
        forwardRef(() => UsuarioModule),
        PassportModule,
        JwtModule.register({
            secret: process.env.ACCESS_TOKEN_SECRET || 'tu_clave_secreta_super_segura',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { } 