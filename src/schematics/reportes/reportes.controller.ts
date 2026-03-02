import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReportesService } from './reportes.service';
import { ReporteCategoriasQueryDto } from './dto/reporte-categorias-query.dto';
import { ReporteCuentasQueryDto } from './dto/reporte-cuentas-query.dto';
import { ReporteEvolucionQueryDto } from './dto/reporte-evolucion-query.dto';
import { ReporteFlujoQueryDto } from './dto/reporte-flujo-query.dto';

@ApiTags('Reportes')
@Controller('reportes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('categorias')
  @ApiOperation({ summary: 'Reporte de gastos por categoría (mes y año)' })
  @ApiOkResponse({ description: 'Lista de categorías con total gastado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getPorCategoria(
    @Query() query: ReporteCategoriasQueryDto,
    @Request() req: any,
  ) {
    const dto = plainToInstance(ReporteCategoriasQueryDto, query, {
      enableImplicitConversion: true,
    });
    return this.reportesService.getReportePorCategoria(
      req.user.id,
      dto.mes,
      dto.anio,
    );
  }

  @Get('cuentas')
  @ApiOperation({
    summary:
      'Reporte de ingresos y egresos por cuenta (opcional: filtrar por mes y año)',
  })
  @ApiOkResponse({ description: 'Lista de cuentas con ingresos y egresos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getPorCuenta(
    @Query() query: ReporteCuentasQueryDto,
    @Request() req: any,
  ) {
    const dto = plainToInstance(ReporteCuentasQueryDto, query, {
      enableImplicitConversion: true,
    });
    return this.reportesService.getReportePorCuenta(
      req.user.id,
      dto.mes,
      dto.anio,
    );
  }

  @Get('evolucion')
  @ApiOperation({ summary: 'Evolución mensual del balance en el año' })
  @ApiOkResponse({ description: 'Balance por mes' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getEvolucion(
    @Query() query: ReporteEvolucionQueryDto,
    @Request() req: any,
  ) {
    const dto = plainToInstance(ReporteEvolucionQueryDto, query, {
      enableImplicitConversion: true,
    });
    return this.reportesService.getReporteEvolucion(req.user.id, dto.anio);
  }

  @Get('flujo')
  @ApiOperation({
    summary: 'Flujo de dinero: ingresos, egresos y balance (opcional: mes y año)',
  })
  @ApiOkResponse({ description: 'Ingresos, egresos y balance' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async getFlujo(
    @Query() query: ReporteFlujoQueryDto,
    @Request() req: any,
  ) {
    const dto = plainToInstance(ReporteFlujoQueryDto, query, {
      enableImplicitConversion: true,
    });
    return this.reportesService.getReporteFlujo(
      req.user.id,
      dto.mes,
      dto.anio,
    );
  }
}
