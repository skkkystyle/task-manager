import { IsString, IsOptional, IsEnum, IsNotIn } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @IsNotIn([TaskStatus.DONE], {
    message: 'Нельзя создать задачу со статусом "выполнено"'
  })
  status?: TaskStatus;
}