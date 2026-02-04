import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from './entities/categoria.entity';
import { CategoriaMapper } from './mappers/categoria.mapper';
import { CategoriaRepository } from './repository/categoria.repository';
import { CategoriaController } from './categoria.controller';
import { CategoriaService } from './categoria.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categoria]),
  ],
  controllers: [CategoriaController],
  providers: [CategoriaService, CategoriaRepository, CategoriaMapper],
  exports: [CategoriaService, CategoriaRepository, CategoriaMapper],
})
export class CategoriaModule {}
