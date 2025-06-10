import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactController } from './react.controller';
import { React, ReactSchema } from './schema/react.schema';
import { ReactService } from './react.service';
import { GrpcAuthModule } from '../common/guard/grpc-auth.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { GrpcModule } from '../grpc/grpc.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: React.name, schema: ReactSchema }]),
    GrpcAuthModule,
    KafkaModule,
    forwardRef(() => GrpcModule)
  ],
  controllers: [ReactController],
  providers: [ReactService],
  exports: [ReactService]
})
export class ReactModule {}
