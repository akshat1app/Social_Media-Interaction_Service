import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'The ID of the post to comment on',
    example: '665d3e805be127abc1234567',
  })
  @IsMongoId()
  postId: string;

  @ApiProperty({
    description: 'The content of the comment',
    example: 'This is a great post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The ID of the parent comment if this is a reply',
    required: false,
    example: '665d3e805be127abc1234568',
  })
  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;

  @ApiProperty({
    description: 'The ID of the user being replied to',
    required: false,
    example: '665d3e805be127abc1234569',
  })
  @IsOptional()
  @IsMongoId()
  replyToUserId?: string;
}
