import { Module } from '@nestjs/common';
import { GrpcAuthGuard } from './common/guard/grpc-auth.guard';
import { ReactModule } from './modules/react/react.module';
import { GrpcAuthModule } from './common/guard/grpc-auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentModule } from './modules/comment/comment.module';
import { GrpcControllerModule } from './grpc/grpc.module';

@Module({
  imports: [
    ReactModule,
    GrpcAuthModule,
    GrpcControllerModule,
    ConfigModule.forRoot({
      envFilePath:
        '/home/user/NodeJs/Demo Project/Social_Media/interaction/bin/env.local',
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log(configService.get<string>('MONGO_URI'))
        return { uri: configService.get<string>('MONGO_URI') };
      },
    }),
    CommentModule,
  ],
  providers: [GrpcAuthGuard]
})
export class InteractionModule {}
