import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, type: Types.ObjectId })
  postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, default: null })
  parentCommentId: Types.ObjectId | null;

  // for comment reply
  @Prop({ type: Types.ObjectId, default: null }) 
  replyToUserId: Types.ObjectId | null;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ default: false })
  isEdited: boolean;
}

export type CommentDocument = Comment & Document;
export const CommentSchema = SchemaFactory.createForClass(Comment);
