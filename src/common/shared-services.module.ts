import { Global, Module } from '@nestjs/common';

import { GetEntityService } from './services/get-entity.service';
import { ErrorHandlerService } from './services/error-handler.service';

/**
 * Módulo que provee servicios compartidos (GetEntityService, ErrorHandlerService).
 * Importar este módulo en cualquier módulo que los inyecte.
 */
@Global()
@Module({
  providers: [GetEntityService, ErrorHandlerService],
  exports: [GetEntityService, ErrorHandlerService],
})
export class SharedServicesModule {}
