// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PassportStrategy } from '@nestjs/passport';
// import { SistemaRepository } from 'src/schematics/sistema/repository/sistema.repository';
// import { JwtPayloadSystem } from './jwt-payload.interface';
// import { ExtractJwt } from 'passport-jwt';
// import { Sistema } from 'src/schematics/sistema/entities/sistema.entity';

// @Injectable()
// export class JwtStrategySystem extends PassportStrategy(Strategy, 'system') {
//   constructor(
//     private sistemaRepository: SistemaRepository,
//     private configService: ConfigService,
//   ) {
//     super({
//       secretOrKey: configService.get('JWT_SECRET'),
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//     });
//   }

//   async validate(payload: JwtPayloadSystem): Promise<Sistema> {
//     const { sistema_name } = payload;
//     const sistema: Sistema = await this.sistemaRepository.find({
//       where: {
//         sistema_name: sistema_name,
//       },
//     });

//     if (!sistema) {
//       throw new UnauthorizedException();
//     }

//     return sistema;
//   }
// }
