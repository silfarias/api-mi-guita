import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { TipoMovimientoEnum } from 'src/common/enums/tipo-movimiento-enum';
import { CuentaDTO } from 'src/schematics/cuenta/dto/cuenta.dto';
import { CategoriaDTO } from 'src/schematics/categoria/dto/categoria.dto';
import { IsEnum } from 'class-validator';

export class MovimientoSimpleDTO extends CommonDTO {
  @ApiProperty({ description: 'Fecha del movimiento', type: Date })
  @Expose()
  fecha: Date;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoEnum })
  @Expose()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento: TipoMovimientoEnum;

  @ApiProperty({ description: 'Cuenta del movimiento', type: () => CuentaDTO })
  @Expose()
  @Type(() => CuentaDTO)
  cuenta: CuentaDTO;

  @ApiProperty({ description: 'Categoría del movimiento', type: () => CategoriaDTO, required: false })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria?: CategoriaDTO;

  @ApiProperty({ description: 'Descripción del movimiento', type: String })
  @Expose()
  descripcion: string;

  @ApiProperty({ description: 'Monto del movimiento', type: Number })
  @Expose()
  monto: number;
}

/** Movimiento dentro del listado agrupado por cuenta (no incluye cuenta, ya está en el grupo). */
export class MovimientoItemAgrupadoDTO extends CommonDTO {
  @ApiProperty({ description: 'Fecha del movimiento', type: Date })
  @Expose()
  fecha: Date;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoEnum })
  @Expose()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento: TipoMovimientoEnum;

  @ApiProperty({ description: 'Categoría del movimiento', type: () => CategoriaDTO, required: false })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria?: CategoriaDTO;

  @ApiProperty({ description: 'Descripción del movimiento', type: String })
  @Expose()
  descripcion: string;

  @ApiProperty({ description: 'Monto del movimiento', type: Number })
  @Expose()
  monto: number;
}

export class MovimientoDTO {
  @ApiProperty({ description: 'ID del movimiento' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Cuenta asociada', type: () => CuentaDTO })
  @Expose()
  @Type(() => CuentaDTO)
  cuenta: CuentaDTO;

  @ApiProperty({ description: 'Fecha del movimiento', type: Date })
  @Expose()
  fecha: Date;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimientoEnum })
  @Expose()
  @IsEnum(TipoMovimientoEnum)
  tipoMovimiento: TipoMovimientoEnum;

  @ApiProperty({ description: 'Categoría del movimiento', type: () => CategoriaDTO, required: false })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria?: CategoriaDTO;

  @ApiProperty({ description: 'Descripción del movimiento', type: String })
  @Expose()
  descripcion: string;

  @ApiProperty({ description: 'Monto del movimiento', type: Number })
  @Expose()
  monto: number;
}

export class MovimientoAgrupadoDTO {
  @ApiProperty({ description: 'Cuenta asociada', type: () => CuentaDTO })
  @Expose()
  @Type(() => CuentaDTO)
  cuenta: CuentaDTO;

  @ApiProperty({ description: 'Movimientos de esta cuenta (sin repetir cuenta)', type: () => [MovimientoItemAgrupadoDTO] })
  @Expose()
  @Type(() => MovimientoItemAgrupadoDTO)
  movimientos: MovimientoItemAgrupadoDTO[];
}
