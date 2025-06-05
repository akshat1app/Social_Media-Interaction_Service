import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { React, ReactDocument } from './schema/react.schema';
import { ReactDto } from '../dto/react.dto';
import { UnreactDto } from '../dto/unreact.dto';

@Injectable()
export class ReactService {
  constructor(@InjectModel(React.name) private reactModel: Model<ReactDocument>) {}

  async reactToPost(userId: string, dto: ReactDto) {
    const { postId, type } = dto;
    let like = await this.reactModel.findOne({ postId });

    if (!like) {
      like = await this.reactModel.create({
        postId,
        reactions: [{ userId, type }],
      });
    } else {
      const index = like.reactions.findIndex(r => r.userId === userId);
      if (index !== -1) {
        like.reactions[index].type = type;
        like.reactions[index].reactedAt = new Date();
      } else {
        like.reactions.push({ userId, type, reactedAt: new Date() });
      }
      await like.save();
    }

    return { message: 'Reaction updated successfully' };
  }

  async removeReaction(userId: string, dto: UnreactDto) {
    const likeDoc = await this.reactModel.findOne({ postId: dto.postId });
    if (!likeDoc) throw new NotFoundException('Post not found');

    likeDoc.reactions = likeDoc.reactions.filter(r => r.userId !== userId);
    await likeDoc.save();

    return { message: 'Reaction removed.' };
  }

  async getUserReaction(postId: string, userId: string) {
    const likeDoc = await this.reactModel.findOne({ postId });
    if (!likeDoc) return null;
    const userReaction = likeDoc.reactions.find(r => r.userId === userId);
    console.log(userReaction);
    return userReaction || null;
  }

  async getPostReactions(postId: string) {
    const likeDoc = await this.reactModel.findOne({ postId });
    return likeDoc?.reactions || [];
  }

  async getReactionSummary(postId: string) {
    const likeDoc = await this.reactModel.findOne({ postId });
    if (!likeDoc) return {};

    const summary = likeDoc.reactions.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  }
}
