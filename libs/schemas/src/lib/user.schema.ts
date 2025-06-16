import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  profilePicture: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: [] })
  followers: string[];

  @Prop({ default: [] })
  following: string[];
}

export const UserSchema = SchemaFactory.createForClass(User); 