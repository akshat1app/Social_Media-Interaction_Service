import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactController } from './react.controller';
import { React, ReactSchema } from './schema/react.schema';
import { ReactService } from './react.service';
import { GrpcAuthModule } from '../common/guard/grpc-auth.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: React.name, schema: ReactSchema }]),
    GrpcAuthModule,
    KafkaModule
  ],
  controllers: [ReactController],
  providers: [ReactService]
})
export class ReactModule {}
