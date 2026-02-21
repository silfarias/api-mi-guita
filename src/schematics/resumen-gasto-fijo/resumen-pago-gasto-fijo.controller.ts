import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { ResumenPagoGastoFijoService } from './resumen-pago-gasto-fijo.service';
import { ResumenPagoGastoFijoDTO } from './dto/resumen-pago-gasto-fijo.dto';

@ApiTags('Resumen Pago Gasto Fijo')
@Controller('resumen-pago-gasto-fijo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ResumenPagoGastoFijoController {
  constructor(private readonly resumenPagoGastoFijoService: ResumenPagoGastoFijoService) {}

  @Get('info-inicial/:infoInicialId')
  @ApiOperation({ summary: 'Obtener resumen de pagos de gastos fijos por InfoInicial' })
  @ApiParam({ name: 'infoInicialId', description: 'ID de la información inicial (mes/año)' })
  @ApiOkResponse({ description: 'Resumen obtenido correctamente', type: ResumenPagoGastoFijoDTO })
  @ApiNotFoundResponse({ description: 'Resumen no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findByInfoInicialId(
    @Param('infoInicialId', ParseIntPipe) infoInicialId: number,
    @Request() req: { user: { id: number } },
  ): Promise<ResumenPagoGastoFijoDTO> {
    return this.resumenPagoGastoFijoService.findByInfoInicialId(infoInicialId, req.user.id);
  }
}
