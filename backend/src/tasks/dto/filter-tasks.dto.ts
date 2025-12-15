import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class FilterTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  search?: string;
}