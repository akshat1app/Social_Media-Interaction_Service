import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from 'src/kafka/kafka.module';
import { GrpcAuthModule } from '../../common/guard/grpc-auth.module';
import { CommentService } from './comment.service';
import { Comment, CommentSchema } from './schema/comment.schema';
import { CommentController } from './comment.controller';
import { GrpcModule } from 'src/grpc/grpc.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    KafkaModule,
    GrpcAuthModule,
    forwardRef(() => GrpcModule)
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService]
})
export class CommentModule {}
