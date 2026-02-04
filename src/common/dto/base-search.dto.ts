import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { IsInt, IsOptional, IsString } from 'class-validator';

export class BaseSearchDto {
  static DEFAULT_PAGE_NUMBER = 1;
  static DEFAULT_PAGE_SIZE = 9999;
  static MAX_PAGE_SIZE_ALLOWED = 9999;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy: string;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageSize: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageNumber: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  q: string;

  getPageNumber(): number {
    return this.pageNumber || BaseSearchDto.DEFAULT_PAGE_NUMBER;
  }

  getOffset(): number {
    const pageSize = this.getTake();
    return (this.getPageNumber() - 1) * pageSize;
  }

  getTake(): number {
    return Math.min(
      this.pageSize || BaseSearchDto.DEFAULT_PAGE_SIZE,
      BaseSearchDto.MAX_PAGE_SIZE_ALLOWED,
    );
  }
}
