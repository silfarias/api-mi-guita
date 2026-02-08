import { ApiProperty } from '@nestjs/swagger';
import { CommonDTO } from 'src/common/dto/common.dto';
import { Expose, Type } from 'class-transformer';
import { CategoriaDTO } from 'src/schematics/categoria/dto/categoria.dto';
import { GastoFijoPagoDTO } from './gasto-fijo-pago.dto';
import { UsuarioDTO } from 'src/schematics/usuario/dto/usuario.dto';

export class GastoFijoDTO extends CommonDTO {

  @ApiProperty({ description: 'Nombre del gasto fijo', example: 'Internet/WiFi' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Monto del gasto fijo', example: 5000.00 })
  @Expose()
  montoFijo: number;

  @ApiProperty({ description: 'Indica si el gasto fijo está activo para este usuario', example: true })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Categoría del gasto fijo', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;
}


export class MisGastosFijosDTO extends CommonDTO {
  
  @ApiProperty({ description: 'Usuario propietario', type: () => UsuarioDTO })
  @Expose()
  @Type(() => UsuarioDTO)
  usuario: UsuarioDTO;

  @ApiProperty({ description: 'Nombre del gasto fijo', example: 'Internet/WiFi' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Monto del gasto fijo', example: 5000.00 })
  @Expose()
  montoFijo: number;

  @ApiProperty({ description: 'Indica si el gasto fijo está activo', example: true })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Categoría del gasto fijo', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;

  @ApiProperty({ description: 'Pagos del gasto fijo', type: () => [GastoFijoPagoDTO] })
  @Expose()
  @Type(() => GastoFijoPagoDTO)
  pagos: GastoFijoPagoDTO[];

}

export class GastoFijoConPagosDTO extends CommonDTO {
  
  @ApiProperty({ description: 'Nombre del gasto fijo', example: 'Internet/WiFi' })
  @Expose()
  nombre: string;

  @ApiProperty({ description: 'Monto del gasto fijo', example: 5000.00 })
  @Expose()
  monto: number;

  @ApiProperty({ description: 'Indica si el gasto fijo está activo', example: true })
  @Expose()
  activo: boolean;

  @ApiProperty({ description: 'Categoría del gasto fijo', type: () => CategoriaDTO })
  @Expose()
  @Type(() => CategoriaDTO)
  categoria: CategoriaDTO;

  @ApiProperty({ description: 'Pagos del gasto fijo', type: () => [GastoFijoPagoDTO] })
  @Expose()
  @Type(() => GastoFijoPagoDTO)
  pagos: GastoFijoPagoDTO[];

}

import { PageMetadataDto } from 'src/common/dto/page-metadata.dto';

export class MisGastosFijosResponseDTO {
  
  @ApiProperty({ description: 'Usuario propietario', type: () => UsuarioDTO })
  @Expose()
  @Type(() => UsuarioDTO)
  usuario: UsuarioDTO;

  @ApiProperty({ description: 'Gastos fijos del usuario', type: () => [GastoFijoDTO] })
  @Expose()
  @Type(() => GastoFijoDTO)
  gastosFijos: GastoFijoDTO[];

  @ApiProperty({ description: 'Metadatos de paginación', type: () => PageMetadataDto })
  @Expose()
  @Type(() => PageMetadataDto)
  metadata: PageMetadataDto;

}