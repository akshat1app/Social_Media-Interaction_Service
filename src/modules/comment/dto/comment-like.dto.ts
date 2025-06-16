import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LikeCommentDto {
  @ApiProperty({
    description: 'The ID of the comment to like/unlike',
    example: '665fdd917712f702a44e6e05',
  })
  @IsString()
  @IsNotEmpty()
  commentId: string;
}
