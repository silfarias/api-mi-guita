import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { MesEnum } from 'src/common/enums/mes-enum';
import { UsuarioDTO } from 'src/schematics/usuario/dto/usuario.dto';
import { MedioPagoInfoDTO } from './medio-pago-info.dto';

export class InfoInicialDTO extends CommonDTO {

  @ApiProperty({ description: 'Usuario propietario', type: () => UsuarioDTO, required: true })
  @Expose()
  @Type(() => UsuarioDTO)
  usuario: UsuarioDTO;

  @ApiProperty({ description: 'Año', example: 2026 })
  @Expose()
  anio: number;

  @ApiProperty({ description: 'Mes', enum: MesEnum, example: MesEnum.FEBRERO })
  @Expose()
  mes: MesEnum;

  @ApiProperty({ description: 'Medios de pago con sus montos iniciales', type: [MedioPagoInfoDTO] })
  @Expose()
  @Type(() => MedioPagoInfoDTO)
  mediosPago: MedioPagoInfoDTO[];

  @ApiProperty({ description: 'Monto total inicial (suma de todos los medios de pago)', example: 50000 })
  @Expose()
  montoTotal: number;
}
