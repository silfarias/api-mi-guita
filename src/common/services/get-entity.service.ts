import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import {
    EntityManager,
    EntityTarget,
    FindOptionsWhere,
    ObjectLiteral,
} from "typeorm";
import { ERRORS } from "../errors/errors-codes";

@Injectable()
export class GetEntityService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Busca una entidad por su id. Lanza NotFoundException si no existe.
     */
    async findById<T extends ObjectLiteral>(
        entityClass: EntityTarget<T>,
        id: number,
        relations?: string[],
    ): Promise<T> {
        const found = await this.entityManager.findOne(entityClass as EntityTarget<ObjectLiteral>, {
            where: { id } as unknown as FindOptionsWhere<T>,
            relations: relations,
        });
        if (!found) {
            throw new NotFoundException({
                code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
                message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
                details: JSON.stringify({ id }),
            });
        }
        return found as T;
    }

    /**
     * Busca una entidad por un criterio (objeto where).
     * Retorna null si no encuentra.
     */
    async findOneBy<T extends ObjectLiteral>(
        entityClass: EntityTarget<T>,
        criteria: FindOptionsWhere<T>,
    ): Promise<T | null> {
        const found = await this.entityManager.findOne(entityClass as EntityTarget<ObjectLiteral>, {
            where: criteria,
        });
        return found as T | null;
    }

    /**
     * Busca una entidad por un criterio. Lanza NotFoundException si no existe.
     */
    async findOneByOrFail<T extends ObjectLiteral>(
        entityClass: EntityTarget<T>,
        criteria: FindOptionsWhere<T>,
    ): Promise<T> {
        const found = await this.entityManager.findOne(entityClass as EntityTarget<ObjectLiteral>, {
            where: criteria,
        });
        if (!found) {
            throw new NotFoundException({
                code: ERRORS.DATABASE.RECORD_NOT_FOUND.CODE,
                message: ERRORS.DATABASE.RECORD_NOT_FOUND.MESSAGE,
                details: JSON.stringify(criteria),
            });
        }
        return found as T;
    }
}