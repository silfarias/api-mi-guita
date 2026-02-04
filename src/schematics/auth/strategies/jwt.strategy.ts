import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioService } from '../../usuario/usuario.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usuarioService: UsuarioService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura',
        });
    }

    async validate(payload: any) {
        const usuario = await this.usuarioService.findOne(payload.sub);
        return {
            id: usuario.id,
            nombreUsuario: usuario.nombreUsuario,
        };
    }
} 