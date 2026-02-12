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
            secretOrKey: process.env.ACCESS_TOKEN_SECRET || 'tu_clave_secreta_super_segura',
        });
    }

    async validate(payload: { sub: number | string; nombreUsuario?: string }) {
        const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
        if (Number.isNaN(userId)) return null;
        try {
            const usuario = await this.usuarioService.findOne(userId);
            if (!usuario) return null;
            return { id: usuario.id, nombreUsuario: usuario.nombreUsuario };
        } catch {
            return null; // usuario no encontrado o error → JWT inválido para esta petición → 401
        }
    }
} 