import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReactDto {
  @ApiProperty({
    description: 'The ID of the post to react to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  postId: string;

  @ApiProperty({
    description: 'The type of reaction',
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    example: 'like'
  })
  @IsString()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  type: string;
}
