import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReactDocument = React & Document;

@Schema({ timestamps: true })
export class React {
  @Prop({ required: true, type: Types.ObjectId })
  postId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: Date, default: Date.now })
  reactedAt: Date;
}

export const ReactSchema = SchemaFactory.createForClass(React);

// Create a compound index for postId and userId to ensure one like per user per post
ReactSchema.index({ postId: 1, userId: 1 }, { unique: true });
