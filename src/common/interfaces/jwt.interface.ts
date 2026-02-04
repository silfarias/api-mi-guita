// import { UsuarioDTO } from 'src/schematics/usuario/dto/usuario.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  verificationCode?: string;
}

// export interface JwtResponse {
//   accessToken: string;
//   refreshToken: string;
//   user: UsuarioDTO;
// }
