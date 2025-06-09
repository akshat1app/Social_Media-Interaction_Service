import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, '../../../proto/auth.proto'),
          url: 'localhost:50052',
          loader: {
            keepCase: true,
          },
        },
      },
    ]),
  ],
  exports:[ClientsModule]
})
export class AuthClientModule {}
