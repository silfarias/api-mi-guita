import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardResponse } from './dto/dashboard-response.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener todo el resumen del dashboard en una sola llamada (saldo, ingresos/egresos del mes, gastos por categoría/cuenta, últimos movimientos, presupuestos y alertas)',
  })
  @ApiOkResponse({ description: 'Datos del dashboard', type: Object })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos (mes, anio)' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getDashboard(
    @Query() query: DashboardQueryDto,
    @Request() req: any,
  ): Promise<DashboardResponse> {
    const dto = plainToInstance(DashboardQueryDto, query, {
      enableImplicitConversion: true,
    });
    return this.dashboardService.getDashboard(
      req.user.id,
      dto.mes,
      dto.anio,
    );
  }
}
