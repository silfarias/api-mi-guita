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
import { ResumenPagoGastoFijoService } from './resumen-pago-gasto-fijo.service';
import { ResumenPagoGastoFijoDTO } from './dto/resumen-pago-gasto-fijo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Resumen Pago Gasto Fijo')
@Controller('resumen-pago-gasto-fijo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ResumenPagoGastoFijoController {
  constructor(
    private resumenPagoGastoFijoService: ResumenPagoGastoFijoService,
  ) {}

  @Get('info-inicial/:infoInicialId')
  @ApiOperation({ summary: 'Obtener resumen de pagos de gastos fijos por InfoInicial' })
  @ApiParam({ name: 'infoInicialId', required: true, description: 'ID de la Información Inicial (mes/año)' })
  @ApiOkResponse({
    type: ResumenPagoGastoFijoDTO,
    description: 'Resumen de pagos de gastos fijos obtenido correctamente',
  })
  @ApiNotFoundResponse({ description: 'No se encontró el resumen' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async findByInfoInicialId(
    @Param('infoInicialId', ParseIntPipe) infoInicialId: number,
    @Request() req: any,
  ): Promise<ResumenPagoGastoFijoDTO> {
    return await this.resumenPagoGastoFijoService.findByInfoInicialId(infoInicialId, req.user.id);
  }
}
