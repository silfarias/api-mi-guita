// import { Injectable } from '@nestjs/common';
// import { plainToInstance } from 'class-transformer';
// import { CreateLogDTO } from '../dtos/create-log.dto';
// import { AuditLogs } from 'src/model/sysAuditLogs.entity';
// import { AuditLogsDTO } from '../dtos/audit-logs.dto';

// @Injectable()
// export class AuditLogsMapper {
//   async entityDTO(entity: AuditLogs): Promise<AuditLogsDTO> {
//     return plainToInstance(AuditLogsDTO, entity, {
//       excludeExtraneousValues: true,
//     });
//   }
//   async createDTOEntity(dto: Partial<CreateLogDTO>): Promise<AuditLogs> {
//     return plainToInstance(AuditLogs, dto);
//   }
// }

export class AuditLogsMapper {
  // static toDTO(entity: AuditLogs): AuditLogsDTO {
  //     return plainToInstance(AuditLogsDTO, entity, {
  //         excludeExtraneousValues: true,
  //     });
  // }
  // static toEntity(dto: AuditLogsDTO): AuditLogs {
  //     return plainToInstance(AuditLogs, dto);
  // }
}
