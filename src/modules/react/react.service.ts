import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { React, ReactDocument } from './schema/react.schema';
import { ReactDto } from './dto/react.dto';
import { KafkaProducerService } from 'src/kafka/kafka.service';
import { GrpcService } from '../../grpc/grpc.service';
import { SUCCESS, ERROR } from './constant/message.constant';

@Injectable()
export class ReactService {
  constructor(
    @InjectModel(React.name) private reactModel: Model<ReactDocument>,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly grpcService: GrpcService,
  ) {}

  /**
   * Adds or removes a user's like on a post
   * @param userId - The ID of the user liking the post
   * @param userName - The name of the user liking the post
   * @param dto - Contains postId
   * @returns Object with success message
   * @throws NotFoundException if post doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async reactToPost(userId: string, dto: ReactDto) {
    const { postId } = dto;
    let postOwnerId: string;
  
    // Validate post
    try {
      const result = await this.grpcService.validatePost(postId);
      if (!result.exists) throw new NotFoundException(ERROR.POST_NOT_FOUND);
      postOwnerId = result.userId;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(ERROR.VALIDATE_POST_FAILED);
    }

    // Check if already reacted
    try {
      const postObjectId = new Types.ObjectId(postId);
      const userObjectId = new Types.ObjectId(userId);
  
      const existingLike = await this.reactModel.findOne({
        postId: postObjectId,
        userId: userObjectId,
      });
  
      if (existingLike) {
        await this.reactModel.deleteOne({
          postId: postObjectId,
          userId: userObjectId,
        });
        return { liked: false };
      }
      
      // Save reaction without username
      try {
        await this.reactModel.create({
          postId: postObjectId,
          userId: userObjectId,
          reactedAt: new Date(),
        });
      } catch (err) {
        throw new InternalServerErrorException(ERROR.UPDATE_LIKE_FAILED);
      }
      
      // Call UserService now for username (for notification only, not DB)
      let userName: string;
      let mediaURL: string;
      try {
        const user = await this.grpcService.getUserNameById(userId);
        userName = user.username;
        mediaURL = user.mediaUrl;
      } catch (err) {
        throw new InternalServerErrorException(ERROR.FETCH_USER_FAILED);
      }
    
      await this.kafkaProducerService.emitLikeEvent(
        postId,
        userId,
        userName,
        mediaURL,
        postOwnerId,
      );
  
      return { liked: true };
    } catch (err) {
      throw new InternalServerErrorException(ERROR.UPDATE_LIKE_FAILED);
    }
  }
  

  /**
   * Gets a specific user's like status for a post
   * @param postId - The ID of the post
   * @param userId - The ID of the user to check
   * @returns Boolean indicating if the user has liked the post
   * @throws NotFoundException if post doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async getUserReaction(postId: string, userId: string) {
    try {
      const result = await this.grpcService.validatePost(postId);
      if (!result.exists) {
        throw new NotFoundException(ERROR.POST_NOT_FOUND);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.VALIDATE_POST_FAILED);
    }

    try {
      const postObjectId = new Types.ObjectId(postId);
      const userObjectId = new Types.ObjectId(userId);

      const like = await this.reactModel.findOne({
        postId: postObjectId,
        userId: userObjectId,
      });

      return { liked: !!like };
    } catch (err) {
      throw new InternalServerErrorException(ERROR.GET_LIKE_STATUS_FAILED);
    }
  }

  /**
   * Gets all likes for a specific post
   * @param postId - The ID of the post to get likes for
   * @param page - The page number to get
   * @param limit - The number of likes per page
   * @returns Object containing the paginated likes and pagination information
   * @throws NotFoundException if post doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async getPostReactions(postId: string, page: number = 1, limit: number = 10) {
    try {
      const result = await this.grpcService.validatePost(postId);
      if (!result.exists) {
        throw new NotFoundException(ERROR.POST_NOT_FOUND);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.VALIDATE_POST_FAILED);
    }
  
    try {
      const postObjectId = new Types.ObjectId(postId);
      const skip = (page - 1) * limit;
  
      const totalReactions = await this.reactModel.countDocuments({
        postId: postObjectId,
      });
  
      const reactions = await this.reactModel
        .find({ postId: postObjectId })
        .sort({ reactedAt: -1 })
        .skip(skip)
        .limit(limit);
  
      // Extract unique userIds
      const userIds = reactions.map(r => r.userId.toString());
  
      // Call UserService to get usernames
      const users = await this.grpcService.getMultipleUserNamesByIds(userIds);
      // Assume: users = [{ userId: "id1", username: "User1" }, ...]
      const userMap = new Map(users.map(u => [
        u.userId,
        { username: u.username, mediaUrl: u.mediaUrl }
      ]));
      
  
      // Merge username into reactions
      const enrichedReactions = reactions.map(r => {
        const userData = userMap.get(r.userId.toString());
        return {
          postId: r.postId,
          userId: r.userId,
          reactedAt: r.reactedAt,
          username: userData?.username || "Unknown",
          mediaUrl: userData?.mediaUrl || "Unknown"
        };
      });
  
      const remainingReactions = totalReactions - page * limit;
  
      return {
        reactions: enrichedReactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReactions / limit),
          totalReactions,
          remainingReactions: remainingReactions > 0 ? remainingReactions : 0,
          hasMore: remainingReactions > 0,
        },
      };
    } catch (err) {
      throw new InternalServerErrorException(ERROR.GET_POST_LIKES_FAILED);
    }
  }
  

  /**
   * Gets the total number of likes for a post
   * @param postId - The ID of the post to get like count for
   * @returns Object containing the total number of likes
   * @throws NotFoundException if post doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async getReactionSummary(postId: string) {
    try {
      const result = await this.grpcService.validatePost(postId);
      if (!result.exists) {
        throw new NotFoundException(ERROR.POST_NOT_FOUND);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.VALIDATE_POST_FAILED);
    }

    try {
      const postObjectId = new Types.ObjectId(postId);
      const count = await this.reactModel.countDocuments({
        postId: postObjectId,
      });
      return { likes: count };
    } catch (err) {
      throw new InternalServerErrorException(ERROR.GET_LIKE_COUNT_FAILED);
    }
  }
}
