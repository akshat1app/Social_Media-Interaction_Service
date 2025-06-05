import { Module } from '@nestjs/common';
import { GrpcAuthGuard } from './common/guard/grpc-auth.guard';
import { ReactModule } from './react/react.module';
import { GrpcAuthModule } from './common/guard/grpc-auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ReactModule,
    GrpcAuthModule,

    ConfigModule.forRoot({
      envFilePath:
        '/home/user/NodeJs /Nest Framework/leave-management/bin/env.local',
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return { uri: configService.get<string>('MONGO_URI') };
      },
    }),
  ],
  providers: [GrpcAuthGuard]
})
export class InteractionModule {}
