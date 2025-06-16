import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class EditCommentDto {
  @ApiProperty({
    description: 'The ID of the comment to edit',
    example: '665fdd917712f702a44e6e04',
  })
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @ApiProperty({
    description: 'The new content of the comment',
    example: 'Updated comment content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
