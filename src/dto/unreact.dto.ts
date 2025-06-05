import { IsString, IsIn } from 'class-validator';

export class UnreactDto {
  @IsString()
  postId: string;
}