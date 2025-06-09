import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnreactDto {
  @ApiProperty({
    description: 'The ID of the post to remove reaction from',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  postId: string;
}