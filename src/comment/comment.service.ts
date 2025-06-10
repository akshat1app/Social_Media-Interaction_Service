import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KafkaProducerService } from 'src/kafka/kafka.service';
import { Comment, CommentDocument } from './schema/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly kafkaService: KafkaProducerService,
  ) {}

  async createComment(userId: string, dto: CreateCommentDto) {
    console.log('typeof postId:', typeof dto.postId);
    console.log('value of postId:', dto.postId);
  
    // Validate required IDs
    if (!Types.ObjectId.isValid(dto.postId)) {
      throw new BadRequestException('Invalid postId');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }
  
    // Validate optional IDs
    if (dto.parentCommentId && !Types.ObjectId.isValid(dto.parentCommentId)) {
      throw new BadRequestException('Invalid parentCommentId');
    }
    if (dto.replyToUserId && !Types.ObjectId.isValid(dto.replyToUserId)) {
      throw new BadRequestException('Invalid replyToUserId');
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
    const postOwnerId = 'some_user_id'
    if (dto.parentCommentId && dto.replyToUserId){
      await this.kafkaService.emitReplyEvent(dto.postId, userId, postOwnerId, dto.parentCommentId, dto.replyToUserId);
    }else{
      await this.kafkaService.emitCommentEvent(dto.postId, userId, postOwnerId);
    }
    return comment;
  }

  async editComment(userId: string, dto: EditCommentDto) {
    const comment = await this.commentModel.findById(dto.commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId.toString() !== userId)
      throw new ForbiddenException('Unauthorized');

    comment.content = dto.content;
    comment.isEdited = true;
    await comment.save();
    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId.toString() !== userId)
      throw new ForbiddenException('Unauthorized');

    await comment.deleteOne();
    return { message: 'Comment deleted' };
  }

  async toggleLike(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

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
  }

  async getCommentsByPost(postId: string) {
    const comments = await this.commentModel.aggregate([
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
          replies: 0, // optional: remove actual reply data
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return comments;
  }

  async getRepliesByCommentId(parentCommentId: string) {
    return this.commentModel.find({
      parentCommentId: new Types.ObjectId(parentCommentId),
    }).sort({ createdAt: 1 }); // oldest first like Instagram
  }
  
}
