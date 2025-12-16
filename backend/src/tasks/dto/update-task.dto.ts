import { IsOptional, IsEnum } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['status'] as const)
) {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}