import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { ReactModule } from '../modules/react/react.module';
import { CommentModule } from '../modules/comment/comment.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'POST_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'post',
          protoPath: join(process.cwd(), 'proto/post.proto'),
          url: '0.0.0.0:50055',
        },
      },
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(process.cwd(), 'proto/user.proto'),
          url: 'localhost:50051',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
          channelOptions: {
            'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
            'grpc.max_send_message_length': 1024 * 1024 * 10, // 10MB
          },
        },
      },
    ]),
  ],
  providers: [GrpcService],
  exports: [GrpcService],
})
export class GrpcModule {}

@Module({
  imports: [
    forwardRef(() => ReactModule),
    forwardRef(() => CommentModule),
    forwardRef(() => GrpcModule),
  ],
  controllers: [GrpcController],
})
export class GrpcControllerModule {}
