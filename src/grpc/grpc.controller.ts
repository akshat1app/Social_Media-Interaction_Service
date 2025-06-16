import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReactService } from '../modules/react/react.service';
import { CommentService } from '../modules/comment/comment.service';

@Controller()
export class GrpcController {
  constructor(
    private readonly reactService: ReactService,
    private readonly commentService: CommentService,
  ) {}

  @GrpcMethod('PostService', 'GetPostInteractionCounts')
  async getPostInteractionCounts(data: { postId: string, userId: string }) {
    try {
      // Get reaction count
      const reactions = await this.reactService.getPostReactions(data.postId);
      const reactionCount = reactions.pagination.totalReactions;

      // Get comment count
      const comments = await this.commentService.getCommentsByPost(data.postId);
      const commentCount = comments.pagination.totalComments;

      const isLiked = await this.reactService.getUserReaction(data.postId, data.userId)
      return {
        reactionCount,
        commentCount,
        isLiked:isLiked.liked
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