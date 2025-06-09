import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({
        description: 'The ID of the post to comment on',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    postId: string;

    @ApiProperty({
        description: 'The content of the comment',
        example: 'This is a great post!'
    })
    content: string;

    @ApiProperty({
        description: 'The ID of the parent comment if this is a reply',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174001'
    })
    parentCommentId?: string;

    @ApiProperty({
        description: 'The ID of the user being replied to',
        required: false,
        example: '123e4567-e89b-12d3-a456-426614174002'
    })
    replyToUserId?: string;
}
  