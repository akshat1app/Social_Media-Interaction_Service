import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface PostService {
  validatePost(data: { postId: string }): Observable<{ exists: boolean; userId: string }>;
  getPostInteractionCounts(data: { postId: string }): Observable<{ reactionCount: number; commentCount: number }>;
}

interface UserService {
  GetUserName(data: { userId: string }): Observable<{ fullName: string; username: string; mediaUrl: string }>;
  GetMultipleUserNames(data: { userIds: string[] }): Observable<{
    users: { userId: string; fullName: string; username: string; mediaUrl: string }[];
  }>;
}

@Injectable()
export class GrpcService implements OnModuleInit {
  private postService: PostService;
  private userService: UserService;

  constructor(
    @Inject('POST_PACKAGE') private readonly postClient: ClientGrpc,
    @Inject('USER_PACKAGE') private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    // Extract gRPC services here using exact service names from .proto
    this.postService = this.postClient.getService<PostService>('PostService');
    this.userService = this.userClient.getService<UserService>('UserService');
  }

  async validatePost(postId: string): Promise<{ exists: boolean; userId: string }> {
    return lastValueFrom(this.postService.validatePost({ postId }));
  }

  async getUserNameById(userId: string): Promise<{ fullName: string; username: string; mediaUrl: string }> {
    const result = await lastValueFrom(this.userService.GetUserName({ userId }));
    console.log('getUserNameById:', result);
    return result;
  }

  async getMultipleUserNamesByIds(userIds: string[]): Promise<{ userId: string; fullName: string; username: string; mediaUrl:string }[]> {
    const result = await lastValueFrom(this.userService.GetMultipleUserNames({ userIds }));
    console.log('getMultipleUserNamesByIds:', result);
    return result.users;
  }
}
