import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactController } from './react.controller';
import { React, ReactSchema } from './schema/react.schema';
import { ReactService } from './react.service';
import { GrpcAuthModule } from '../common/guard/grpc-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: React.name, schema: ReactSchema }]),
    GrpcAuthModule
  ],
  controllers: [ReactController],
  providers: [ReactService]
})
export class ReactModule {}
