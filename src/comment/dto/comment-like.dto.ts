import { ApiProperty } from '@nestjs/swagger';

export class LikeCommentDto {
    @ApiProperty({
        description: 'The ID of the comment to like/unlike',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    commentId: string;
}