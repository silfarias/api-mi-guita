import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { ReporteMensualRequestDto } from './dto/reporte-mensual-request.dto';
import { ReporteMensualDTO } from './dto/reporte-mensual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';

@ApiTags('Reportes')
@Controller('reportes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ReportesController {
  constructor(
    private reportesService: ReportesService,
  ) {}

  @Get('mensual')
  @ApiOperation({ summary: 'Obtener reporte mensual de movimientos' })
  @ApiOkResponse({
    type: ReporteMensualDTO,
    description: 'Reporte mensual generado correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'No se encontró información inicial para el mes solicitado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async generarReporteMensual(
    @Query() request: ReporteMensualRequestDto,
    @Request() req: any,
  ): Promise<ReporteMensualDTO> {
    const reqDto = plainToInstance(ReporteMensualRequestDto, request);
    return await this.reportesService.generarReporteMensual(reqDto, req.user.id);
  }
}
