import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaRequestDto } from './dto/create-transferencia-request.dto';
import { TransferenciaDTO } from './dto/transferencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Transferencias')
@Controller('transferencias')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
export class TransferenciaController {
  constructor(
    private transferenciaService: TransferenciaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una transferencia entre medios de pago' })
  @ApiBody({
    type: CreateTransferenciaRequestDto,
    description: 'Datos de la transferencia',
  })
  @ApiOkResponse({
    type: TransferenciaDTO,
    description: 'Transferencia creada correctamente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
  @ApiNotFoundResponse({ description: 'Recurso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async crearTransferencia(
    @Body() createTransferenciaRequestDto: CreateTransferenciaRequestDto,
    @Request() req: any,
  ): Promise<TransferenciaDTO> {
    return await this.transferenciaService.crearTransferencia(createTransferenciaRequestDto, req.user.id);
  }
}
