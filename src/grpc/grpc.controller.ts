import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReactService } from '../react/react.service';
import { CommentService } from '../comment/comment.service';

@Controller()
export class GrpcController {
  constructor(
    private readonly reactService: ReactService,
    private readonly commentService: CommentService,
  ) {}

  @GrpcMethod('PostService', 'GetPostInteractionCounts')
  async getPostInteractionCounts(data: { postId: string }) {
    try {
      // Get reaction count
      const reactions = await this.reactService.getPostReactions(data.postId);
      const reactionCount = reactions.length;

      // Get comment count
      const comments = await this.commentService.getCommentsByPost(data.postId);
      const commentCount = comments.length;
      return {
        reactionCount,
        commentCount
      };
    } catch (error) {
      console.log("error")
      return {
        reactionCount: 0,
        commentCount: 0
      };
    }
  }
} 