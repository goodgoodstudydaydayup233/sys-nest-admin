import { IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchDeleteDto {
  @ApiProperty({ description: '用户ID数组', type: [Number] })
  @IsArray()
  @ArrayNotEmpty({ message: 'ID数组不能为空' })
  ids: number[];
}
