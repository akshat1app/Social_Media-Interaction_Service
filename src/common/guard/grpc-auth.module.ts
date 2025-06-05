import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcAuthGuard } from './grpc-auth.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, '../../../proto/user.proto'),
          url: 'localhost:5000',
          loader: { keepCase: true },
        },
      },
    ]),
  ],
  providers: [GrpcAuthGuard],
  exports: [GrpcAuthGuard,ClientsModule],
})
export class GrpcAuthModule {}
