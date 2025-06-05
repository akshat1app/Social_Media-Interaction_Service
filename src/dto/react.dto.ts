import { IsString, IsIn } from 'class-validator';

export class ReactDto {
  @IsString()
  postId: string;

  @IsString()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'])
  type: string;
}
