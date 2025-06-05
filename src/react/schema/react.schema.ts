import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReactDocument = React & Document;

@Schema({ timestamps: true })
export class React {
  @Prop({ required: true, unique: true })
  postId: string;

  @Prop([
    {
      userId: { type: String, required: true },
      type: {
        type: String,
        enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
        default: 'like',
      },
      reactedAt: { type: Date, default: Date.now },
    },
  ])
  reactions: {
    userId: string;
    type: string;
    reactedAt: Date;
  }[];
}

export const ReactSchema = SchemaFactory.createForClass(React);
