import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { InfoInicialDTO } from 'src/schematics/info-inicial/dto/info-inicial.dto';
import { UsuarioDTO } from 'src/schematics/usuario/dto/usuario.dto';

export class ResumenPagoGastoFijoDTO extends CommonDTO {

  @ApiProperty({ description: 'Información inicial (mes/año) asociada', type: () => InfoInicialDTO })
  @Expose()
  @Type(() => InfoInicialDTO)
  infoInicial: InfoInicialDTO;

  @ApiProperty({ description: 'Usuario propietario', type: () => UsuarioDTO })
  @Expose()
  @Type(() => UsuarioDTO)
  usuario: UsuarioDTO;

  @ApiProperty({ description: 'Monto total de todos los gastos fijos del mes definidos', example: 50000.00 })
  @Expose()
  montoTotalDefinido: number;

  @ApiProperty({ description: 'Monto total pagado de gastos fijos en el mes', example: 30000.00 })
  @Expose()
  montoPagado: number;

  @ApiProperty({ description: 'Cantidad total de gastos fijos del mes', example: 5 })
  @Expose()
  cantidadGastosTotales: number;

  @ApiProperty({ description: 'Cantidad de gastos fijos pagados en el mes', example: 3 })
  @Expose()
  cantidadGastosPagados: number;

  @ApiProperty({ description: 'Monto pendiente de pagar (montoTotal - montoPagado)', example: 20000.00 })
  @Expose()
  montoPendiente: number;

  @ApiProperty({ description: 'Porcentaje de gastos fijos pagados', example: 60.0 })
  @Expose()
  porcentajePagado: number;
}
