import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Categoria } from './entities/categoria.entity';
import { CategoriaMapper } from './mappers/categoria.mapper';
import { CategoriaRepository } from './repository/categoria.repository';
import { CategoriaController } from './categoria.controller';
import { CategoriaService } from './categoria.service';
import { GetEntityService } from 'src/common/services/get-entity.service';
import { ErrorHandlerService } from 'src/common/services/error-handler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria])],
  controllers: [CategoriaController],
  providers: [
    CategoriaService,
    CategoriaRepository,
    CategoriaMapper,
    GetEntityService,
    ErrorHandlerService,
  ],
  exports: [CategoriaService, CategoriaRepository, CategoriaMapper],
})
export class CategoriaModule {}
