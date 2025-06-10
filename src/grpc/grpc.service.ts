import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface PostService {
  validatePost(data: { postId: string }): Observable<{ exists: boolean; userId: string }>;
  getPostInteractionCounts(data: { postId: string }): Observable<{ reactionCount: number; commentCount: number }>;
}

@Injectable()
export class GrpcService {
  private postService: PostService;

  constructor(@Inject('POST_PACKAGE') private client: ClientGrpc) {
    this.postService = this.client.getService<PostService>('PostService');
  }

  async validatePost(postId: string): Promise<{ exists: boolean; userId: string }> {
    try {
      const result = await lastValueFrom(
        this.postService.validatePost({ postId }),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getPostInteractionCounts(postId: string): Promise<{ reactionCount: number; commentCount: number }> {
    try {
      const result = await lastValueFrom(
        this.postService.getPostInteractionCounts({ postId }),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
} 