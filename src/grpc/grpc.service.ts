import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface PostService {
  validatePost(data: { postId: string }): Observable<{ exists: boolean; userId: string }>;
  getPostInteractionCounts(data: { postId: string }): Observable<{ reactionCount: number; commentCount: number }>;
}

interface UserService {
  GetUserName(data: { userId: string }): Observable<{ fullName: string; username: string }>;
}

@Injectable()
export class GrpcService {
  private postService: PostService;
  private userService: UserService;

  constructor(@Inject('POST_PACKAGE') private client: ClientGrpc,
  @Inject('USER_PACKAGE') private userClient: ClientGrpc
) {
    this.postService = this.client.getService<PostService>('PostService');
    this.userService = this.userClient.getService<UserService>('UserService');
  }
  onModuleInit() {
    // Use the service name from the .proto file EXACTLY here
    this.userService = this.userClient.getService<UserService>('UserService');
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


  async getUserNameById(userId: string): Promise<{ fullName: string; username: string }> {
    const result = await lastValueFrom(this.userService.GetUserName({ userId }));
    console.log(result);
    return result;
  }
  
} 