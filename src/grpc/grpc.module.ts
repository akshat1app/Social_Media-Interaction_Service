import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcService } from './grpc.service';
import { GrpcController } from './grpc.controller';
import { ReactModule } from '../react/react.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'POST_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'post',
          protoPath: join(process.cwd(),'/proto/post.proto'),
          url: '0.0.0.0:50055',
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
    forwardRef(() => GrpcModule)
  ],
  controllers: [GrpcController]
})
export class GrpcControllerModule {} 