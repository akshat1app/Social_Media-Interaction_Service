import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KafkaProducerService } from 'src/kafka/kafka.service';
import { Comment, CommentDocument } from './schema/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';
import { GrpcService } from 'src/grpc/grpc.service';
import { ERROR } from './constant/message.constant';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly kafkaService: KafkaProducerService,
    private readonly grpcService: GrpcService,
  ) {}

  /**
   * Creates a new comment on a post
   * @param userId - The ID of the user creating the comment
   * @param dto - Contains postId, content, and optional parentCommentId and replyToUserId
   * @returns The created comment
   * @throws NotFoundException if post doesn't exist
   * @throws BadRequestException if any ID is invalid
   * @throws InternalServerErrorException if database operation fails
   */
  async createComment(userId: string, dto: CreateCommentDto){
    let postOwnerId: string;
    try {
      const result = await this.grpcService.validatePost(dto.postId);
      if (!result.exists) {
        throw new NotFoundException(ERROR.POST_NOT_FOUND);
      }
      postOwnerId = result.userId;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.VALIDATE_POST_FAILED);
    }

    try {
      // Validate all IDs
      if (!Types.ObjectId.isValid(dto.postId)) {
        throw new BadRequestException(ERROR.INVALID_IDS);
      }
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(ERROR.INVALID_IDS);
      }
      if (dto.parentCommentId && !Types.ObjectId.isValid(dto.parentCommentId)) {
        throw new BadRequestException(ERROR.INVALID_IDS);
      }
      if (dto.replyToUserId && !Types.ObjectId.isValid(dto.replyToUserId)) {
        throw new BadRequestException(ERROR.INVALID_IDS);
      }

      const comment = await this.commentModel.create({
        postId: new Types.ObjectId(dto.postId),
        userId: new Types.ObjectId(userId),
        content: dto.content,
        parentCommentId: dto.parentCommentId
          ? new Types.ObjectId(dto.parentCommentId)
          : null,
        replyToUserId: dto.replyToUserId
          ? new Types.ObjectId(dto.replyToUserId)
          : null,
      });

      // If this is a reply, increment the parent comment's reply count
      if (dto.parentCommentId) {
        await this.commentModel.findByIdAndUpdate(dto.parentCommentId, {
          $inc: { replyCount: 1 },
        });
      }

      let userName: string;
      let mediaURL: string;
      try {
        const user = await this.grpcService.getUserNameById(userId);
        userName = user.username;
        mediaURL = user.mediaUrl
      } catch (err) {
        throw new InternalServerErrorException(ERROR.FETCH_USER_FAILED);
      }

      try {
        if (dto.parentCommentId && dto.replyToUserId) {
          await this.kafkaService.emitReplyEvent(
            dto.postId,
            userId,
            userName,
            mediaURL,
            postOwnerId,
            dto.parentCommentId,
            dto.replyToUserId,
          );
        } else {
          await this.kafkaService.emitCommentEvent(
            dto.postId,
            userId,
            userName,
            mediaURL,
            postOwnerId,
          );
        }
      } catch (err) {
        // Log Kafka error but don't fail the request
        console.error('Failed to emit Kafka event:', err);
      }

      return comment; 

    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.CREATE_COMMENT_FAILED);
    }
  }

  /**
   * Edits an existing comment
   * @param userId - The ID of the user editing the comment
   * @param dto - Contains commentId and new content
   * @returns The updated comment
   * @throws NotFoundException if comment doesn't exist
   * @throws ForbiddenException if user is not the comment owner
   * @throws InternalServerErrorException if database operation fails
   */
  async editComment(userId: string, dto: EditCommentDto) {
    try {
      const comment = await this.commentModel.findById(dto.commentId);
      if (!comment) {
        throw new NotFoundException(ERROR.COMMENT_NOT_FOUND);
      }
      if (comment.userId.toString() !== userId) {
        throw new ForbiddenException(ERROR.NOT_COMMENT_OWNER);
      }

      comment.content = dto.content;
      comment.isEdited = true;
      await comment.save();
      return comment;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.EDIT_COMMENT_FAILED);
    }
  }

  /**
   * Deletes a comment
   * @param commentId - The ID of the comment to delete
   * @param userId - The ID of the user deleting the comment
   * @returns Success message
   * @throws NotFoundException if comment doesn't exist
   * @throws ForbiddenException if user is not the comment owner
   * @throws InternalServerErrorException if database operation fails
   */
  async deleteComment(commentId: string, userId: string) {
    try {
      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        throw new NotFoundException(ERROR.COMMENT_NOT_FOUND);
      }
      if (comment.userId.toString() !== userId) {
        throw new ForbiddenException(ERROR.NOT_COMMENT_OWNER);
      }

      // If this is a reply, decrement the parent comment's reply count
      if (comment.parentCommentId) {
        await this.commentModel.findByIdAndUpdate(comment.parentCommentId, {
          $inc: { replyCount: -1 },
        });
      }

      // If this is a parent comment, delete all its replies first
      if (!comment.parentCommentId) {
        await this.commentModel.deleteMany({ parentCommentId: comment._id });
      }

      await comment.deleteOne();
      return;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.DELETE_COMMENT_FAILED);
    }
  }

  /**
   * Toggles like status for a comment
   * @param userId - The ID of the user liking/unliking
   * @param commentId - The ID of the comment to like/unlike
   * @returns Object containing the new like status
   * @throws NotFoundException if comment doesn't exist
   * @throws InternalServerErrorException if database operation fails
   */
  async toggleLike(userId: string, commentId: string) {
    try {
      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        throw new NotFoundException(ERROR.COMMENT_NOT_FOUND);
      }

      const userObjId = new Types.ObjectId(userId);
      const alreadyLiked = comment.likedBy.some((id) => id.equals(userObjId));

      if (alreadyLiked) {
        comment.likedBy = comment.likedBy.filter((id) => !id.equals(userObjId));
        comment.likeCount--;
      } else {
        comment.likedBy.push(userObjId);
        comment.likeCount++;
      }

      await comment.save();
      return { liked: !alreadyLiked };
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(ERROR.TOGGLE_LIKE_FAILED);
    }
  }

  /**
   * Gets all comments for a post
   * @param postId - The ID of the post to get comments for
   * @param page - The page number to get
   * @param limit - The number of comments per page
   * @returns Array of comments with their replies count
   * @throws InternalServerErrorException if database operation fails
   */
  async getCommentsByPost(
    postId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
  
      const [comments, totalComments] = await Promise.all([
        this.commentModel.aggregate([
          {
            $match: {
              postId: new Types.ObjectId(postId),
              parentCommentId: null,
            },
          },
          {
            $lookup: {
              from: 'comments',
              localField: '_id',
              foreignField: 'parentCommentId',
              as: 'replies',
            },
          },
          {
            $addFields: {
              replyCount: { $size: '$replies' },
            },
          },
          {
            $project: {
              replies: 0,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          { $skip: skip },
          { $limit: limit },
        ]),
        this.commentModel.countDocuments({
          postId: new Types.ObjectId(postId),
          parentCommentId: null,
        }),
      ]);
  
      // Extract unique userIds from both userId and replyToUserId
      const userIdSet = new Set<string>();
      for (const c of comments) {
        userIdSet.add(c.userId.toString());
        if (c.replyToUserId) userIdSet.add(c.replyToUserId.toString());
      }
      const userIds = Array.from(userIdSet);
  
      // Call UserService to get usernames + mediaUrl
      const users = await this.grpcService.getMultipleUserNamesByIds(userIds);
      // users = [{ userId: '...', username: '...', mediaUrl: '...' }]
      const userMap = new Map(
        users.map((u) => [u.userId, { username: u.username, mediaUrl: u.mediaUrl }])
      );
  
      // Merge usernames & mediaUrl into comments
      const enrichedComments = comments.map((c) => {
        const userData = userMap.get(c.userId.toString());
        const replyToData = c.replyToUserId ? userMap.get(c.replyToUserId.toString()) : null;
  
        return {
          commentId: c._id,
          postId: c.postId,
          userId: c.userId,
          content: c.content,
          parentCommentId: c.parentCommentId,
          replyToUserId: c.replyToUserId,
          likeCount: c.likeCount,
          likedBy: c.likedBy,
          isEdited: c.isEdited,
          replyCount: c.replyCount,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
  
          username: userData?.username || 'Unknown',
          mediaUrl: userData?.mediaUrl || null,
  
          replyToUsername: replyToData?.username || (c.replyToUserId ? 'Unknown' : null),
          replyToMediaUrl: replyToData?.mediaUrl || (c.replyToUserId ? null : null),
        };
      });
  
      const remainingComments = totalComments - page * limit;
  
      return {
        comments: enrichedComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          remainingComments: remainingComments > 0 ? remainingComments : 0,
          hasMore: remainingComments > 0,
        },
      };
    } catch (err) {
      throw new InternalServerErrorException(ERROR.GET_COMMENTS_FAILED);
    }
  }
  

    /**
   * Gets all replies for a comment
   * @param parentCommentId - The ID of the parent comment
   * @param page - The page number
   * @param limit - Number of replies per page
   * @returns Array of replies with usernames
   * @throws InternalServerErrorException if database operation fails
   */
    async getRepliesByCommentId(
      parentCommentId: string,
      page: number = 1,
      limit: number = 10,
    ) {
      try {
        const skip = (page - 1) * limit;
    
        const [replies, totalReplies] = await Promise.all([
          this.commentModel.aggregate([
            {
              $match: {
                parentCommentId: new Types.ObjectId(parentCommentId),
              },
            },
            {
              $sort: { createdAt: -1 },
            },
            { $skip: skip },
            { $limit: limit },
          ]),
          this.commentModel.countDocuments({
            parentCommentId: new Types.ObjectId(parentCommentId),
          }),
        ]);
    
        // Collect unique userIds from userId and replyToUserId
        const userIdSet = new Set<string>();
        for (const r of replies) {
          userIdSet.add(r.userId.toString());
          if (r.replyToUserId) userIdSet.add(r.replyToUserId.toString());
        }
    
        const userIds = Array.from(userIdSet);
        const users = await this.grpcService.getMultipleUserNamesByIds(userIds);
        // users = [{ userId, username, mediaUrl }]
        const userMap = new Map(
          users.map((u) => [u.userId, { username: u.username, mediaUrl: u.mediaUrl }])
        );
    
        const enrichedReplies = replies.map((r) => {
          const userData = userMap.get(r.userId.toString());
          const replyToData = r.replyToUserId ? userMap.get(r.replyToUserId.toString()) : null;
    
          return {
            commentId: r._id,
            parentCommentId: r.parentCommentId,
            postId: r.postId,
            userId: r.userId,
            content: r.content,
            replyToUserId: r.replyToUserId,
            likeCount: r.likeCount,
            likedBy: r.likedBy,
            isEdited: r.isEdited,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
    
            username: userData?.username || 'Unknown',
            mediaUrl: userData?.mediaUrl || null,
    
            replyToUsername: replyToData?.username || (r.replyToUserId ? 'Unknown' : null),
            replyToMediaUrl: replyToData?.mediaUrl || (r.replyToUserId ? null : null),
          };
        });
    
        const remainingReplies = totalReplies - page * limit;
    
        return {
          replies: enrichedReplies,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalReplies / limit),
            totalReplies,
            remainingReplies: remainingReplies > 0 ? remainingReplies : 0,
            hasMore: remainingReplies > 0,
          },
        };
      } catch (err) {
        throw new InternalServerErrorException(ERROR.GET_REPLIES_FAILED);
      }
    }
    
  
}
