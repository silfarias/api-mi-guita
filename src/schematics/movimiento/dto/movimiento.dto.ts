import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { InfoInicialDTO } from 'src/schematics/info-inicial/dto/info-inicial.dto';
import { CategoriaDTO } from 'src/schematics/categoria/dto/categoria.dto';
import { MedioPagoDTO } from 'src/schematics/medio-pago/dto/medio-pago.dto';
import { IsEnum } from 'class-validator';

export class MovimientoDTO extends CommonDTO {
  @ApiProperty({ description: 'Fecha del movimiento', type: Date })
  @Expose()
  fecha: Date;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoEnum })
  @Expose()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento: TipoMovimientoEnum;

  @ApiProperty({ description: 'Categoría del movimiento', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;

  @ApiProperty({ description: 'Descripción del movimiento', type: String })
  @Expose()
  descripcion: string;

  @ApiProperty({ description: 'Monto del movimiento', type: Number })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Medio de pago utilizado', type: () => MedioPagoDTO })
  @Expose()
  @Type(() => MedioPagoDTO)
  medioPago: MedioPagoDTO;
}

export class MovimientoAgrupadoDTO {

  @ApiProperty({ description: 'Información inicial asociada', type: () => InfoInicialDTO })
  @Expose()
  @Type(() => InfoInicialDTO)
  infoInicial: InfoInicialDTO;

  @ApiProperty({ description: 'Movimientos agrupados por esta información inicial', type: () => [MovimientoDTO] })
  @Expose()
  @Type(() => MovimientoDTO)
  movimientos: MovimientoDTO[];

}