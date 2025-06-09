import { ApiProperty } from '@nestjs/swagger';

export class EditCommentDto {
    @ApiProperty({
        description: 'The ID of the comment to edit',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    commentId: string;

    @ApiProperty({
        description: 'The new content of the comment',
        example: 'Updated comment content'
    })
    content: string;
}